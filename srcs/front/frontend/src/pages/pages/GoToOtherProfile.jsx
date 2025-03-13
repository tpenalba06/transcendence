import "../styles/Profil.css"
import { useState, useEffect } from "react";
import { getUser, getQR, getMatches } from "../api"
import Navbarr from "../components/Navbar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams, useSearchParams } from 'react-router-dom';

function Profil() {
    const [user, setUser] = useState({})
    const [qr, setQR] = useState(null)
    const [matches, setMatches] = useState([])
    const { username } = useParams();
    const [searchParams] = useSearchParams();
    const queryUsername = searchParams.get('username');
    
    const inituser = async () => {
        try {
            // Use username from either params or query
            const targetUsername = username || queryUsername;
            const TMPuser = await getUser(targetUsername);
            setUser(TMPuser);
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }

    const initMatches = async () => {
        try {
            const matchData = await getMatches();
            setMatches(matchData);
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    }

    useEffect(() => {
        inituser();
        initMatches();
    }, [username, queryUsername]);

    const initqr = async () => {
        try {
            const TMPuser = await getQR();
            setQR(TMPuser);
        } catch (error) {
            console.error('Error fetching QR:', error);
        }
    }

    useEffect(() => {
        initqr();
    }, []);

    return (
        <div>
            <Navbarr />
            <section className="bg-profil">
                <div className="content-profil">
                    <FontAwesomeIcon icon="check-square" />
                    <h1>{user?.username || 'Loading...'}</h1>
                    {user?.profil_pic && <img className="pp" src={user.profil_pic} alt={user.username} />}
                    {qr && <img src={qr} alt="QR Code" />}
                    
                    <div className="user-details">
                        <p>First Name: {user?.first_name || 'N/A'}</p>
                        <p>Last Name: {user?.last_name || 'N/A'}</p>
                        <p>Email: {user?.email || 'N/A'}</p>
                        <p>Wins: {user?.win_count || 0}</p>
                        <p>Losses: {user?.lose_count || 0}</p>
                    </div>

                    {matches.length > 0 && (
                        <div className="match-history">
                            <h2>Match History</h2>
                            <ul>
                                {matches.map((match, index) => (
                                    <li key={index}>
                                        Result: {match.result} - Date: {new Date(match.date).toLocaleDateString()}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default Profil