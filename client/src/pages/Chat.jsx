import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import newSocket from "../socket/socket.config";
import "../style/chat.scss";

const Chat = () => {
  const [clients, setClients] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [privateChat, setPrivateChat] = useState(null); // State for private chat popup
  const [privateMessages, setPrivateMessages] = useState({});
  const [privateMessage, setPrivateMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  const location = useLocation();
  const { id: roomId } = useParams();

  const userId = location.state?.userid || "1234";
  const username = location.state?.name || "Guest";

  useEffect(() => {
    newSocket.emit("join", { roomId, username, userid: userId });

    newSocket.on("joined", ({ clients, username }) => {
      console.log(`${username} joined the chat`);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          system: true,
          message: `${
            username === location.state?.name ? "You" : username
          } joined the chat!`,
        },
      ]);
      setClients(clients);
    });

    newSocket.on('online-users', (users)=>{
        setActiveUsers(users.map((user)=>user.userId));
    })

    newSocket.on("all-clients", (clients) => {
      setClients(clients);
    });

    newSocket.on("received_message", (msg) => {
      setMessages((prev) => {
        if (msg.username === username) return prev;
        return [...prev, msg];
      });
    });

    newSocket.on("user-disconnected", ({ username }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { system: true, message: `${username} left the chat!` },
      ]);
    });

    // Handle receiving private messages
    newSocket.on("newPrivateMessage", ({ senderId, message }) => {
        setPrivateMessages((prev) => ({
          ...prev,
          [senderId]: [...(prev[senderId] || []), { senderId, message }],
        }));
      });

    newSocket.on("userTyping", ({ username }) => {
      setTypingUsers((prev) => {
        if (!prev.includes(username)) return [...prev, username];
        return prev;
      });
    });

    newSocket.on("userStoppedTyping", ({ username }) => {
      setTypingUsers((prev) => prev.filter((user) => user !== username));
    });

    return () => {
      newSocket.emit("leave", { roomId, username, userid: userId });
      newSocket.disconnect();
    };
  }, [roomId]);

  const handleSend = () => {
    if (!newSocket || !message.trim()) return;

    const msgData = {
      message,
      hours: new Date().getHours(),
      minutes: new Date().getMinutes(),
      roomId,
      username,
    };

    newSocket.emit("send-message", msgData);
    setMessages((prev) => [...prev, { ...msgData, sender: true }]);
    setMessage("");
  };

  const handlePrivateMessageSend = () => {
    if (!privateChat || !privateMessage.trim()) return;

    const recipientId = privateChat.userId;

    const privateMsgData = {
      recipientId,
      message: privateMessage,
      senderId: userId,
    };

    newSocket.emit("privateMessage", privateMsgData);

    setPrivateMessages((prev) => ({
      ...prev,
      [recipientId]: [
        ...(prev[recipientId] || []),
        { senderId: userId, message: privateMessage },
      ],
    }));

    setPrivateMessage("");
  };

  return (
    <div className="chat-container">
      <div className="list-container">
        <h1>All Clients</h1>
        <ul>
          {clients.map((client, index) => (
            
            <li
              key={index}
              onClick={() => client.userId !== userId && setPrivateChat(client)}
            >
                <span className={`status-indicator ${activeUsers.includes(client.userId) ? "active" : "inactive"}`}></span>
              {client.username}
            </li>
          ))}
        </ul>
      </div>

      <div className="sub-container">
        <h1 className="room-title">{`Chat Room: ${roomId}`}</h1>
        {typingUsers.length > 0 && (
          <p className="typing-indicator">
            {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"}{" "}
            typing...
          </p>
        )}
        <div className="messages-box">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.system
                  ? "system"
                  : msg.username === username
                  ? "mine"
                  : "other"
              }`}
            >
              {msg.system ? (
                <i>{msg.message}</i>
              ) : (
                <>
                  <strong>{msg.username}:</strong> {msg.message}
                  <div className="time">{`${msg.hours}:${msg.minutes}`}</div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              newSocket.emit("typing", { roomId, username });

              setTimeout(() => {
                newSocket.emit("stopTyping", { roomId, username });
              }, 2000);
            }}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>

      {privateChat && (
        <div className="private-chat-popup">
          <div className="popup-header">
            <h3>Chat with {privateChat.username}</h3>
            <button onClick={() => setPrivateChat(null)}>X</button>
          </div>
          <div className="private-messages-box">
            {(privateMessages[privateChat.userId] || []).map((msg, index) => (
              <div
                key={index}
                className={`private-message ${
                  msg.senderId === userId ? "mine" : "other"
                }`}
              >
                {msg.message}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a private message..."
              value={privateMessage}
              onChange={(e) => setPrivateMessage(e.target.value)}
            />
            <button onClick={handlePrivateMessageSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
