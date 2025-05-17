import React, { useState, useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import DatabaseStructure from "./DatabaseStructure";
import LoadingAnimation from "./LoadingAnimation";
import { isSupportedDatabaseFile, formatFileSize } from "../utils/dbParser";

const ChatArea = ({ socket }) => {
    const [messages, setMessages] = useState([
        { text: "Hello! Upload a database file to start analyzing it.", isUser: false }
    ]);
    const [activeFile, setActiveFile] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [dbStructure, setDbStructure] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const messagesEndRef = useRef(null);

    // Listen for socket events when socket prop changes
    useEffect(() => {
        if (!socket) return;
        
        const onConnect = () => {
            console.log("Connected to server");
            setIsConnected(true);
            setReconnecting(false);
        };
        
        const onDisconnect = () => {
            console.log("Disconnected from server");
            setIsConnected(false);
            setReconnecting(true);
        };
        
        const onConnectError = () => {
            setReconnecting(true);
        };
        
        const onReceiveMessage = (data) => {
            setMessages(prev => [...prev, data]);
        };
        
        const onFileSelected = (data) => {
            setActiveFile(data.filename);
            setMessages(prev => [
                ...prev, 
                { 
                    text: `File selected: ${data.filename}. Found ${data.tableCount} tables. You can now ask questions about this database.`, 
                    isUser: false 
                }
            ]);
            setAnalyzing(false);
        };
        
        const onDatabaseStructure = (data) => {
            setDbStructure(data);
            setStatusMessage('');
            setAnalyzing(false);
        };
        
        const onError = (data) => {
            setMessages(prev => [...prev, { text: data.message, isUser: false }]);
            setStatusMessage('');
            setAnalyzing(false);
        };
        
        const onStatus = (data) => {
            setStatusMessage(data.message);
            if (data.message.includes("Analyzing")) {
                setAnalyzing(true);
            }
        };
        
        // Set initial connection state
        setIsConnected(socket.connected);
        
        // Add event listeners
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", onConnectError);
        socket.on("receive_message", onReceiveMessage);
        socket.on("file_selected", onFileSelected);
        socket.on("database_structure", onDatabaseStructure);
        socket.on("error", onError);
        socket.on("status", onStatus);
        
        // Clean up listeners on unmount or when socket changes
        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", onConnectError);
            socket.off("receive_message", onReceiveMessage);
            socket.off("file_selected", onFileSelected);
            socket.off("database_structure", onDatabaseStructure);
            socket.off("error", onError);
            socket.off("status", onStatus);
        };
    }, [socket]);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (message) => {
        if (!socket || !isConnected) return;
        
        // Add the user message to the UI immediately
        setMessages(prev => [...prev, { text: message, isUser: true }]);
        
        // Send the message to the server
        socket.emit("send_message", { message });
    };

    const handleFileUpload = async (file) => {
        if (!socket || !isConnected) return;
        
        if (!isSupportedDatabaseFile(file)) {
            setMessages(prev => [
                ...prev, 
                { 
                    text: `Unsupported file type. Please upload a database file (.db, .sqlite, .csv, .xlsx, .sql)`, 
                    isUser: false 
                }
            ]);
            return;
        }
        
        setIsUploading(true);
        setDbStructure(null); // Clear previous structure
        setMessages(prev => [
            ...prev, 
            { 
                text: `Uploading ${file.name} (${formatFileSize(file.size)})...`, 
                isUser: false 
            }
        ]);
        
        try {
            // Create form data for file upload
            const formData = new FormData();
            formData.append("dbFile", file);
            
            // Add session ID to headers if available
            const headers = {
                'session-id': socket.id
            };
            
            // Upload the file
            const response = await fetch("http://localhost:5000/api/upload", {
                method: "POST",
                headers,
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Tell the server to use this file for the current session
                socket.emit("select_file", { filename: data.file.filename });
                
                setStatusMessage("Analyzing database structure...");
                setAnalyzing(true);
                
                setMessages(prev => [
                    ...prev, 
                    { 
                        text: `File ${file.name} uploaded successfully! Analyzing database structure...`, 
                        isUser: false 
                    }
                ]);
            } else {
                setMessages(prev => [
                    ...prev, 
                    { 
                        text: `Error uploading file: ${data.error || "Unknown error"}`, 
                        isUser: false 
                    }
                ]);
            }
        } catch (error) {
            console.error("Upload error:", error);
            setMessages(prev => [
                ...prev, 
                { 
                    text: `Error uploading file: ${error.message || "Connection failed"}`, 
                    isUser: false 
                }
            ]);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center w-full mt-5 h-full max-w-4xl mx-auto">
            <div className="w-full h-[80vh] border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg bg-gray-300 dark:bg-dark-card flex flex-col transition-all duration-300 overflow-hidden">
                <div className="flex-1 p-5 overflow-hidden flex flex-col">
                    <div className="space-y-4 flex-1 overflow-y-auto mb-4 scroll-smooth">
                        {messages.map((msg, index) => (
                            <ChatBubble key={index} text={msg.text} isUser={msg.isUser} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {analyzing && (
                        <div className="bg-info-light dark:bg-dark-hover text-info-DEFAULT dark:text-info-DEFAULT p-3 rounded-lg mb-3 transition-all duration-300 shadow-sm border border-info-light dark:border-info-dark">
                            <LoadingAnimation type="analyzing" text={statusMessage} />
                        </div>
                    )}
                    
                    {isUploading && (
                        <div className="bg-secondary-50 dark:bg-dark-hover text-secondary-600 dark:text-secondary-400 p-3 rounded-lg mb-3 transition-all duration-300 shadow-sm border border-secondary-100 dark:border-secondary-800">
                            <LoadingAnimation type="upload" text="Uploading file..." />
                        </div>
                    )}
                    
                    {reconnecting && (
                        <div className="bg-warning-light dark:bg-dark-hover text-warning-DEFAULT dark:text-warning-DEFAULT p-3 rounded-lg mb-3 transition-all duration-300 shadow-sm border border-warning-light dark:border-warning-dark">
                            <LoadingAnimation type="connecting" text="Reconnecting to server..." />
                        </div>
                    )}
                    
                    {!isConnected && !reconnecting && (
                        <div className="bg-danger-light dark:bg-dark-hover text-danger-DEFAULT dark:text-danger-DEFAULT p-3 rounded-lg mb-3 transition-all duration-300 shadow-sm border border-danger-light dark:border-danger-dark flex items-center justify-center">
                            <div className="w-2 h-2 bg-danger-DEFAULT rounded-full mr-2 animate-ping"></div>
                            <span>Disconnected from server</span>
                        </div>
                    )}
                    
                    {activeFile && isConnected && !(analyzing || isUploading || reconnecting) && (
                        <div className="bg-success-light dark:bg-dark-hover text-success-DEFAULT dark:text-success-DEFAULT p-3 rounded-lg mb-3 transition-all duration-300 shadow-sm border border-success-light dark:border-success-dark flex items-center justify-center">
                            <div className="w-2 h-2 bg-success-DEFAULT rounded-full mr-2"></div>
                            <span>Active file: {activeFile}</span>
                        </div>
                    )}
                    
                    {dbStructure && <DatabaseStructure structure={dbStructure} />}
                </div>
                
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-card transition-all duration-300">
                    <ChatInput 
                        onSendMessage={handleSendMessage} 
                        onFileUpload={handleFileUpload}
                        disabled={isUploading || !isConnected} 
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatArea;
