import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";
import api from "../api/axios";
import logo42 from "../assets/42logo.png"
import Snowfall from 'react-snowfall'

function Form({route, method}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [password2, setPassword2] = useState("")
    const [goodpass, setGoodpass] = useState(null)
    const [loading, setLoading] = useState(false)
    const [ffa, setis2fa] = useState(false)
    const [code2fa, set2fa] = useState("")
    const navigate = useNavigate()
    const name = method === "login" ? "Login" : "Register";
    const logo = method === "login" ? "/assets/login.png" : "/assets/register.png";
    const button_text = method === "login" ? "Create an account" : "Already have an account ?";
    const [goodlogin, setGoodlogin] = useState(null)
    const [goodregister, setGoodregister] = useState(null)
    const [error, setError] = useState("")
    const [errorState, setErrorState] = useState("")

    const handleSubmit = async (f) => {
        setLoading(true);
        setGoodpass(null);
        setGoodlogin(null);
        setGoodregister(null);
        setError("");
        setErrorState("");
        f.preventDefault();

        try {
            if (method === "login") {
                const res = await api.post(route, {username, password, code2fa})
                if (res.data.is2fa) {
                    setis2fa(true)
                }
                else if (res.data.jwt){
                    localStorage.setItem(ACCESS_TOKEN, res.data.jwt)
                    navigate("/")
                }
                else if (res.data === false)
                    setGoodlogin(false)
            }
            else {
                if (!password || !password2 || password !== password2) {
                    setGoodpass(true);
                    console.log('Password validation failed');
                } else {
                    console.log('Sending registration request...');
                    const res = await api.post(route, {username, password});
                    console.log('Registration response:', res.data);
                    
                    if (res.data.success) {
                        console.log('Registration successful, redirecting to login');
                        navigate("/login");
                    } else {
                        console.error('Registration failed:', res.data.error);
                        setErrorState(res.data.error);
                        setGoodregister(false);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            setErrorState("An error occurred");
            setGoodregister(false);
        }
        finally {
            setLoading(false);
        }
    }

    const handleGoToRegisterOrLoginButton = () => {
        localStorage.clear();
        if (method == "register")
            navigate("/login")
        else
            navigate("/register")
    }

    const handleLoginWith42 = () => {
        window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-efb8810a6794b0509ab1b30b4baeb56fff909df009eb5c29cde1d675f5309a75&redirect_uri=https%3A%2F%2Flocalhost%3A5173%2Fcheck42user&response_type=code";
    };


    return (
        <div>
            <Snowfall />
            <form onSubmit={handleSubmit} className="form-container">
                <img src={logo} alt="logo"/>
                <input className="form-imput" type="text" maxLength={11} value={username} onChange={(f) => setUsername(f.target.value)} placeholder="Username"></input>
                <input className="form-imput" type="password" value={password} onChange={(f) => setPassword(f.target.value)} placeholder="Password"></input>
                {method === "register" && (
                    <input className="form-imput" type="password" value={password2} onChange={(f) => setPassword2(f.target.value)} placeholder="Confirme password"></input>
                    )}
                {ffa && (<div>
                    <h2>2FA Authentication</h2>
                    <input className="code2fa-input-login" maxLength={6} type="text" value={code2fa} onChange={(f) => set2fa(f.target.value)} placeholder="6-DIGIT CODE"></input>
                </div>)}
                {loading && <LoadingIndicator/>}
                <button className="form-button" type="submit">{name}</button>
            </form>
            {goodregister == true && (<p className="username-register">Username already taken</p>)}
            {goodregister == false && (<p className="username-register">{error}</p>)}
            {goodlogin == false && (<p className="login-false">Incorrect username or password</p>)}
            {goodpass == true && (<p className="pass-false">Passwords do not match or field is empty</p>)}
            {errorState && (<p className="error-state">{errorState}</p>)}
            <button className="go-to-register-button" onClick={() => handleGoToRegisterOrLoginButton()}>{button_text}</button>
                {!ffa && method === "login" && (<div>
                    <h2>━━━━━━━━ Or continue with ━━━━━━━━</h2>
                    <button className="login-with-42-button" onClick={handleLoginWith42}><img className="logo42" src={logo42} alt="42 Authentication"/></button>
                </div>)}
        </div>
    )

}

export default Form