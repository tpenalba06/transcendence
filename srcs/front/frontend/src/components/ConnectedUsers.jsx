import React, { useState, useEffect, useRef } from 'react';
import { ACCESS_TOKEN } from '../constants';
import '../styles/ConnectedUsers.css';

function ConnectedUsers({ onStartPrivateChat }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const ws = useRef(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const connectWebSocket = () => {
      console.log('ConnectedUsers: Attempting to connect to WebSocket');
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        console.error('ConnectedUsers: No authentication token found');
        setConnectionError(true);
        return;
      }

      // Remove 'Bearer ' prefix and include token in the WebSocket URL
      const cleanToken = token.replace('Bearer ', '');
      ws.current = new WebSocket(`ws://localhost:8000/ws/online/?token=${cleanToken}`);

      ws.current.onopen = () => {
        console.log('ConnectedUsers: Successfully connected to WebSocket');
        setConnectionError(false);
      };

      ws.current.onmessage = (event) => {
        console.log('ConnectedUsers: Received message:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('ConnectedUsers: Parsed data:', data);
          if (data.type === 'online_users') {
            console.log('ConnectedUsers: Updating users list:', data.users);
            setOnlineUsers(data.users);
          }
        } catch (error) {
          console.error('ConnectedUsers: Error parsing message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('ConnectedUsers: WebSocket error:', error);
        setConnectionError(true);
      };

      ws.current.onclose = (event) => {
        console.log('ConnectedUsers: WebSocket closed:', event);
        // Try to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        console.log('ConnectedUsers: Cleaning up WebSocket connection');
        ws.current.close();
      }
    };
  }, []);

  const handleUserClick = (user) => {
    if (onStartPrivateChat) {
      onStartPrivateChat(user);
    }
  };

  if (connectionError) {
    console.log('ConnectedUsers: Not rendering due to connection error');
    return null;
  }

  return (
    <div className="online-users">
      <div className="online-users-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Online Users ({onlineUsers.length})</span>
        <button className="collapse-button">
          {isCollapsed ? '+' : '-'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="online-users-list">
          {onlineUsers.map((user) => (
            <div 
              key={user.id} 
              className="online-user" 
              onClick={() => handleUserClick(user)}
            >
              <img src={user.profil_pic} alt={user.username} className="online-user-avatar" />
              <span className="online-user-name">{user.username}</span>
              <span className="online-status"></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConnectedUsers;
