import React from 'react'
import { HiMiniPaperAirplane, HiMiniPaperClip } from "react-icons/hi2";


const ChatInput = () => {
  return (
    <div className="flex border-2 rounded-lg p-2">
      <input type="text" name="text" className="flex-11/12 outline-none text-amber-50" width={100} height={20} placeholder='Type here...'/>
      <button className="hover:bg-gray-600 text-white p-3 rounded-full shadow-md flex items-center justify-center">
        <HiMiniPaperClip className="w-5 h-5" />
      </button>

      {/* Send Button */}
      <button className="hover:bg-gray-600 text-white p-3 rounded-full shadow-md flex items-center justify-center">
        <HiMiniPaperAirplane className="w-5 h-5" />
      </button>
    </div>
  )
}

export default ChatInput
