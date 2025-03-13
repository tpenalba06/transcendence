import '../styles/Game.css'
import { useEffect, useMemo, useState, useRef } from 'react'
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

export default function Game() {
    var ws = useMemo(() => {return new WebSocket("ws://localhost:8000/ws/pong/")}, [ws]);
    const [topLeftPaddle, setTopLeftPaddle] = useState(550);
    const [topRightPaddle, setTopRightPaddle] = useState(550);
    const [ballPos, setBallPos] = useState([500, 500]);
    const ballVelocity = [2, 2];
    var ballInterval = -1;

    // When receiving a message from the back
    ws.onmessage = function(event) {
        let data = JSON.parse(event.data);
        console.log('Data:', data);
    
        if (data.type == "left_paddle_down" || data.type == "left_paddle_up") {
            setTopLeftPaddle(data.message);
        }
        if (data.type == "right_paddle_down" || data.type == "right_paddle_up") {
            setTopRightPaddle(data.message);
        }
        if (data.type == "ball_pos") {
            setBallPos(data.message);
        }
    }

    document.addEventListener("keydown", event => {
        try {
            if (event.key == "ArrowDown") {
                ws.send(JSON.stringify({
                    'message':'right_paddle_down'
                }))
            }
            if (event.key == "ArrowUp") {
                ws.send(JSON.stringify({
                    'message':'right_paddle_up'
                }))
            }
            if (event.key == "KeyS") {
                ws.send(JSON.stringify({
                    'message':'left_paddle_down'
                }))
            }
            if (event.key == "KeyZ") {
                ws.send(JSON.stringify({
                    'message':'left_paddle_up'
                }))
            }
        }catch (error) {
            alert(error)//juste pour montrer l'erreur
        }
    })

    document.addEventListener("keyup", event => {
        try {
            if (event.key == "ArrowDown") {
                ws.send(JSON.stringify({
                    'message':'left_paddle_down'
                }))
            }
            if (event.key == "ArrowUp") {
                ws.send(JSON.stringify({
                    'message':'left_paddle_up'
                }))
            }
        }catch (error) {
            alert(error)
        }
    })


    return (
        <>
            <script src='js/particles.js'></script>
            <script src='js/app.js'></script>
            <Score leftScore={0} rightScore={0}/>
            <div id="field">
                <Paddle isLeft={true} top={topLeftPaddle}/>
                <Paddle isLeft={false} top={topRightPaddle}/>
                <Ball left={ballPos[0]} top={ballPos[1]}/>
                <div id="middle_line"></div>
            </div>
        </>
    )
}


function Paddle({isLeft, top}) {
    const divStyle = {
        left: isLeft ? '15%' : '84%', 
        top: top+'px'
    };

    const idValue = isLeft ? 'paddleLeft' : 'paddleRight';

    return (
        <div className="paddle" id={idValue} style={divStyle}></div>
    )
}


function Ball({left, top}) {
    const divStyle = {
        left: left+'px',
        top: top+'px'
    };

    return (
        <div id="ball" style={divStyle}></div>
    )
}

function Score({leftScore, rightScore}) {
    return (
        <span id='score'>
            <p><span>{leftScore}</span> - <span>{rightScore}</span></p>
        </span>
    )
}

function useInterval(callback, delay) {
    const savedCallback = useRef();
   
    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
   
    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }
