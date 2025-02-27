import React, {useEffect, useState} from 'react'
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

function TourneyPresentation() {
    const data = useLocation();
    const isAI = data.state == null ? false : data.state.isAI;
    const difficulty = data.state == null ? "easy" : data.state.difficulty;
    const map_index = data.state.map;
    const design_index = data.state.design;
    const p = data.state.points;
    const players = data.state.players;
    const name1 = data.state.name1;
    const name2 = data.state.name2;
    const name3 = data.state.name3;
    const name4 = data.state.name4;
    const name5 = data.state.name5;
    const name6 = data.state.name6;
    const name7 = data.state.name7;
    const name8 = data.state.name8;

    switch (players) {
        case 0:
            return (
                <>
                    <Player name={name1} image={icone_1} left={250} top={403} />
                    <img id='branch_left' src={branch_1} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_1} />
                    <Player name={name2} image={icone_2} left={1390} top={403}/>
                </>
            )
        case 1:
            return (
                <>
                    <Player name={name1} image={icone_1} left={250} top={340} />
                    <Player name={name3} image={icone_3} left={250} top={466} />
                    <img id='branch_left' src={branch_2} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_1} />
                    <Player name={name2} image={icone_2} left={1390} top={403}/>
                </>
            )

        case 2:
            return (
                <>
                    <Player name={name1} image={icone_1} left={250} top={340} />
                    <Player name={name3} image={icone_3} left={250} top={466} />
                    <img id='branch_left' src={branch_2} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_3} />
                    <Player name={name2} image={icone_2} left={1390} top={340} />
                    <Player name={name4} image={icone_4} left={1390} top={466} />
                </>
            )

        case 3:
            return (
                <>
                    <Player name={name1} image={icone_1} left={230} top={280} />
                    <Player name={name3} image={icone_3} left={230} top={468} />
                    <Player name={name5} image={icone_5} left={230} top={595} />
                    <img id='branch_left' src={branch_4} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_3} />
                    <Player name={name2} image={icone_2} left={1390} top={340} />
                    <Player name={name4} image={icone_4} left={1390} top={466} />
                </>
            )

        case 4:
            return (
                <>
                    <Player name={name1} image={icone_1} left={230} top={280} />
                    <Player name={name3} image={icone_3} left={230} top={468} />
                    <Player name={name5} image={icone_5} left={230} top={595} />
                    <img id='branch_left' src={branch_4} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_5} />
                    <Player name={name2} image={icone_2} left={1415} top={280} />
                    <Player name={name4} image={icone_4} left={1415} top={468} />
                    <Player name={name6} image={icone_6} left={1415} top={595} />
                </>
            )

        case 5:
            return (
                <>
                    <Player name={name1} image={icone_1} left={230} top={215} />
                    <Player name={name3} image={icone_3} left={230} top={340} />
                    <Player name={name5} image={icone_5} left={230} top={470} />
                    <Player name={name7} image={icone_7} left={230} top={595} />
                    <img id='branch_left' src={branch_6} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_5} />
                    <Player name={name2} image={icone_2} left={1415} top={280} />
                    <Player name={name4} image={icone_4} left={1415} top={468} />
                    <Player name={name6} image={icone_6} left={1415} top={595} />
                </>
            )

        default:
            return (
                <>
                    <Player name={name1} image={icone_1} left={230} top={215} />
                    <Player name={name3} image={icone_3} left={230} top={340} />
                    <Player name={name5} image={icone_5} left={230} top={470} />
                    <Player name={name7} image={icone_7} left={230} top={595} />
                    <img id='branch_left' src={branch_6} />
                    <img id='victory_cup' src={victory_cup} alt="" />
                    <img id='branch_right' src={branch_7} />
                    <Player name={name2} image={icone_2} left={1415} top={215} />
                    <Player name={name4} image={icone_4} left={1415} top={340} />
                    <Player name={name6} image={icone_6} left={1415} top={470} />
                    <Player name={name8} image={icone_8} left={1415} top={595} />
                </>
            )
    }

}

function Player({name, image, left, top}) {
      return (
            <div className='player2' style={{left: left+'px', top: top+'px'}}>
                <img src={image} />
                <p>{name}</p>
            </div>
        )

}

export default TourneyPresentation;