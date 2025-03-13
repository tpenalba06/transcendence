import "../styles/Profil.css"
import EditProfil from "../components/EditProfil";
import { useState, useEffect } from "react";
import { getUser, getMatches } from "../api"
import Navbarr from "../components/Navbar";
import tas from "../assets/tas-de-neige.png"
import profile_logo from "../assets/profile_logo.png"
import { useNavigate } from "react-router-dom";
import Snowfall from 'react-snowfall'
import victory_cup from '../assets/img/victory_cup.png'

function Profil() {
    const [user, setUser] = useState([])
    const [matches, setMatches] = useState([])
    const [edit, setEdit] = useState(false)
    const [preferAIDifficulty, setPreferAIDifficulty] = useState("none")
    const [averageTime, setAverageTime] = useState()

    useEffect(() => {
        inituser()
        initmatches()
    }, []);
    
    useEffect(() => {
        PreferAIDifficulty();
        AverageTime();
    }, [matches])

    const inituser = async () => {
        const TMPuser = await getUser()
        setUser(TMPuser);
    }

    const initmatches = async () => {
        const TMPmatches = await getMatches()
        setMatches(TMPmatches);
    }

    const formEdit = () => {
        edit ? setEdit(false) : setEdit(true);
    }

    const navigate = useNavigate()
    const handleButton = () => {
            navigate("/Config2FA")
    }
    
    function PreferAIDifficulty()
    {
        let easy = 0;
        let medium = 0;
        let hard = 0;

        for (let i = 0; i < matches.length; i++) {
            if (matches[i].type == "AI easy")
                easy++;
            if (matches[i].type == "AI medium")
                medium++;
            if (matches[i].type == "AI hard")
                hard++;
        }
        
        // EASY
        if (easy > medium && easy > hard) {
            setPreferAIDifficulty("EASY");
            return;
        }
        // MEDIUM
        if (medium > easy && medium > hard) {
            setPreferAIDifficulty("MEDIUM");
            return;
        }
        // HARD
        if (hard > medium && hard > easy) {
            setPreferAIDifficulty("HARD");
            return;
        }
        // ALL
        if (easy == medium && medium == hard) {
            setPreferAIDifficulty("NONE IN PARTICULAR");
            return;
        }
        // EASY - MEDIUM
        if (easy == medium) {
            setPreferAIDifficulty("EASY - MEDIUM");
            return;
        }
        // MEDIUM - HARD
        if (medium == hard) {
            setPreferAIDifficulty("MEDIUM - HARD");
            return;
        }
        // EASY - HARD
        if (easy == hard) {
            setPreferAIDifficulty("EASY - HARD");
            return;
        }
    }

    function AverageTime()
    {
        let time = 0;

        for (let i = 0; i < matches.length; i++) {
            time += matches[i].time;
        }
    
        setAverageTime(time / matches.length);
    }

    return (
        <div>
            <Navbarr></Navbarr>
            <Snowfall></Snowfall>
            {/* <Snowfall snowflakeCount={100} radius={[0.5,2]}/> */}
            {!edit ? 
                <div className="content-profil">
                    <div className="top">
                        <img src={profile_logo} className="profile-logo"/>
                    </div>
                    <img className="tas" src={tas} alt="tas" />
                    <div className="left">
                        <img className="pp" src={user.profil_pic}/>
                        <h1>{user.username}</h1>
                        <h2>Prénom: {user.first_name}</h2>
                        <h2>Nom: {user.last_name}</h2>
                        <h2>E-mail: {user.email}</h2>
                        <button onClick={formEdit} className="lb">Modifier ton profile</button>
                        <button onClick={handleButton} className="rb">Activer la 2FA</button>
                    </div>
                    <div className="rigth">
                        <div id="stats_up">
                            <h2>Stats</h2>
                            <div>
                                <p>{user.tourney_win_count}</p>
                                <img src={victory_cup} style={{height: "50px", width: "50px"}} />
                            </div>
                            
                        </div>
                        <h4 className="center">Winrate</h4>
                        <WinrateBar loses={user.lose_count} wins={user.win_count} />
                        <div>
                        <div style={{display: "flex", justifyContent: "space-between"}}>
                            <p>Defaites : {user.lose_count}</p><p></p><p> Victoires : {user.win_count}</p>
                        </div>
                        <div className="small_space"></div>
                        <h4 className="center">Prefer AI Difficulty</h4>
                        <p className="center">{preferAIDifficulty}</p>
                        </div>
                        <div className="small_space"></div>
                        <h4 className="center">Average Match Duration</h4>
                        <p className="center">{String(Number.parseFloat(averageTime).toFixed(0)).substring(0, String(Number.parseFloat(averageTime).toFixed(0)).length - 3)} s</p>
                        <div className="small_space"></div>
                        <h4 className="center">Match History</h4>
                        <MatchArray matches={matches} />
                    </div>
                </div> :
            <EditProfil></EditProfil>}
        </div>
    );
}

function WinrateBar({loses, wins}) {
    var fill;
    if (loses == 0 && wins == 0)
        fill = 50
    else
        fill = (loses / (loses + wins)) * 100

    return (
        <div id="winrate">
            <div id='progress' style={{width: fill + "%"}}> </div>
        </div>
    )
}

function MatchResult({result, date, score_left, score_right, time, type, longest_exchange, shortest_exchange}) {
    const [isClicked, setIsClicked] = useState(false)

    return (
        <div onClick={() => {if (isClicked) {setIsClicked(false);} else {setIsClicked(true);} console.log(isClicked)}} className="matchResult" style={{backgroundColor: result == "VICTOIRE" ? "#0f9acc" : "#cc0f38"}}>
            { isClicked ? (
            <div>
            <span className="matchResultFirstRow">    
                    <p className="matchResultResult">{score_left}-{score_right}</p>
                    <p className="matchResultResult">{result}</p>
                    <span><p>{date}</p></span>
            </span>
            <hr/>
            <div>    
                <div className="matchResultData">
                    <p>time</p>
                    <span></span>
                    <p>{time} s</p>
                </div>
                <div className="matchResultData">
                    <p>type</p>
                    <span></span>
                    <p>{type}</p>
                </div>
                <div className="matchResultData">
                    <p>longest_exchange</p>
                    <span></span>
                    <p>{longest_exchange}</p>
                </div>
                <div className="matchResultData">
                    <p>shortest_exchange</p>
                    <span></span>
                    <p>{shortest_exchange}</p>
                </div>
            </div>
            </div>)
            :  (
                <div>
                    <span className="matchResultFirstRow">    
                    <p className="matchResultResult">{score_left}-{score_right}</p>
                    <p className="matchResultResult">{result}</p>
                    <span><p>{date}</p></span>
                    </span>
                </div>
            )}
        </div>
    )
}

function MatchArray({matches}) {
    let matchesResults = []
    
    for (let i = 0; i < matches.length; i++) {
        matchesResults.push(<MatchResult key={i} result={matches[i].result} date={matches[i].date} score_left={matches[i].score_left} score_right={matches[i].score_right} time={String(matches[i].time).substring(0, String(matches[i].time).length - 3)} type={matches[i].type} longest_exchange={matches[i].longest_exchange} shortest_exchange={matches[i].shortest_exchange} />)
    }
   
    return(<div id="matchHistory">
        {matchesResults.map(input=>input)}
        </div>)
}

export default Profil