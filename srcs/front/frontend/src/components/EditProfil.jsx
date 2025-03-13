import axios from "axios";
import { useState, useEffect } from "react";
import { ACCESS_TOKEN } from "../constants";
import "../styles/EditProfil.css"
import { getUser } from "../api"
import edit_logo from "../assets/edit_logo.png"

function EditProfil () {
    const [newpp, setNewpp] = useState("")
    const [newmail, setNewmail] = useState("")
    const [fname, setFname] = useState("")
    const [lname, setLname] = useState("")
    const [user, setUser] = useState([])
    const userToken = localStorage.getItem(ACCESS_TOKEN);

    const handleGoBack = () => {
        location.reload();
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        // try {
        await axios.post("api/user/edit/", {fname ,lname, newpp, userToken, newmail})
        location.reload();
        // }
        // catch (error) {
        //     alert(error)
        // }
    }

    useEffect(() => {
        inituser()
    }, []);
    
    const inituser = async () => {
        const TMPuser = await getUser()
        setUser(TMPuser);
    }

    return(
        <div className="content-edit">
            <form onSubmit={handleSubmit} className="edit-form">
                {/* <h1 className="edit-logo">Modifie ton profile</h1> */}
                <img src={edit_logo} className="edit-logo" />
                <input type="text" value={fname} maxLength={25} onChange={(f) => setFname(f.target.value)} placeholder="Nouveau Prénom (25 char. max.)"></input>
                <input type="text" value={lname} maxLength={25} onChange={(f) => setLname(f.target.value)} placeholder="Nouveau Nom (25 char. max.)"></input>
                <input type="text" value={newpp} onChange={(f) => setNewpp(f.target.value)} placeholder="Nouvelle Photo de profile (URL)"></input>
                <input type="email" value={newmail} onChange={(f) => setNewmail(f.target.value)} placeholder="Nouveau E-mail"></input>
                <button onClick={handleGoBack}>Retour</button>
                <button type="submit">Modifier</button>
            </form>
        </div>
    )
}

export default EditProfil