import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import Navbarr from '../components/Navbar';
import ConnectedUsers from '../components/ConnectedUsers';
import ChatBox from '../components/ChatBox';
import 'bootstrap/dist/css/bootstrap.css';
import logoutLogo from "../assets/logout_logo.png";

function Home() {
    const navigate = useNavigate();
    const [privateChats, setPrivateChats] = useState([]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const handleStartPrivateChat = (user) => {
        // Check if chat already exists
        if (!privateChats.find(chat => chat.id === user.id)) {
            setPrivateChats(prev => [...prev, {
                id: user.id,
                username: user.username,
                profil_pic: user.profil_pic
            }]);
        }
    };

    const handleClosePrivateChat = (userId) => {
        setPrivateChats(prev => prev.filter(chat => chat.id !== userId));
    };

    return (
        <div>
            <Navbarr />
            <button className="logout-button" onClick={handleLogout}>
                <img className='logout-logo' src={logoutLogo} alt="logoutLogo" />
            </button>
            
            <ConnectedUsers onStartPrivateChat={handleStartPrivateChat} />
            
            <div className="chat-container">
                <ChatBox />
                {privateChats.map(chat => (
                    <ChatBox
                        key={chat.id}
                        privateChat={chat}
                        onClosePrivateChat={() => handleClosePrivateChat(chat.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default Home;




//import { useState, useEffect } from "react"
/*import React from 'react'
import "../styles/Home.css"
import {useNavigate} from "react-router-dom"
import Navbarr from '../components/Navbar';
import 'bootstrap/dist/css/bootstrap.css';
import logoutLogo from "../assets/logout_logo.png"

function Home() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login")
    }

    const handlePong = () => {
        navigate("/selection")
    }

	return (
		<div>
      <Navbarr></Navbarr>
      <button className='pong-button' onClick={() => handlePong()}></button>
			<button className="logout-button" onClick={() => handleLogout()}><img className='logout-logo' src={logoutLogo} alt="logoutLogo" /></button>
		</div>
    );
}

function Button({name, callback}) {
	return (
	  <tr>
		<td>
		  <button className='button' onClick={() => callback()}>{name} </button>
		</td>
	  </tr>
	)
}

export default Home*/