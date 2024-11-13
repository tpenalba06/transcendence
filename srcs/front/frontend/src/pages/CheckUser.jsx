import React from "react";
import Form from "../components/Form";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

function CheckUser() {
    const navigate = useNavigate();

    console.log("TEST")

    const sendCodeToBack = async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const response = await axios.get(`http://localhost:8000/auth/login/?${code}`);
        console.log("RESPONSE ---> ", response)
        navigate("/home")
    }

    sendCodeToBack()

    return (
        <div>
           OUI JE SUIS ARRIVE ICI
        </div>
    );
}

export default CheckUser;