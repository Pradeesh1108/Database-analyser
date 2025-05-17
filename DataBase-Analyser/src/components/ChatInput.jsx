import React, { useState, useRef } from 'react';
import { HiMiniPaperAirplane, HiMiniPaperClip } from "react-icons/hi2";


const ChatInput = ({ onSendMessage, onFileUpload, disabled }) => {
  const [message, setMessage] = useState('');
  const [isHoveringFile, setIsHoveringFile] = useState(false);
  const [isHoveringSend, setIsHoveringSend] = useState(false);
  const fileInputRef = useRef(null);

  const handleSendMessage = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && !disabled) {
      onFileUpload(file);
    }
  };

  const triggerFileUpload = () => {
    if (!disabled) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`flex items-center border rounded-lg p-2 transition-all duration-300 ${
      disabled 
        ? 'bg-neutral-100 dark:bg-dark-card border-neutral-200 dark:border-dark-hover' 
        : 'bg-white dark:bg-dark-input border-neutral-200 dark:border-neutral-700 shadow-sm'
    }`}>
      <input 
        type="text" 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`flex-1 outline-none px-2 py-1 rounded bg-transparent 
                  text-neutral-800 dark:text-dark-primary placeholder:text-neutral-400
                  dark:placeholder:text-dark-secondary transition-all duration-300 
                  ${disabled ? 'opacity-50' : 'opacity-100'}`}
        placeholder='Type here...'
        disabled={disabled}
      />
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".db,.sqlite,.csv,.xlsx,.sql" 
        style={{ display: 'none' }} 
      />
      
      {/* File Upload Button */}
      <button 
        onClick={triggerFileUpload}
        className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ml-2
                  ${disabled 
                    ? 'bg-neutral-200 dark:bg-dark-card text-neutral-400 dark:text-dark-secondary cursor-not-allowed' 
                    : isHoveringFile 
                    ? 'bg-secondary-50 dark:bg-dark-active text-secondary-600 dark:text-secondary-400 shadow-md scale-110' 
                    : 'hover:bg-secondary-50 dark:hover:bg-dark-hover text-secondary-500 dark:text-secondary-400'}`}
        disabled={disabled}
        onMouseEnter={() => setIsHoveringFile(true)}
        onMouseLeave={() => setIsHoveringFile(false)}
      >
        <HiMiniPaperClip className={`w-5 h-5 transition-transform duration-300 ${isHoveringFile ? 'rotate-12' : ''}`} />
      </button>

      {/* Send Button */}
      <button 
        onClick={handleSendMessage}
        className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ml-2
                  ${disabled 
                    ? 'bg-neutral-200 dark:bg-dark-card text-neutral-400 dark:text-dark-secondary cursor-not-allowed' 
                    : message.trim() === '' 
                    ? 'bg-neutral-100 dark:bg-dark-card text-primary-300 dark:text-dark-secondary cursor-not-allowed' 
                    : isHoveringSend 
                    ? 'bg-primary-50 dark:bg-dark-active text-primary-600 dark:text-primary-400 shadow-md scale-110' 
                    : 'hover:bg-primary-50 dark:hover:bg-dark-hover text-primary-500 dark:text-primary-400'}`}
        disabled={disabled || message.trim() === ''}
        onMouseEnter={() => setIsHoveringSend(true)}
        onMouseLeave={() => setIsHoveringSend(false)}
      >
        <HiMiniPaperAirplane className={`w-5 h-5 transition-all duration-300 
                                      ${isHoveringSend && message.trim() !== '' ? 'translate-x-0.5 -translate-y-0.5' : ''}`} />
      </button>
    </div>
  )
}

export default ChatInput
