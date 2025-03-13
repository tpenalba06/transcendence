import { Space, Switch } from "antd"
import axios from "axios";
import { useState, useEffect, } from "react";
import { getQR, getUser } from "../api"
import { ACCESS_TOKEN } from "../constants";
import { useNavigate } from "react-router-dom";
import lock from "../assets/le.png"
import "../styles/Config2FA.css"
import Snowfall from 'react-snowfall'

function Config2FA () {
    const [qr, setQR] = useState([])
    const [user, setUser] = useState([])
    const [code2fa, set2fa] = useState("")
    const [kay2fa, setKey] = useState("")
    const [valide, setValide] = useState(null)
    const userToken = localStorage.getItem(ACCESS_TOKEN);
    const navigate = useNavigate()

    const handleGoBack = () => {
            navigate("/profil")
    }

    // console.log(valide)
    const handleEnable = async (e) => {
        setValide(null)
        e.preventDefault();
        // try {
        const rep = await axios.post("api/user/active2fa/", {code2fa ,userToken})
        console.log(rep.data)
        if (rep.data)
        {
            setValide(true)
            location.reload();
        }
        else
            setValide(false)
        // }
        // catch (error) {
        //     alert(error)
        // }
    }

    const handleDisable = async () => {
        await axios.post("api/user/desactiver2fa/", {userToken})
        navigate("/profil")
    }

    useEffect(() => {
        inituser()
    }, []);
    
    const inituser = async () => {
        const TMPuser = await getUser()
        setUser(TMPuser);
    }

    useEffect(() => {
        initqr()
    }, []);
    
    const initqr = async () => {
        const TMPqr = await getQR()
        setQR(TMPqr.qrcode);
        setKey(TMPqr.key);
    }

    return(
        <div>
            <Snowfall snowflakeCount={500}></Snowfall>
            {!user.is2FA ?
            <div className="active-2fa">
                <h1>Configuration de la 2FA</h1>
                <p>Pour activer l'autentification a double facteur (aka 2FA) il faut telecharger une application de double autentification, style "Google Authenticator",
                    ensuite il vous faudra scanner le qrCode ci dessous (vous n'avez pas la posiblilitee de scanner le qrCode , entree la cle de configuration : {kay2fa})
                </p>
                <img className="qrcode" src={qr}/>
                <form onSubmit={handleEnable} className="form-2fa">
                    {valide == false && <h2>Code Invalide</h2>}
                    <input className="code2fa-input" maxLength={6} type="text" value={code2fa} onChange={(e) => set2fa(e.target.value)} placeholder="6-DIGIT CODE"></input>
                    <button type="submit" className="tb">Activer la 2FA</button>
                    <button onClick={handleGoBack} className="bb">Retour</button>
                </form>
            </div> :
            <div>
                <div className="disable-2fa">
                    <h1>2FA activée</h1>
                    <img className="lock" src={lock}/>
                    <button onClick={handleGoBack} className="re">Retour</button>
                    <button onClick={handleDisable} className="de">Désactiver la 2FA</button>
                </div>
            </div>}
        </div>
    )

}

export default Config2FA