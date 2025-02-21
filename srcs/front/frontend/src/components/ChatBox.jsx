import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACCESS_TOKEN } from '../constants';
import '../styles/ChatBox.css';

function ChatBox({ privateChat, onClosePrivateChat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showNotification = (message) => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(message.isDirect ? "New Private Message" : "New Message", {
        body: `${message.username}: ${message.text}`,
        icon: "/chat-icon.png"
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          showNotification(message);
        }
      });
    }
  };

  useEffect(() => {
    const connectWebSocket = () => {
      console.log('ChatBox: Attempting to connect to WebSocket');
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        console.error('ChatBox: No authentication token found');
        setConnectionError(true);
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      ws.current = new WebSocket(`ws://localhost:8000/ws/chat/?token=${cleanToken}`);

      ws.current.onopen = () => {
        console.log('ChatBox: Successfully connected to WebSocket');
        setConnectionError(false);
      };

      ws.current.onmessage = (event) => {
        console.log('ChatBox: Received message:', event.data);
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'chat_message') {
            // Don't show messages from blocked users
            if (blockedUsers.has(data.message.username)) return;
            
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && 
                  lastMessage.text === data.message.text && 
                  lastMessage.username === data.message.username) {
                return prev;
              }
              
              if ((privateChat && data.message.isDirect) || (!privateChat && !data.message.isDirect)) {
                if (isMinimized) {
                  showNotification(data.message);
                }
                return [...prev, data.message];
              }
              return prev;
            });
            scrollToBottom();
          }
          
          else if (data.type === 'game_invite') {
            const { from_user, from_user_id } = data.invite;
            // Don't show invites from blocked users
            if (blockedUsers.has(from_user)) return;
            
            const accept = window.confirm(`${from_user} has invited you to play Pong! Accept?`);
            if (accept) {
              // Navigate to game page or start game
              navigate(`/game?opponent=${from_user_id}`);
            }
          }
        } catch (error) {
          console.error('ChatBox: Error parsing message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('ChatBox: WebSocket error:', error);
        setConnectionError(true);
      };

      ws.current.onclose = (event) => {
        console.log('ChatBox: WebSocket closed:', event);
        setTimeout(connectWebSocket, 3000);
      };
    };

    setMessages([]);
    connectWebSocket();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      if (ws.current) {
        console.log('ChatBox: Cleaning up WebSocket connection');
        ws.current.close();
      }
    };
  }, [privateChat, isMinimized, blockedUsers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = {
        type: 'chat_message',
        message: newMessage
      };
      
      if (privateChat) {
        messageData.recipient = privateChat.id;
      }
      
      ws.current.send(JSON.stringify(messageData));
      setNewMessage('');
    }
  };

  const handleBlockUser = (username, userId) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'block_user',
        user_id: userId
      }));
      setBlockedUsers(prev => new Set([...prev, username]));
    }
  };

  const handleInviteToGame = (userId) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'game_invite',
        recipient: userId
      }));
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (connectionError) {
    return null;
  }

  return (
    <div className={`chat-box ${isMinimized ? 'minimized' : ''} ${privateChat ? 'private-chat' : ''}`} style={{ height: isMinimized ? 'auto' : undefined }}>
      <div className="chat-header" onClick={toggleMinimize}>
        <div className="chat-header-content">
          <span>{privateChat ? `Chat with ${privateChat.username}` : 'Global Chat'}</span>
          <button 
            className="manage-blocks-button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/blocked-users');
            }}
            title="Manage blocked users"
          >
            ⚙️
          </button>
        </div>
        <div className="chat-controls">
          {privateChat && (
            <>
              <button 
                className="game-invite-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleInviteToGame(privateChat.id);
                }}
                title="Invite to Pong game"
              >
                🎮
              </button>
              <button 
                className="block-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleBlockUser(privateChat.username, privateChat.id);
                  onClosePrivateChat();
                }}
                title="Block user"
              >
                🚫
              </button>
              <button 
                className="profile-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${privateChat.username}`);
                }}
                title="View profile"
              >
                👤
              </button>
              <button 
                className="close-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  onClosePrivateChat();
                }}
              >
                ×
              </button>
            </>
          )}
          <button className="minimize-button">
            {isMinimized ? '+' : '-'}
          </button>
        </div>
      </div>
      {!isMinimized && (
        <>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.isSelf ? 'self' : ''}`}>
                <img 
                  src={msg.profil_pic} 
                  alt={msg.username} 
                  className="user-avatar"
                  onClick={() => navigate(`/profile/${msg.username}`)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="message-content">
                  <div className="message-header">
                    <span 
                      className="username"
                      onClick={() => navigate(`/profile/${msg.username}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {msg.username}
                    </span>
                    {!msg.isSelf && (
                      <div className="message-actions">
                        <button 
                          onClick={() => handleInviteToGame(msg.userId)}
                          title="Invite to Pong game"
                        >
                          🎮
                        </button>
                        <button 
                          onClick={() => handleBlockUser(msg.username, msg.userId)}
                          title="Block user"
                        >
                          🚫
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="message-text">{msg.text}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="chat-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}
    </div>
  );
}

export default ChatBox;
