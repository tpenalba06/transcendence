import React, { useState, useEffect, useRef } from 'react';
import { ACCESS_TOKEN } from '../constants';
import '../styles/OnlineUsers.css';

function OnlineUsers({ onStartPrivateChat }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const ws = useRef(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const connectWebSocket = () => {
      console.log('OnlineUsers: Attempting to connect to WebSocket');
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        console.error('OnlineUsers: No authentication token found');
        setConnectionError(true);
        return;
      }

      // Remove 'Bearer ' prefix and include token in the WebSocket URL
      const cleanToken = token.replace('Bearer ', '');
      ws.current = new WebSocket(`ws://localhost:8000/ws/online/?token=${cleanToken}`);

      ws.current.onopen = () => {
        console.log('OnlineUsers: Successfully connected to WebSocket');
        setConnectionError(false);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'online_users') {
            setOnlineUsers(data.users);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('OnlineUsers: WebSocket error:', error);
        setConnectionError(true);
      };

      ws.current.onclose = () => {
        console.log('OnlineUsers: WebSocket connection closed');
        setTimeout(connectWebSocket, 5000); // Try to reconnect after 5 seconds
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  if (connectionError) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleUserClick = (user) => {
    onStartPrivateChat(user);
    setIsExpanded(false);
  };

  const currentUser = localStorage.getItem('currentUser'); // Assuming currentUser is stored in localStorage

  return (
    <div className="online-users">
      <button className="online-users-toggle" onClick={toggleExpanded}>
        <i className={`fas fa-${isExpanded ? 'chevron-down' : 'chevron-up'}`}></i>
        Online Users
        <span className="online-users-count">{onlineUsers.length}</span>
      </button>
      <div className={`online-users-list ${isExpanded ? 'expanded' : ''}`}>
        {onlineUsers.filter(user => user.username !== currentUser).map((user) => (
          <div
            key={user.id}
            className="online-user-item"
            onClick={() => handleUserClick(user)}
          >
            <img
              src={user.profil_pic}
              alt={`${user.username}'s avatar`}
              className="online-user-avatar"
            />
            <span className="online-user-name">{user.username}</span>
            <span className="online-user-status"></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OnlineUsers;
