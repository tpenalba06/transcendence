import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";

function From({route, method}) {
    const [username, setUsername] = useState("")//"username" = la variable, "setUsename" = la methode pour pouvoir la modifier, "useState" = defini son type en gros
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const name = method === "login" ? "Login" : "Register";

    const handleSubmit = async (f) => {//pour qu'une fois le bouton "submit" est press, le formulaire reviens a sa config initial, c'est a dire: VIDE// "async" est une "method" de function qui permet de mieux gerer les cas d'erreur, d'ou de "try/catch"
        setLoading(true);
        f.preventDefault();

        try {
            const res = await api.post(route, {username, password})
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access)
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh)
                navigate("/")
            }
            else {
                navigate("/login")
            }
        } 
        catch (error) {
            alert(error)//juste pour montrer l'erreur
        }
        finally {
            setLoading(false)
        }
    }

    return <form onSubmit={handleSubmit} className="form-container">
        <h1>{name}</h1>
        <input className="form-imput" type="text" value={username} onChange={(f) => setUsername(f.target.value)} placeholder="Username"></input>
        <input className="form-imput" type="password" value={password} onChange={(f) => setPassword(f.target.value)} placeholder="Password"></input>
        {loading && <LoadingIndicator/>}
        <button className="form-button" type="subimt">{name}</button>
    </form>

}

export default From