import React from 'react'

const ChatBubble = ({text, isUser}) => {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className="flex flex-col items-start mx-2">
        <h4 className={`text-sm font-medium mb-1 ${
          isUser ? "text-gray-100" : "text-gray-100"
        }`}>
          {isUser ? "User" : "Bot"}
        </h4>
        <div
          className={`max-w-xs p-4 rounded-2xl shadow-md ${
            isUser
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </div>
  )
}

export default ChatBubble
