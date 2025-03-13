import React, {useEffect, useState, useRef} from 'react'
import {v4 as uuidv4} from 'uuid';
import "../styles/TourneyPresentation.css"
import { useNavigate, useLocation } from "react-router-dom"
import icone_1 from '../assets/img/dravaono.jpg'; import icone_2 from '../assets/img/edfirmin.jpg'; import icone_3 from '../assets/img/fpalumbo.jpg';
import icone_4 from '../assets/img/jfazi.jpg'; import icone_5 from '../assets/img/ndesprez.jpg'; import icone_6 from '../assets/img/tpenalba.jpg';
import icone_7 from '../assets/img/hdupire.jpg'; import icone_8 from '../assets/img/ychirouz.jpg'; 
import victory_cup from '../assets/img/victory_cup.png'
import branch_1 from '../assets/img/tourney_branch_0.png'; import branch_2 from '../assets/img/tourney_branch_1.png';
import branch_3 from '../assets/img/tourney_branch_2.png'; import branch_4 from '../assets/img/tourney_branch_3.png';
import branch_5 from '../assets/img/tourney_branch_4.png'; import branch_6 from '../assets/img/tourney_branch_5.png';
import branch_7 from '../assets/img/tourney_branch_6.png';
import { getUser, getMatches, getTourney } from "../api"
import axios from 'axios';
import { ACCESS_TOKEN } from "../constants";


function TourneyPresentation() {
    const userToken = localStorage.getItem(ACCESS_TOKEN);
    
    const data = useLocation();
    const isAI = data.state == null ? false : data.state.isAI;
    const difficulty = data.state == null ? "easy" : data.state.difficulty;
    const map_index = data.state.map;
    const design_index = data.state.design;
    const p = data.state.points;
    const players = data.state.players;
    const winner = data.state.winner;
    const leftPlayerName = data.state.leftPlayerName;
	const rightPlayerName = data.state.rightPlayerName;
    const nbOfBattleInTotal = players - 1;
    const tourney_id = data.state.tourney_id;
    const currentBattleIndex = data.state.currentBattleIndex == null ? 0 : data.state.currentBattleIndex + 1;
    const [has_ended, set_has_ended] = useState(false);
    const [next_match, set_next_match] = useState(false);
    const [left_opponent, set_left_opponent] = useState();
    const [right_opponent, set_right_opponent] = useState();
    const navigate = useNavigate();    
    const [user, setUser] = useState()
    const [tourney, setTourney] = useState(null)
    const [user_icone, set_user_icone] = useState()

    useEffect(() => {
        inituser();
        inittourney();
    }, []);
    
    useEffect(() => {
        if (user) {
            set_user_icone(user.profil_pic);
        }
    }, [user]);
    
    const inituser = async () => {
        const TMPuser = await getUser()
        setUser(TMPuser);
    }
    const inittourney = async () => {
        const TMPtourney = await getTourney(tourney_id)
        setTourney(TMPtourney);
    }
    
    useEffect(() => {
        if (tourney)
            addwinnertourney();
    }, [tourney])

    const addwinnertourney = async () => {
        if (leftPlayerName) {
            if (winner == 'LEFT')
		        await axios.post('api/user/addWinnerToTourney/', {tourney_id, winner : leftPlayerName, match_number : currentBattleIndex})
            else
                await axios.post('api/user/addWinnerToTourney/', {tourney_id, winner : rightPlayerName, match_number : currentBattleIndex})
        }
        const TMPtourney = await getTourney(tourney_id)
        setTourney(TMPtourney);
    }

    function getIconeWithName(name) {
        if (name == tourney.name1)
            return user_icone;
        if (name == tourney.name2)
            return icone_1;
        if (name == tourney.name3)
            return icone_2;
        if (name == tourney.name4)
            return icone_3;
        if (name == tourney.name5)
            return icone_4;
        if (name == tourney.name6)
            return icone_5;
        if (name == tourney.name7)
            return icone_6;
        if (name == tourney.name8)
            return icone_7;
        return icone_8;
    } 

    useEffect(() => {
        async function addtourneywincount() {

            if (winner == "LEFT" && has_ended){
                await axios.post('api/user/addTourneyWinCount/', {userToken})
            }
            }
        addtourneywincount();
    }, [has_ended])


    useEffect(() => {
        determineNextMatch();
    }, [tourney])

    function nextMatch(name_first, name_second) {
        set_left_opponent(name_first);
        set_right_opponent(name_second);
        set_next_match(true);
    }

    // Determiner prochain match
    function determineNextMatch() {
        if (!tourney)
            return;

        switch (players) {
            case 0:
                if (currentBattleIndex == 0) 
                    nextMatch(tourney.name1, tourney.name2);
                else
                    set_has_ended(true);
                break;
        
            case 1:
                if (currentBattleIndex == 0) 
                    nextMatch(tourney.name1, tourney.name3);
                else if (currentBattleIndex == 1)
                    nextMatch(tourney.winner_match1, tourney.name2);
                else
                    set_has_ended(true);
                break;  

            case 2:
                if (currentBattleIndex == 0)
                    nextMatch(tourney.name1, tourney.name3);
                else if (currentBattleIndex == 1)
                    nextMatch(tourney.name2, tourney.name4);
                else if (currentBattleIndex == 2)
                    nextMatch(tourney.winner_match1, tourney.winner_match2);
                else
                    set_has_ended(true);
                break;  

            case 3:
                if (currentBattleIndex == 0)
                    nextMatch(tourney.name3, tourney.name5);
                else if (currentBattleIndex == 1)
                    nextMatch(tourney.name2, tourney.name4);
                else if (currentBattleIndex == 2)
                    nextMatch(tourney.name1, tourney.winner_match1);
                else if (currentBattleIndex == 3)
                    nextMatch(tourney.winner_match3, tourney.winner_match2);
                else
                    set_has_ended(true);
                break;  

            case 4:
                if (currentBattleIndex == 0)
                    nextMatch(tourney.name3, tourney.name5);
                else if (currentBattleIndex == 1)
                    nextMatch(tourney.name4, tourney.name6);
                else if (currentBattleIndex == 2)
                    nextMatch(tourney.name1, tourney.winner_match1);
                else if (currentBattleIndex == 3)
                    nextMatch(tourney.name2, tourney.winner_match2);
                else if (currentBattleIndex == 4)
                    nextMatch(tourney.winner_match3, tourney.winner_match4);
                else
                    set_has_ended(true);
                break;  

            case 5:
                if (currentBattleIndex == 0)
                    nextMatch(tourney.name1, tourney.name3);
                else if (currentBattleIndex == 1)
                    nextMatch(tourney.name5, tourney.name7);
                else if (currentBattleIndex == 2)
                    nextMatch(tourney.name4, tourney.name6);
                else if (currentBattleIndex == 3)
                    nextMatch(tourney.name2, tourney.winner_match3);
                else if (currentBattleIndex == 4)
                    nextMatch(tourney.winner_match1, tourney.winner_match2);
                else if (currentBattleIndex == 5)
                    nextMatch(tourney.winner_match4, tourney.winner_match5);
                else
                    set_has_ended(true);
                break;  

            case 6:
                if (currentBattleIndex == 0)
                    nextMatch(tourney.name1, tourney.name3);
                else if (currentBattleIndex == 1)
                    nextMatch(tourney.name5, tourney.name7);
                else if (currentBattleIndex == 2)
                    nextMatch(tourney.name2, tourney.name4);
                else if (currentBattleIndex == 3)
                    nextMatch(tourney.name6, tourney.name8);
                else if (currentBattleIndex == 4)
                    nextMatch(tourney.winner_match1, tourney.winner_match2);
                else if (currentBattleIndex == 5)
                    nextMatch(tourney.winner_match3, tourney.winner_match4);
                else if (currentBattleIndex == 6)
                    nextMatch(tourney.winner_match5, tourney.winner_match6);
                else
                    set_has_ended(true);home
                break;  

        }
    }

    if (!tourney)
        return

    switch (players) {
        case 0:
            return (
                <>
                    <Player name={tourney.name1} image={user_icone} left_opponent={left_opponent} right_opponent={right_opponent} left={250} top={403} />
                    <img id='branch_left' src={branch_1} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_1} />
                    <Player name={tourney.name2} image={icone_1} left_opponent={left_opponent} right_opponent={right_opponent} left={1390} top={403}/>
                    <Victory show={has_ended} winner_name={tourney.winner_match1} winner_icone={getIconeWithName(tourney.winner_match1)} />
                    <NextMatch show={next_match} left_name={left_opponent} right_name={right_opponent} left_icone={getIconeWithName(left_opponent)} right_icone={getIconeWithName(right_opponent)} 
                    map_index={map_index} design_index={design_index} p={p} players={players} currentBattleIndex={currentBattleIndex} tourney_id={tourney_id} />
                </>
            )
        case 1:
            return (
                <>
                    <Player name={tourney.name1} image={user_icone} left_opponent={left_opponent} right_opponent={right_opponent} left={250} top={340} />
                    <Player name={tourney.name3} image={icone_2} left_opponent={left_opponent} right_opponent={right_opponent} left={250} top={466} />
                    <img id='branch_left' src={branch_2} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_1} />
                    <Player name={tourney.name2} image={icone_1} left_opponent={left_opponent} right_opponent={right_opponent} left={1390} top={403}/>
                    <Victory show={has_ended} winner_name={tourney.winner_match2} winner_icone={getIconeWithName(tourney.winner_match2)} />
                    <NextMatch show={next_match} left_name={left_opponent} right_name={right_opponent} left_icone={getIconeWithName(left_opponent)} right_icone={getIconeWithName(right_opponent)} 
                    map_index={map_index} design_index={design_index} p={p} players={players} currentBattleIndex={currentBattleIndex} tourney_id={tourney_id} />
                </>
            )

        case 2:
            return (
                <>
                    <Player name={tourney.name1} image={user_icone} left_opponent={left_opponent} right_opponent={right_opponent} left={250} top={340} />
                    <Player name={tourney.name3} image={icone_2} left_opponent={left_opponent} right_opponent={right_opponent} left={250} top={466} />
                    <img id='branch_left' src={branch_2} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_3} />
                    <Player name={tourney.name2} image={icone_1} left_opponent={left_opponent} right_opponent={right_opponent} left={1390} top={340} />
                    <Player name={tourney.name4} image={icone_3} left_opponent={left_opponent} right_opponent={right_opponent} left={1390} top={466} />
                    <Victory show={has_ended} winner_name={tourney.winner_match3} winner_icone={getIconeWithName(tourney.winner_match3)} />
                    <NextMatch show={next_match} left_name={left_opponent} right_name={right_opponent} left_icone={getIconeWithName(left_opponent)} right_icone={getIconeWithName(right_opponent)} 
                    map_index={map_index} design_index={design_index} p={p} players={players} currentBattleIndex={currentBattleIndex} tourney_id={tourney_id} />
                </>
            )

        case 3:
            return (
                <>
                    <Player name={tourney.name1} image={user_icone} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={280} />
                    <Player name={tourney.name3} image={icone_2} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={468} />
                    <Player name={tourney.name5} image={icone_4} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={595} />
                    <img id='branch_left' src={branch_4} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_3} />
                    <Player name={tourney.name2} image={icone_1} left_opponent={left_opponent} right_opponent={right_opponent} left={1390} top={340} />
                    <Player name={tourney.name4} image={icone_3} left_opponent={left_opponent} right_opponent={right_opponent} left={1390} top={466} />
                    <Victory show={has_ended} winner_name={tourney.winner_match4} winner_icone={getIconeWithName(tourney.winner_match4)} />
                    <NextMatch show={next_match} left_name={left_opponent} right_name={right_opponent} left_icone={getIconeWithName(left_opponent)} right_icone={getIconeWithName(right_opponent)} 
                    map_index={map_index} design_index={design_index} p={p} players={players} currentBattleIndex={currentBattleIndex} tourney_id={tourney_id} />

                </>
            )

        case 4:
            return (
                <>
                    <Player name={tourney.name1} image={user_icone} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={280} />
                    <Player name={tourney.name3} image={icone_2} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={468} />
                    <Player name={tourney.name5} image={icone_4} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={595} />
                    <img id='branch_left' src={branch_4} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_5} />
                    <Player name={tourney.name2} image={icone_1} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={280} />
                    <Player name={tourney.name4} image={icone_3} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={468} />
                    <Player name={tourney.name6} image={icone_5} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={595} />
                    <Victory show={has_ended} winner_name={tourney.winner_match5} winner_icone={getIconeWithName(tourney.winner_match5)} />
                    <NextMatch show={next_match} left_name={left_opponent} right_name={right_opponent} left_icone={getIconeWithName(left_opponent)} right_icone={getIconeWithName(right_opponent)} 
                    map_index={map_index} design_index={design_index} p={p} players={players} currentBattleIndex={currentBattleIndex} tourney_id={tourney_id} />

                </>
            )

        case 5:
            return (
                <>
                    <Player name={tourney.name1} image={user_icone} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={215} />
                    <Player name={tourney.name3} image={icone_2} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={340} />
                    <Player name={tourney.name5} image={icone_4} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={470} />
                    <Player name={tourney.name7} image={icone_6} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={595} />
                    <img id='branch_left' src={branch_6} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_5} />
                    <Player name={tourney.name2} image={icone_1} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={280} />
                    <Player name={tourney.name4} image={icone_3} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={468} />
                    <Player name={tourney.name6} image={icone_5} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={595} />
                    <Victory show={has_ended} winner_name={tourney.winner_match6} winner_icone={getIconeWithName(tourney.winner_match6)} />
                    <NextMatch show={next_match} left_name={left_opponent} right_name={right_opponent} left_icone={getIconeWithName(left_opponent)} right_icone={getIconeWithName(right_opponent)} 
                    map_index={map_index} design_index={design_index} p={p} players={players} currentBattleIndex={currentBattleIndex} tourney_id={tourney_id} />

                </>
            )

        default:
            return (
                <>
                    <Player name={tourney.name1} image={user_icone} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={215} />
                    <Player name={tourney.name3} image={icone_2} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={340} />
                    <Player name={tourney.name5} image={icone_4} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={470} />
                    <Player name={tourney.name7} image={icone_6} left_opponent={left_opponent} right_opponent={right_opponent} left={230} top={595} />
                    <img id='branch_left' src={branch_6} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_7} />
                    <Player name={tourney.name2} image={icone_1} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={215} />
                    <Player name={tourney.name4} image={icone_3} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={340} />
                    <Player name={tourney.name6} image={icone_5} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={470} />
                    <Player name={tourney.name8} image={icone_7} left_opponent={left_opponent} right_opponent={right_opponent} left={1415} top={595} />
                    <Victory show={has_ended} winner_name={tourney.winner_match7} winner_icone={getIconeWithName(tourney.winner_match7)} />
                    <NextMatch show={next_match} left_name={left_opponent} right_name={right_opponent} left_icone={getIconeWithName(left_opponent)} right_icone={getIconeWithName(right_opponent)} 
                    map_index={map_index} design_index={design_index} p={p} players={players} currentBattleIndex={currentBattleIndex} tourney_id={tourney_id} />

                </>
            )
    }

}

function Player({name, image, left_opponent, right_opponent, left, top, isDefeated = false}) {
    let highlight = false;
    
    if (left_opponent == name || right_opponent == name) 
        highlight = true;

    if (isDefeated) {
        return (
            <div className='player_defeated' style={{left: left+'px', top: top+'px'}}>
                <img src={image} />
                <p>{name}</p>
            </div>
        )
    }
    else if (highlight) {
        return (
            <div className='player_highlight' style={{left: left+'px', top: top+'px'}}>
                <img src={image} />
                <p>{name}</p>
            </div>
        )        
    }
    else {  
        return (
            <div className='player2' style={{left: left+'px', top: top+'px'}}>
                <img src={image} />
                <p>{name}</p>
            </div>
        )
    }
}

function Victory({show, winner_name, winner_icone}) {
    const navigate = useNavigate();    

    if (show) {

        return (
            <div id='victory'>
                <p>VICTOIRE DE</p>
                <div id='space'></div>
                <Player name={winner_name} image={winner_icone} left={140} top={80} />
                <Button name={"Go To Main Menu"} callback={() => {navigate("/home")}} />
            </div>
        )
    }
    else {
        return;
    }
}

function NextMatch({show, left_name, right_name, left_icone, right_icone, map_index, design_index, p, players, currentBattleIndex, tourney_id}) {
    const navigate = useNavigate();    
    
    function beginNextMatch() {
        const roomId = uuidv4();
        navigate(`/pong/${roomId}`, {state : { isAI : false, map : map_index, design : design_index, points : p, players : players, leftPlayerName : left_name, rightPlayerName : right_name, returnPage : '/tourney/tourneyPresentation', tourney_id : tourney_id, currentBattleIndex : currentBattleIndex
        }});
    }
    
    if (show) {
        return (
            <div id='next_match'>
                <p>PROCHAIN MATCH</p>
                <div id='space'></div>
                <Player name={left_name} image={left_icone} left={20} top={90} />
                <Player name={right_name} image={right_icone} left={260} top={90} />
                <Button name={"Prochain Match"} callback={() => {beginNextMatch()}} />
            </div>
        )
    }
    else {
        return;
    }
}

function Button({name, callback}) {
	return (
	  <tr>
		<td>
		  <button className='button' onClick={() => callback()}>{name} </button>
		</td>
	  </tr>
	)
}

export default TourneyPresentation;