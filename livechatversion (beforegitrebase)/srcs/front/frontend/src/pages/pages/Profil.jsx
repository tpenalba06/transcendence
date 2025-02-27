import "../styles/Profil.css"
import { useState, useEffect } from "react";
import { getUser, getQR} from "../api"
import Navbarr from "../components/Navbar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function Profil() {
    const [user, setUser] = useState([])
    const [qr, setQR] = useState([])
    
    const inituser = async () => {
        const TMPuser = await getUser()
        setUser(TMPuser);
    }

    useEffect(() => {
        inituser()
    }, []);

    const initqr = async () => {
        const TMPuser = await getQR()
        setQR(TMPuser);
    }

    useEffect(() => {
        initqr()
    }, []);


    return (
        <div>
            <Navbarr></Navbarr>
            <section className="bg-profil">
                <div className="content-profil">
                    <FontAwesomeIcon icon="check-square" />
                    <h1>{user.username}</h1>
                    <img className="pp" src={user.profil_pic}/>
                    <img src={qr} />
                </div>
            </section>
        </div>
    );
}

export default Profil