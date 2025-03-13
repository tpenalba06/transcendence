import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Shake } from 'reshake';
import styles from './Pong.module.css';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import classic_paddle_design from '../../assets/img/classic_paddle_design.png'
import classic_ball_design from '../../assets/img/classic_ball_design.png'
import tennis_paddle_design from '../../assets/img/tennis_paddle_design.png'
import tennis_ball_design from '../../assets/img/tennis_ball_design.png'
import cool_paddle_design from '../../assets/img/cool_paddle_design.png'
import cool_ball_design from '../../assets/img/cool_ball_design.png'
import sick_paddle_design from '../../assets/img/sick_paddle_design.png'
import sick_ball_design from '../../assets/img/sick_ball_design.png'
import swag_paddle_design from '../../assets/img/swag_paddle_design.png'
import swag_ball_design from '../../assets/img/swag_ball_design.png'
import classic_map from '../../assets/img/classic_map.png'
import tennis_map from '../../assets/img/tennis_map.png'
import table_tennis_map from '../../assets/img/table_tennis_map.png'
import { ACCESS_TOKEN } from "../../constants";


function Pong() {

    const { roomid } = useParams();
	const userToken = localStorage.getItem(ACCESS_TOKEN);
	var ws = useMemo(() => {return new WebSocket(`ws://localhost:8000/ws/pong/${roomid}`)}, [ws]);
    const canvasRef = useRef(null);
    const canvasRef2 = useRef(null);
	const keys = useRef({ left_up: false, left_down: false, right_up: false, right_down: false});
	const LPaddle = useRef({ x: 50, y: 250});
	const RPaddle = useRef({ x: 750, y: 250});
	const [score, setScore] = useState({left: 0, right: 0});
	const gameStarted = useRef(false);
	const ball_history = useRef([]);
	const ball_history_max_size = 10;
    const ball = useRef({ x: 400, y: 250 });
    const obj = useRef({ x: 400, y: 250 });
    const dir = useRef(1);
    const vec = useRef(0.005);
    const speed = useRef(2);
    const lastUpdateTimeRef = useRef(0);
    const [count, setCount]  = useState(0);
	const [winner, setWinner] = useState("");
	const [longest_exchange, set_longest_exchange] = useState(0);
	const [shortest_exchange, set_shortest_exchange] = useState(0);
	const hit_history = useRef([]);
	const [shake, set_shake] = useState(false);
	const [time_start, set_time_start] = useState(0)
	//const [score_history, set_score_history] = useState([])

	const map_design = [classic_map, tennis_map, table_tennis_map];
	const ball_design = [classic_ball_design, tennis_ball_design, cool_ball_design, sick_ball_design, swag_ball_design];
	const paddle_design = [classic_paddle_design, tennis_paddle_design, cool_paddle_design, sick_paddle_design, swag_paddle_design];

	const data = useLocation();
	const isAI = data.state == null ? false : data.state.isAI;
	const difficulty = data.state == null ? "easy" : data.state.difficulty;
	const map_index = data.state.map;
	const design_index = data.state.design;
	const points = data.state.points + 2;
	const players = data.state.players;
	const leftPlayerName = data.state.leftPlayerName;
	const rightPlayerName = data.state.rightPlayerName;
	const tourney_id = data.state.tourney_id;
    const currentBattleIndex = data.state.currentBattleIndex;
	const returnPage = data.state.returnPage == null ? '/selection' : data.state.returnPage;

	const [countdown, setCountdown] = useState(-1);

    const navigate = useNavigate();

    // When receiving a message from the back
    ws.onmessage = function(event) {
        let data = JSON.parse(event.data);
        console.log('Data:', data);
    
		if (data.type == "connection_established") {
			ws.send(JSON.stringify({
				'message':'points',
				'value': points
			}));
			ws.send(JSON.stringify({
				'message':'isAi',
				'value': isAI
			}));
			if (isAI){
				ws.send(JSON.stringify({
					'message':'difficulty',
					'value': difficulty
				}));
			}
			setCountdown(3);	
		}

        if (data.type == "left_paddle_down" || data.type == "left_paddle_up") {
            LPaddle.current.y = data.message
        }
        if (data.type == "right_paddle_down" || data.type == "right_paddle_up") {
            RPaddle.current.y = data.message
        }
        if (data.type == "ball_pos") {
            ball.x = data.x;
            ball.y = data.y;

			ball_history.current.push({x : ball.x, y : ball.y});
			if (ball_history.current.length >= ball_history_max_size) {
				ball_history.current.shift();
			}
        }
		if (data.type == "score") {
			set_shake(true);
			setTimeout(() => { set_shake(false); }, 200);
			setScore({left: data.left, right: data.right});
			//set_score_history([...score_history, data.winner])
		}
		if (data.type == "hit") {
			let dix = data.dx;
			let diy = data.dy;

			//let audio = new Audio("../../assets/sounds/pong.mp3");
			//audio.play();

			hit_history.current.length = 0;
			let rand = 5 + (Math.random() * (10-5));
			for (let i = 0; i < rand; i++) {
				dix -= -3 + (Math.random() * (5+3));
				diy -= -3 + (Math.random() * (5+3));
				hit_history.current.push({x : ball.x, y : ball.y, dx : dix, dy : diy, time: 10, a : 1});
			}
		}
		if (data.type == "winner") {
			set_longest_exchange(data.longest_exchange);
			set_shortest_exchange(data.shortest_exchange);
			setWinner(data.winner + " WIN !");
			//set_score_history([...score_history, data.winner])
			setTimeout(() => { navigate(returnPage, {state : { isAI : isAI, map : map_index, design : design_index, points : points - 2, players : players, winner : data.winner, leftPlayerName : leftPlayerName, rightPlayerName : rightPlayerName, tourney_id : tourney_id, currentBattleIndex : currentBattleIndex
			}}) }, 3000);
		}
	}


	async function postMatchStats() {
		if (winner == "")
			return

		var result;
		if (winner == 'LEFT WIN !') {
			result = "VICTOIRE"
			score.left += 1;	
		}
		else {
			result = "DEFAITE"
			score.right += 1;	
		}
		
		const d = new Date();
		const day = d.getDate();
		const month = d.getMonth()+1;
		const year = d.getFullYear();
		const a = year + '-' + month + '-' + day;

		const time = d.getTime() - time_start.getTime();
		console.log(time);
		
		if (isAI)
			await axios.post('api/user/addMatchStats/', {userToken, result, date: a, score_left: score.left, score_right: score.right, time: time, type: "AI " + difficulty, longest_exchange, shortest_exchange})
		else
			await axios.post('api/user/addMatchStats/', {userToken, result, date: a, score_left: score.left, score_right: score.right, time: time, type: "Local", longest_exchange, shortest_exchange})
	}

	useEffect(() => {
		postMatchStats();
	}, [winner])

	useEffect(() => {

		// Listens for KeyDown event
		const handleKeyDown = (event) => {
			switch (event.key)
			{
				case 'ArrowUp':
					keys.current.right_up = true;
					break;
				case 'ArrowDown':
					keys.current.right_down = true;
					break;
				case 'e':
					keys.current.left_up = true;
					break;
				case 'd':
					keys.current.left_down = true;
					break;
			}
		};

		// Listens for KeyUp event
		const handleKeyUp = (event) => {
			switch (event.key)
			{
				case 'ArrowUp':
					keys.current.right_up = false;
					break;
				case 'ArrowDown':
					keys.current.right_down = false;
					break;
				case 'e':
					keys.current.left_up = false;
					break;
				case 'd':
					keys.current.left_down = false;
					break;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.addEventListener('keyup', handleKeyUp);
		};
	}, []);

	const handlePaddlesMovement = () =>
	{
		// Moves the paddles in the corresponding direction depending on pressed keys
		// See handleKeyUp() and handleKeyDown() above
		if (keys.current.left_up)
			ws.send(JSON.stringify({
				'message':'left_paddle_up'
			}))
		if (keys.current.left_down)
			ws.send(JSON.stringify({
				'message':'left_paddle_down'
			}))
		if (keys.current.right_up && !isAI)
			ws.send(JSON.stringify({
				'message':'right_paddle_up'
			}))
		if (keys.current.right_down && !isAI)
			ws.send(JSON.stringify({
				'message':'right_paddle_down'
			}))
	}

	const drawBall = (ctx, x, y, img) => {
		ctx.globalAlpha = 0
		for (let i = 0; i < ball_history.current.length; i++) {
			ctx.globalAlpha = ctx.globalAlpha + 0.1;
			ctx.beginPath();
			ctx.drawImage(img, ball_history.current[i].x - 8, ball_history.current[i].y - 8);
			ctx.fill();
		}

		// Drawing the ball at the given position
		ctx.globalAlpha = 1
		ctx.beginPath();
		ctx.drawImage(img, x - 8, y - 8);
		ctx.fill();
	};

	const drawPaddle = (ctx, x, y, img) => {
		// Drawing a paddle centered at the given position
		ctx.beginPath();
		ctx.drawImage(img, x, y - 60, 10, 120);
		ctx.fill();
	}

	const drawWinner = (ctx) => {
		if (winner != "") {
			ctx.textAlign = "center";
			ctx.fillStyle = "grey";
			ctx.fillRect(ctx.canvas.width / 2 - ctx.canvas.width / 4 ,ctx.canvas.height / 2 - ctx.canvas.height / 4, ctx.canvas.width / 2, ctx.canvas.height / 2);

			ctx.font = "40px Arial ";
			ctx.fillStyle = "white";
			ctx.textAlign = "center";
			ctx.fillText(winner, ctx.canvas.width / 2,ctx.canvas.height / 2);
		}
	}

	const drawCountdown = (ctx) => {
		if (countdown != -1) {
			ctx.textAlign = "center";
			ctx.fillStyle = "grey";
			ctx.fillRect(ctx.canvas.width / 2 - ctx.canvas.width / 4 ,ctx.canvas.height / 2 - ctx.canvas.height / 4, ctx.canvas.width / 2, ctx.canvas.height / 2);

			ctx.font = "40px Arial ";
			ctx.fillStyle = "white";
			ctx.textAlign = "center";
			ctx.fillText(countdown, ctx.canvas.width / 2,ctx.canvas.height / 2);
		}
	}

	const drawHits = (ctx) => {
		for (let i = 0; i < hit_history.current.length; i++) {
		//	ctx.globalAlpha = hit_history.current[i].a;
			ctx.fillStyle = "grey";
			ctx.fillRect(hit_history.current[i].x , hit_history.current[i].y, 16, 16);	
			hit_history.current[i].x += hit_history.current[i].dx;
			hit_history.current[i].y += hit_history.current[i].dy;
		//	hit_history.current[i].a += 0.05;
		}
	}

	const drawGame = (ctx, background, paddle_img, ball_img) =>
	{
		// Fill background in black
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.drawImage(background, 0, 0, ctx.canvas.width, ctx.canvas.height);
		
		/*ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		*/
		if (winner != "") {
			drawWinner(ctx);
		}
		else if (countdown > 0) {
			drawCountdown(ctx);
		}
		else {
			// Drawing non-static game elements
			drawPaddle(ctx, LPaddle.current.x - 10, LPaddle.current.y, paddle_img);
			drawPaddle(ctx, RPaddle.current.x, RPaddle.current.y, paddle_img);
			drawBall(ctx, ball.x, ball.y, ball_img);
			drawHits(ctx);
		}
	}

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		var background = new Image();
		var paddle_img = new Image();
		var ball_img = new Image();
		
		background.src = map_design[map_index];
		context.drawImage(background, 0, 0);
		background.onload = function(){
			context.drawImage(background,0,0);   
		}

		paddle_img.src = paddle_design[design_index];
		ball_img.src = ball_design[design_index];

		const animate = (time) =>
		{
			handlePaddlesMovement();
			drawGame(context, background, paddle_img, ball_img);

			requestAnimationFrame(animate);
		};
		requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animate);
    }, [winner, countdown]);

	useEffect(() => {
		const canvas = canvasRef2.current;
		const ctx = canvas.getContext('2d');

		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.fillStyle = 'grey';
		ctx.fillRect(ctx.canvas.width / 2 - 1, 0, 2, ctx.canvas.height);

		ctx.shadowBlur = 10;
		ctx.shadowColor = "black";
		ctx.fillStyle = `rgb(
			0
			${Math.floor(255 / points * score.left)}
			${Math.floor(255 / points * score.left)})`;
		ctx.fillRect(2, 2, score.left * ctx.canvas.width / 2 / points, ctx.canvas.height - 6);

		ctx.fillStyle = `rgb(
			${Math.floor(255 / points * score.right)}
			0
			${Math.floor(255 / points * score.right)})`;
		ctx.fillRect(ctx.canvas.width - score.right * ctx.canvas.width / 2 / points, 2, score.right * ctx.canvas.width / 2 / points - 2, ctx.canvas.height - 6);

		ctx.fillStyle = 'white';
		let dist = ctx.canvas.width / (points * 2);
		for (let i = 1; i < points * 2; i++) {
			if (i == points) {
				ctx.fillRect(dist * i - 2, 0, 4, 15);
				ctx.fillRect(dist * i - 2, ctx.canvas.height - 15, 4, 15);
			}
			else {
				ctx.fillRect(dist * i - 2, 0, 4, 10);
				ctx.fillRect(dist * i - 2, ctx.canvas.height - 10, 4, 10);
			}
		}

    }, [score]);

	useEffect(() => {
		countdown > 0 && setTimeout(() => setCountdown(countdown - 1), 1000);
		if (countdown == 0) {
			ws.send(JSON.stringify({
				'message':'begin_game'
			}));
			
			set_time_start(new Date())
		}
	}, [countdown]);


	return (
		<>
        <div className={styles.MovingBall}>
			<canvas ref={canvasRef2} width={800} height={50} style={{ border: '5px solid white', borderRadius: '5px', marginBottom: '5px' }}></canvas>
			<canvas ref={canvasRef} width={800} height={500} style={{ border: '5px solid white' }}></canvas>
		</div>
		</>
	);
}

export default Pong;