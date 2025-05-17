import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";
import ChatArea from "./components/ChatArea";
import Header from "./components/Header";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Determine the backend URL based on environment
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socketUrl = isDevelopment 
      ? "http://localhost:5000"
      : window.location.origin; // In production, connect to the same origin
    
    // Initialize socket connection with Vercel-friendly options
    const socketInstance = io(socketUrl, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'], // Start with polling first, then try websocket
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // Increase timeout for Vercel
      forceNew: true
    });
    
    socketInstance.on("connect", () => {
      console.log("Connected with ID:", socketInstance.id);
      setSessionId(socketInstance.id);
      setConnectionError(null);
    });
    
    socketInstance.on("disconnect", () => {
      console.log("Disconnected from server");
      setSessionId('');
    });
    
    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnectionError("Failed to connect to server. Please try again later.");
    });
    
    setSocket(socketInstance);
    
    // Clean up on component unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen bg-dark-surface transition-colors duration-300">
        <Header sessionId={sessionId} />
        {connectionError && (
          <div className="bg-red-600 text-white p-2 text-center">
            {connectionError}
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <ChatArea socket={socket} />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
