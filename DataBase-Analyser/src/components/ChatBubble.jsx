import React from 'react';
import PropTypes from 'prop-types';

const ChatBubble = ({ text, isUser }) => {
  const baseClass = "px-4 py-3 rounded-lg max-w-3/4 break-words shadow-sm animate-fade-in";
  const userClasses = "bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-100 ml-auto rounded-br-none";
  const botClasses = "bg-neutral-100 dark:bg-dark-card text-neutral-800 dark:text-dark-primary mr-auto rounded-bl-none";

  return (
    <div className={`${baseClass} ${isUser ? userClasses : botClasses} transform transition-all duration-300 hover:scale-[1.01]`}>
      {text}
    </div>
  );
};

// Add the fade-in animation at the global CSS level
const addFadeInAnimation = () => {
  // Check if the animation already exists
  if (!document.querySelector('#fade-in-animation')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'fade-in-animation';
    styleSheet.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(styleSheet);
  }
};

// Execute once when component is imported
addFadeInAnimation();

ChatBubble.propTypes = {
  text: PropTypes.string.isRequired,
  isUser: PropTypes.bool.isRequired
};

export default ChatBubble;
