import React from "react";
import "./message-loading.css";

const MessageLoading: React.FC = () => {
  return (
    <div className="loading-pulse">
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default MessageLoading;
