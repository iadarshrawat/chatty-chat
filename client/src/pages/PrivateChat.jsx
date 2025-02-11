import React, { useEffect, useState } from "react";
import newSocket from "../socket/socket.config";
import "../style/chat.scss";
import { useParams } from "react-router-dom";

const PrivateChat = () => {
  const { id } = useParams();  // Get recipient ID from URL
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [recipientId, setRecipientId] = useState(id || ""); // Allow both URL and manual input

  useEffect(() => {
    newSocket.on("newMessage", ({ message, senderId }) => {
      setMessages((prev) => [...prev, { text: message, sender: senderId }]);
    });

    return () => {
      newSocket.off("newMessage");
    };
  }, [recipientId]); 

  const sendMessage = () => {
    if (recipientId && message.trim()) {
      newSocket.emit("privateMessage", { recipientId, message }); // ✅ Ensure correct event
      setMessages((prev) => [...prev, { text: message, sender: "You" }]);
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <h2>Private Chat</h2>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <p key={index} className={msg.sender === "You" ? "sent" : "received"}>
            <strong>{msg.sender}:</strong> {msg.text}
          </p>
        ))}
      </div>

      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default PrivateChat;
