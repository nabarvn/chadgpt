import React from "react";

const ChatEntrySkeleton = () => {
  return (
    <div className="flex animate-pulse cursor-pointer items-center space-x-2 rounded-lg px-3 py-3 text-sm text-gray-300">
      <div className="h-4 w-4 rounded-full bg-gray-600" />
      <div className="h-4 w-4/5 rounded-lg bg-gray-600" />
    </div>
  );
};

export default ChatEntrySkeleton;
