import React from 'react';
import PropTypes from 'prop-types';

const LoadingAnimation = ({ type = 'spinner', text = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const renderSpinner = () => (
    <div className={`inline-block ${sizeClasses[size]}`}>
      <div className="w-full h-full border-4 border-primary-700 border-t-primary-400 rounded-full animate-spin"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} bg-primary-600 rounded-full animate-pulse-slow`}></div>
  );

  const renderBars = () => (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-8 bg-primary-700 rounded animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-8 bg-primary-600 rounded animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-8 bg-primary-500 rounded animate-bounce" style={{ animationDelay: '300ms' }}></div>
      <div className="w-2 h-8 bg-primary-400 rounded animate-bounce" style={{ animationDelay: '450ms' }}></div>
      <div className="w-2 h-8 bg-primary-300 rounded animate-bounce" style={{ animationDelay: '600ms' }}></div>
    </div>
  );

  const renderDots = () => (
    <div className="flex space-x-2">
      <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
      <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
      <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
    </div>
  );

  const renderUpload = () => (
    <div className="flex items-center">
      <div className="w-12 h-12 relative">
        <div className="w-full h-full border-4 border-secondary-800 border-t-secondary-400 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-6 h-6 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      </div>
    </div>
  );

  // New improved connecting animation with just one loader
  const renderConnecting = () => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-10 h-10 border-4 border-warning-dark border-t-warning-DEFAULT rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-warning-DEFAULT rounded-full animate-ping opacity-75"></div>
        </div>
      </div>
      <div className="mt-2 w-16 h-1 bg-warning-dark rounded-full overflow-hidden">
        <div className="h-full bg-warning-DEFAULT animate-server-ping" 
             style={{ 
               width: '30%',
               animation: 'serverPing 1.5s ease-in-out infinite'
             }}></div>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center">
      <div className="flex space-x-1">
        <div className="w-2 h-6 bg-info-dark rounded animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-8 bg-info-light rounded animate-pulse" style={{ animationDelay: '100ms' }}></div>
        <div className="w-2 h-4 bg-info-light rounded animate-pulse" style={{ animationDelay: '200ms' }}></div>
        <div className="w-2 h-10 bg-info-light rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
        <div className="w-2 h-5 bg-info-light rounded animate-pulse" style={{ animationDelay: '400ms' }}></div>
        <div className="w-2 h-7 bg-info-light rounded animate-pulse" style={{ animationDelay: '500ms' }}></div>
        <div className="w-2 h-3 bg-info-dark rounded animate-pulse" style={{ animationDelay: '600ms' }}></div>
      </div>
    </div>
  );

  const renderAnimation = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner();
      case 'pulse':
        return renderPulse();
      case 'bars':
        return renderBars();
      case 'dots':
        return renderDots();
      case 'upload':
        return renderUpload();
      case 'connecting':
        return renderConnecting();
      case 'analyzing':
        return renderAnalyzing();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className="flex items-center justify-center space-x-3">
      {renderAnimation()}
      {text && <span className="text-dark-primary font-medium">{text}</span>}
    </div>
  );
};

LoadingAnimation.propTypes = {
  type: PropTypes.oneOf(['spinner', 'pulse', 'bars', 'dots', 'upload', 'connecting', 'analyzing']),
  text: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
};

export default LoadingAnimation;