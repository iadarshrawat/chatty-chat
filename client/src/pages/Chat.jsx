import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useLocation, useParams } from "react-router-dom";
import member from "../assets/members.png";

import "../style/chat.scss";

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [clients, setClients] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const location = useLocation();
  const { id: roomId } = useParams();

  const now = new Date();
const hours = now.getHours(); // Gets the current hour (0-23)
const minutes = now.getMinutes();


  useEffect(() => {
    if (socket) return;

    const newSocket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.emit("join", {
      roomId,
      username: location.state?.name || "Guest",
    });

    newSocket.on("joined", ({ clients, username }) => {
      console.log(`${username} joined the chat`);
      setMessages((prevMessages) => [
        ...prevMessages,
        { system: true, message: `${location.state?.name === username ? "You" : username} joined the chat!` },
      ]);

      setClients(clients);
    });

    newSocket.on("received_message", (msg) => {
      console.log("Received message:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on("user-disconnected", ({ username }) => {
      console.log(username, "disconnected");
      setMessages((prevMessages) => [
        ...prevMessages,
        { system: true, message: `${username} left the chat!` },
      ]);
    });

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);
    });

    return () => {
      if (newSocket) {
        newSocket.emit("leave", {
          roomId,
          username: location.state?.name || "Guest",
        });
        newSocket.disconnect();
      }
    };
  }, [roomId]); // Removed `location.state` dependency to avoid unnecessary re-renders

  const handleSend = () => {
    if (!socket || !message.trim()) return;

    const msgData = {
      message,
      hours,
      minutes,
      roomId,
      username: location.state?.name || "Guest",
    };

    socket.emit("send-message", msgData);
    setMessages((prev) => [...prev, msgData]); // Add sent message to chat
    setMessage(""); // Clear input field after sending
  };

  return (
    <div className="chat-container">
      <div className="sub-container">
        <h1 className="room-title">{`Chat Room: ${roomId}`}</h1>

        <div className="messages-box">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.username === location.state?.name
                  ? "mine"
                  : msg.system
                  ? "system"
                  : "other"
              }`}
            >
              {msg.system ? (
                <i>{msg.message}</i>
              ) : (
                <>
                  <strong>{msg.username}:</strong> {msg.message} <div className="time">{`${msg.hours}:${msg.minutes}`}</div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="chat-input">
          <div className="btn">
            <img src={member} alt="" width="50px" />
            <div className="pop-up">
              <ul>
                {clients.map((client, index) => (
                  <li key={index}>{client.username}</li>
                ))}
              </ul>
            </div>
          </div>
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
