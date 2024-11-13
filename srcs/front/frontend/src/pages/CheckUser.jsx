import React from "react";
import Form from "../components/Form";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

console.log("TEST")

function CheckUser() {
    const navigate = useNavigate();

    console.log("TEST 2")

    const sendCodeToBack = async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const response = await axios.get(`http://localhost:8000/auth/login/?${code}`);
        console.log("Code reçu depuis 42:", code);
        console.log("RESPONSE ---> ", response)
        navigate("/home")
    }

    // sendCodeToBack();

    return (
        <div>
        <button onClick={sendCodeToBack}> ok </button>
           OUI JE SUIS ARRIVE ICI
        </div>
    );
}

export default CheckUser;