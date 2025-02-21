import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";
import api from "../api/axios";
import logo42 from "../assets/42logo.png"

function Form({route, method}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [ffa, setis2fa] = useState(false)
    const [code2fa, set2fa] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()
    const name = method === "login" ? "Login" : "Register";
    var logo = method === "login" ? "src/assets/login.png" : "src/assets/register.png";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (method === "login") {
                const response = await api.post(route, {
                    username,
                    password,
                    code2fa: code2fa || ""
                });

                console.log("Login response:", response.data);

                if (response.data.is2fa === "true") {
                    setis2fa(true);
                } else if (response.data.jwt) {
                    localStorage.setItem(ACCESS_TOKEN, response.data.jwt);
                    navigate("/");
                }
            } else {
                const response = await api.post(route, {
                    username,
                    password
                });
                
                console.log("Registration response:", response.data);
                
                if (response.status === 201) {
                    navigate("/login");
                }
            }
        } catch (error) {
            console.error("API Error:", error);
            if (error.response) {
                const errorData = error.response.data;
                if (errorData.error) {
                    setError(errorData.error);
                } else if (errorData.detail) {
                    setError(errorData.detail);
                } else if (typeof errorData === 'string') {
                    setError(errorData);
                } else {
                    setError("An error occurred. Please try again.");
                }
            } else if (error.request) {
                setError("Network error. Please check your connection.");
            } else {
                setError("An error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    const handleLoginWith42 = () => {
        window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-efb8810a6794b0509ab1b30b4baeb56fff909df009eb5c29cde1d675f5309a75&redirect_uri=https%3A%2F%2Flocalhost%3A5173%2Fcheck42user&response_type=code";
    };

    return (
        <div className="formm">
            <form onSubmit={handleSubmit} className="form-container">
                <img src={logo} alt="logo"/>
                {error && <div className="error-message">{error}</div>}
                <input 
                    className="form-imput" 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Username"
                    required
                />
                <input 
                    className="form-imput" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Password"
                    required
                />
                {ffa && (
                    <div>
                        <h2>2FA Authentication</h2>
                        <input 
                            className="form-imput" 
                            type="text" 
                            value={code2fa} 
                            onChange={(e) => set2fa(e.target.value)} 
                            placeholder="CODE"
                            required
                        />
                    </div>
                )}
                <button type="submit" className="form-button" disabled={loading}>
                    {loading ? <LoadingIndicator /> : name}
                </button>
                {method === "login" && (
                    <div className="login-with-42">
                        <p>Or</p>
                        <button type="button" onClick={handleLoginWith42} className="login-42-button">
                            <img src={logo42} alt="42 Logo" className="logo-42"/>
                            Login with 42
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default Form;