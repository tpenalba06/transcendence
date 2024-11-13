import Form from "../components/Form"
import axios from "axios";
import {useNavigate} from "react-router-dom"
import React from "react";
import { useEffect } from "react";

function Login() {
    const navigate = useNavigate();

    const handleGoToRegisterButton = () => {
        localStorage.clear();
        navigate("/register")
    }

    const handleLoginWith42 = () => {
        window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-efb8810a6794b0509ab1b30b4baeb56fff909df009eb5c29cde1d675f5309a75&redirect_uri=https%3A%2F%2Flocalhost%3A5173%2Fcheck42user&response_type=code";

    };

    return (
        <div style={{padding:'8%'}}>
            {localStorage.clear()}
            <button className="login-with-42-button" onClick={handleLoginWith42}>
                Se connecter avec 42
            </button>
            <Form route="/api/user/token/" method="login"/>
            <button className="go-to-register-button" onClick={() => handleGoToRegisterButton()}>Create an account</button>
        </div>
    );
}

export default Login

 