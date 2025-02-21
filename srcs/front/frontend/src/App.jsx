import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import Profil from "./pages/Profil"
import Pong from "./pages/Pong/Pong"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"
import RedirectHome from './pages/RedirectHome';
import CheckUser from './pages/CheckUser';
import PongMulti from "./pages/Pong/PongMulti"
import PongSelection from "./pages/PongSelection"
import ChatBox from "./components/ChatBox"
import OnlineUsers from "./components/OnlineUsers"
import BlockedUsers from "./pages/BlockedUsers"
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function ChatWrapper() {
  const location = useLocation();
  const hideChat = ['/login', '/register', '/check42user'].includes(location.pathname);
  const [privateChats, setPrivateChats] = useState(new Map());
  
  if (hideChat) return null;

  const handleStartPrivateChat = (user) => {
    if (!privateChats.has(user.id)) {
      const newChats = new Map(privateChats);
      newChats.set(user.id, user);
      setPrivateChats(newChats);
    }
  };

  const handleClosePrivateChat = (userId) => {
    const newChats = new Map(privateChats);
    newChats.delete(userId);
    setPrivateChats(newChats);
  };

  return (
    <>
      <OnlineUsers onStartPrivateChat={handleStartPrivateChat} />
      <div className="chat-container">
        {!hideChat && <ChatBox />} {/* Global chat */}
        {Array.from(privateChats.entries()).map(([userId, user]) => (
          <ChatBox
            key={userId}
            privateChat={user}
            onClosePrivateChat={() => handleClosePrivateChat(userId)}
          />
        ))}
      </div>
    </>
  );
}

function MenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="menu-button-container">
      <button onClick={toggleMenu} className="menu-button">Menu</button>
      {isOpen && (
        <div className="menu-dropdown">
          <ul>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/profil">Profile</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/pong">Pong</Link></li>
            <li><Link to="/check42user">Check User</Link></li>
            <li><Link to="/selection">Pong Selection</Link></li>
            <li><Link to="/blocked-users">Blocked Users</Link></li>
          </ul>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MenuButton />
      <Routes>
        <Route path="/" element={<ProtectedRoute> <RedirectHome/> </ProtectedRoute>}/>
        <Route path="/home" element={<ProtectedRoute> <Home/> </ProtectedRoute>}/>
        <Route path="/login" element={<Login/>}></Route>
        <Route path="/profil" element={<ProtectedRoute> <Profil/> </ProtectedRoute>}/>
        <Route path="/register" element={<Register/>}></Route>
        <Route path="*" element={<NotFound/>}></Route>
        <Route path="/pong" element={<ProtectedRoute> <Pong/> </ProtectedRoute>}/>
        <Route path="/check42user" element={<CheckUser/>}></Route>
        <Route path="/pong/:roomid" element={<ProtectedRoute> <Pong/> </ProtectedRoute>}/>
        <Route path="/multipong/:roomid" element={<ProtectedRoute> <PongMulti/> </ProtectedRoute>}/>
        <Route path="/selection" element={<ProtectedRoute> <PongSelection/> </ProtectedRoute>}/>
        <Route path="/blocked-users" element={<ProtectedRoute> <BlockedUsers/> </ProtectedRoute>}/>
      </Routes>
      <ChatWrapper />
    </BrowserRouter>
  )
}

export default App
