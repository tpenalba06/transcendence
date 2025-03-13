import React, { useState, useEffect } from 'react';
import { ACCESS_TOKEN } from '../constants';
import '../styles/BlockedUsers.css';

function BlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [error, setError] = useState(null);

  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('http://localhost:8000/api/user/blocked/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch blocked users');
      }
      
      const data = await response.json();
      setBlockedUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load blocked users');
      console.error('Error fetching blocked users:', err);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/user/blocked/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unblock user');
      }

      // Remove user from blocked list
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError(err.message || 'Failed to unblock user');
      console.error('Error unblocking user:', err);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  if (error) {
    return (
      <div className="blocked-users">
        <div className="blocked-users-error">{error}</div>
        <button onClick={fetchBlockedUsers} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="blocked-users">
      <h2>Blocked Users</h2>
      {blockedUsers.length === 0 ? (
        <p className="no-blocked-users">No blocked users</p>
      ) : (
        <ul className="blocked-users-list">
          {blockedUsers.map(user => (
            <li key={user.id} className="blocked-user-item">
              <img 
                src={user.profil_pic || '/default-avatar.png'} 
                alt={user.username} 
                className="blocked-user-avatar"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <span className="blocked-user-name">{user.username}</span>
              <button 
                onClick={() => handleUnblock(user.id)}
                className="unblock-button"
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BlockedUsers;
