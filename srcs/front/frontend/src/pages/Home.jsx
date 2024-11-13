//import { useState, useEffect } from "react"
//import api from "../api";
import "../styles/Home.css"
import {useNavigate} from "react-router-dom"

function Home() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login")
    }

        return (
            <div>
                <div>
                    <h2>Home Page</h2>
                </div>
                <h2>Transcendence</h2>
                <button className="logout-button" onClick={() => handleLogout()}>Logout</button>
            </div>
    );
}

export default Home