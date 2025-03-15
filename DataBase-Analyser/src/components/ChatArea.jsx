import React from "react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";

const ChatArea = () => {
    return (
        <div className="flex justify-center align-middle w-full mt-5 h-full ">
            <div className="w-2xl h-full border-2 border-black-100 p-5 rounded-lg shadow-md bg-[#7e7e7d]">
                <div className="space-y-4">
                    <ChatBubble text="Hello User" isUser={false} />
                    <ChatBubble text="Hello World" isUser={true} />
                </div>
                <ChatInput />
            </div>
        </div>
    );
};

export default ChatArea;
