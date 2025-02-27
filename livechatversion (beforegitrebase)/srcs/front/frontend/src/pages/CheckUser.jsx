import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import { ACCESS_TOKEN } from "../constants";
import { useState } from "react";

function CheckUser() {
    const navigate = useNavigate();
    const [code2fa, set2fa] = useState("")

    const sendCodeToBack = async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const response = await axios.get(`http://localhost:8000/api/auth/login/?${code}`);
        const username = response.data.username
        const res = await axios.post("/api/user/token/", {username, password :"don't care", code2fa})
        if (res.data.jwt)
            localStorage.setItem(ACCESS_TOKEN, res.data.jwt)
        navigate("/home")
    }

    useEffect(() => {
        sendCodeToBack()
    }, []);

    return (
        <div>
           OUI JE SUIS ARRIVE ICI
        </div>
    );
}

export default CheckUser;