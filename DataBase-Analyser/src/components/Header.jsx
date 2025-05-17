import React, { useEffect, useState } from 'react';
import "../css/header.css";
import { FiDatabase } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const Header = ({ sessionId }) => {
  const { theme } = useTheme();
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const truncatedSessionId = sessionId ? sessionId.substring(0, 6) : 'Not Connected';
  const isConnected = sessionId ? true : false;
  
  useEffect(() => {
    // Flash the connection status when it changes
    if (sessionId || sessionId === '') {
      setShowConnectionStatus(true);
      const timer = setTimeout(() => {
        setShowConnectionStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionId]);
  
  return (
    <div className="h-14 flex items-center justify-between bg-gray-600 px-4 shadow-sm transition-all duration-300">
      <div className="flex items-center">
        <div className="text-2xl mr-2 text-primary-500 transition-transform duration-300 transform hover:scale-110">
          <FiDatabase className={isConnected ? 'animate-pulse' : ''} />
        </div>
        <div className="text-xl text-white font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text">
          Database Analyser
        </div>
      </div>
    </div>
  );
};

export default Header;
