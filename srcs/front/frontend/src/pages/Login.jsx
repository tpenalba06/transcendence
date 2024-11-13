// src/pages/Login.jsx

import React from "react";
import Form from "../components/Form";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Login() {
    const navigate = useNavigate();

    const handleGoToRegisterButton = () => {
        localStorage.clear();
        navigate("/register");
    };

    const handleLoginWith42 = () => {
        window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-efb8810a6794b0509ab1b30b4baeb56fff909df009eb5c29cde1d675f5309a75&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fcheck42user&response_type=code";
    };

    console.log("TEST")

    return (
        <div>
            <button className="login-with-42-button" onClick={handleLoginWith42}>
                Se connecter avec 42
            </button>

            <Form route="/api/token/" method="login" />

            <button className="go-to-register-button" onClick={handleGoToRegisterButton}>
                Register
            </button>
        </div>
    );
}

export default Login;
