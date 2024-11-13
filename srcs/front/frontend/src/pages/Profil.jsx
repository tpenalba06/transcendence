import "../styles/Profil.css"
import { useState, useEffect } from "react";
import { getUser } from "../api"

function Profil() {
    // const [user, setUser] = useState([])
    
    // const inituser = async () => {
    //     const TMPuser = await getUser()
    //     setUser(TMPuser);
    // }

    // useEffect(() => {
    //     inituser()
    // }, []);


    return (
        <section className="bg-profil">
            <div className="content-profil">
                <img className="pp" src={user.profil_pic}/>
            </div>
        </section>
    );
}

export default Profil