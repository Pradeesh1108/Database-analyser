import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import http from 'http';
import { Server } from 'socket.io';
import DatabaseParser from './server/dbParser.js';

// Add new database-related package requirements
import sqlite3 from 'sqlite3';
import csvParser from 'csv-parser';
import xlsx from 'xlsx';

// Initialize the database parser - Create a proper instance of the class
const dbParser = new DatabaseParser();

// Initialize verbose mode
const sqliteVerbose = sqlite3.verbose();

const app = express();
const server = http.createServer(app);

// Check if we're in production (Vercel environment)
const isProduction = process.env.NODE_ENV === 'production';

// Configure Socket.IO for production or development
const io = new Server(server, {
  cors: {
    origin: isProduction ? [process.env.VERCEL_URL, process.env.PRODUCTION_URL || '*'] : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Adding these options for Vercel deployment compatibility
  transports: ['polling', 'websocket'], // Start with polling then upgrade to websocket
  path: '/socket.io/',
  allowEIO3: true,
  connectTimeout: 20000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e8
});

const PORT = process.env.PORT || 5000;

// Session storage for multiple users (in-memory for simplicity)
const userSessions = new Map();
// Store parsed database structures for quick access
const databaseCache = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Configure upload directory based on environment
const UPLOADS_DIR = isProduction ? '/tmp/uploads' : 'uploads/';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Ensure uploads directory exists
(async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('Uploads directory created or already exists');
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
})();

// If in production, serve static files from the build directory
if (isProduction) {
  app.use(express.static('dist'));
}

// Initialize Google Generative AI
// Replace with your actual API key
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_KEY || 'YOUR_API_KEY';
const genAI = new GoogleGenerativeAI(API_KEY);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Create a new session for this user
  userSessions.set(socket.id, {
    activeFile: null,
    chatHistory: [],
    parsedDbData: null,
    uploadedFiles: [] // Array to track files uploaded by this user
  });
  
  // Handle chat messages
  socket.on('send_message', async (data) => {
    try {
      const { message } = data;
      const userSession = userSessions.get(socket.id);
      
      if (!userSession) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      // Add user message to history
      userSession.chatHistory.push({ text: message, isUser: true });
      
      // Process the message with AI if a file is active
      if (userSession.activeFile) {
        const response = await processMessageWithAI(message, userSession.activeFile, userSession.parsedDbData);
        
        // Add AI response to history
        userSession.chatHistory.push({ text: response, isUser: false });
        
        // Send the response back to the user
        socket.emit('receive_message', { text: response, isUser: false });
      } else {
        // No file is selected
        const noFileMessage = "Please upload a database file first to analyze it.";
        userSession.chatHistory.push({ text: noFileMessage, isUser: false });
        socket.emit('receive_message', { text: noFileMessage, isUser: false });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Error processing your message' });
    }
  });
  
  // Handle file selection
  socket.on('select_file', async (data) => {
    try {
      const { filename } = data;
      const userSession = userSessions.get(socket.id);
      
      if (!userSession) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      const filePath = path.join(UPLOADS_DIR, filename);
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      
      if (!fileExists) {
        socket.emit('error', { message: 'File not found' });
        return;
      }
      
      // Set active file for this session
      userSession.activeFile = filename;
      
      // Parse database file if not already cached
      try {
        if (!databaseCache.has(filename)) {
          socket.emit('status', { message: 'Analyzing database structure...' });
          const parsedData = await dbParser.parseFile(filePath);
          databaseCache.set(filename, parsedData);
        }
        
        // Set the parsed data for this user's session
        userSession.parsedDbData = databaseCache.get(filename);
        
        // Send database structure to the client
        socket.emit('database_structure', userSession.parsedDbData);
        socket.emit('file_selected', { 
          filename, 
          tableCount: Object.keys(userSession.parsedDbData.tables).length 
        });
      } catch (error) {
        console.error('Error parsing database file:', error);
        socket.emit('error', { message: `Error analyzing database: ${error.message}` });
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      socket.emit('error', { message: 'Error selecting file' });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Get user session
    const userSession = userSessions.get(socket.id);
    if (userSession) {
      // Clean up any uploaded files
      if (userSession.activeFile) {
        try {
          const filePath = path.join(UPLOADS_DIR, userSession.activeFile);
          
          // Check if this file is used by other active sessions
          let isFileUsedByOthers = false;
          for (const [sessionId, session] of userSessions.entries()) {
            if (sessionId !== socket.id && session.activeFile === userSession.activeFile) {
              isFileUsedByOthers = true;
              break;
            }
          }
          
          // Only delete the file if no other session is using it
          if (!isFileUsedByOthers) {
            if (existsSync(filePath)) {
              await fs.unlink(filePath);
              console.log(`Deleted file: ${userSession.activeFile}`);
              
              // Also remove from cache
              databaseCache.delete(userSession.activeFile);
            }
          }
        } catch (error) {
          console.error(`Error deleting file: ${error.message}`);
        }
      }
      
      // Also clean up any other files uploaded by this user
      if (userSession.uploadedFiles && userSession.uploadedFiles.length > 0) {
        for (const filename of userSession.uploadedFiles) {
          try {
            // Skip the active file as it was already handled above
            if (filename === userSession.activeFile) continue;
            
            const filePath = path.join(UPLOADS_DIR, filename);
            
            // Check if this file is used by other active sessions
            let isFileUsedByOthers = false;
            for (const [sessionId, session] of userSessions.entries()) {
              if (sessionId !== socket.id && 
                 (session.activeFile === filename || 
                 (session.uploadedFiles && session.uploadedFiles.includes(filename)))) {
                isFileUsedByOthers = true;
                break;
              }
            }
            
            // Only delete if not used by others
            if (!isFileUsedByOthers) {
              if (existsSync(filePath)) {
                await fs.unlink(filePath);
                console.log(`Deleted file: ${filename}`);
                
                // Also remove from cache
                databaseCache.delete(filename);
              }
            }
          } catch (error) {
            console.error(`Error deleting file: ${error.message}`);
          }
        }
      }
    }
    
    // Clean up user session
    userSessions.delete(socket.id);
  });
});

// Helper function to process messages with AI
async function processMessageWithAI(message, filename, parsedDbData) {
  try {
    if (!parsedDbData) {
      const filePath = path.join(UPLOADS_DIR, filename);
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      
      if (!fileExists) {
        return "File not found. Please upload a database file first.";
      }
      
      try {
        // Parse the database file if not already done
        if (!databaseCache.has(filename)) {
          parsedDbData = await dbParser.parseFile(filePath);
          databaseCache.set(filename, parsedDbData);
        } else {
          parsedDbData = databaseCache.get(filename);
        }
      } catch (error) {
        console.error('Error parsing database for AI processing:', error);
        return "Error analyzing the database structure. Please try again or upload a different file.";
      }
    }
    
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create a structured summary of the database for the AI
    const dbSummary = formatDatabaseSummary(parsedDbData);
    
    // Create prompt with database summary
    const prompt = `
      You are a database analysis assistant. You will help analyze database structures and answer queries.
      
      DATABASE STRUCTURE:
      ${dbSummary}
      
      USER QUERY: ${message}
      
      Provide a helpful and accurate response to the query based on the database structure information.
      If you need to suggest SQL queries, provide them with clear explanations.
    `;
    
    // Generate response from AI
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    return response;
  } catch (error) {
    console.error('Error processing with AI:', error);
    return "Sorry, I encountered an error analyzing your database. Please try again.";
  }
}

// Format database summary for AI prompts
function formatDatabaseSummary(parsedData) {
  if (!parsedData || !parsedData.tables) {
    return "No database structure available.";
  }
  
  let summary = '';
  
  for (const [tableName, tableData] of Object.entries(parsedData.tables)) {
    summary += `Table: ${tableName}\n`;
    summary += `Row count: ${tableData.rowCount}\n`;
    
    // Add schema information
    if (tableData.schema && tableData.schema.length > 0) {
      summary += 'Columns:\n';
      tableData.schema.forEach(column => {
        summary += `  - ${column.name} (${column.type})${column.isPrimaryKey ? ' PRIMARY KEY' : ''}${column.notNull ? ' NOT NULL' : ''}\n`;
      });
    }
    
    // Add sample data if available
    if (tableData.sampleData && tableData.sampleData.length > 0) {
      summary += 'Sample data (first 3 rows):\n';
      tableData.sampleData.slice(0, 3).forEach((row, index) => {
        summary += `  Row ${index + 1}: ${JSON.stringify(row)}\n`;
      });
    }
    
    summary += '\n';
  }
  
  return summary;
}

// Define routes
app.post('/api/upload', upload.single('dbFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    };
    
    // If user has a session ID, associate file with their session
    const sessionId = req.headers['session-id'];
    if (sessionId && userSessions.has(sessionId)) {
      const userSession = userSessions.get(sessionId);
      userSession.activeFile = req.file.filename;
      
      // Add to the user's uploaded files list
      if (!userSession.uploadedFiles) {
        userSession.uploadedFiles = [];
      }
      userSession.uploadedFiles.push(req.file.filename);
      
      // Process the file asynchronously
      dbParser.parseFile(req.file.path)
        .then(parsedData => {
          // Cache the parsed data
          databaseCache.set(req.file.filename, parsedData);
          // Update the user session
          userSession.parsedDbData = parsedData;
          
          // Notify client that analysis is complete
          io.to(sessionId).emit('database_structure', parsedData);
        })
        .catch(error => {
          console.error('Error parsing uploaded file:', error);
          io.to(sessionId).emit('error', { 
            message: `Error analyzing database: ${error.message}` 
          });
        });
    }

    res.status(200).json({ success: true, file: fileInfo });
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get database structure
app.get('/api/structure/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(UPLOADS_DIR, filename);
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (!fileExists) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check cache first
    if (databaseCache.has(filename)) {
      return res.status(200).json(databaseCache.get(filename));
    }
    
    // Parse the file
    try {
      const parsedData = await dbParser.parseFile(filePath);
      databaseCache.set(filename, parsedData);
      res.status(200).json(parsedData);
    } catch (error) {
      console.error('Error parsing file for structure:', error);
      res.status(500).json({ error: `Error analyzing database: ${error.message}` });
    }
  } catch (error) {
    console.error('Error getting structure:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route for serving the React app in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('dist', 'index.html'));
  });
}

// Start server if not in production (Vercel will handle this in production)
if (!isProduction) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Add CORS headers for Socket.IO requests in Vercel environment
if (isProduction) {
  app.use((req, res, next) => {
    const allowedOrigins = [process.env.VERCEL_URL, process.env.PRODUCTION_URL || '*'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET,POST');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, session-id');
      res.header('Access-Control-Allow-Credentials', true);
    }
    
    next();
  });
}

// Export configuration for Vercel serverless functions
export default async (req, res) => {
  // For WebSocket handling, we must use the standard export
  if (!res) {
    return server;
  }
  
  // For HTTP requests, allow Express to handle everything
  return app(req, res);
}