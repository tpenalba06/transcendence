//import { useState, useEffect } from "react"
import React from 'react'
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

export default Home