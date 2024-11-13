import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './Pong.module.css';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";


function Pong() {

    const canvasRef = useRef(null);
	const keys = useRef({ lu: false, ld: false, ru: false, rd: false});
	const LPaddle = useRef({ x: 50, y: 250});
	const RPaddle = useRef({ x: 750, y: 250});
	const [score, setScore] = useState({left: 0, right: 0});
	const gameStarted = useRef(false);
    const pos = useRef({ x: 400, y: 250 });
    const obj = useRef({ x: 400, y: 250 });
    const dir = useRef(1);
    const vec = useRef(0.005);
    const speed = useRef(2);
    const lastUpdateTimeRef = useRef(0);
    const [count, setCount] = useState(0);

	// Setting the tab on mount
	useEffect(() => {
		document.title = "Pong";
	}, []);

    // Counter effect for seconds since start
    useEffect(() => {
        const intervalId = setInterval(() => {
			if (gameStarted.current == true)
	            setCount((prevCount) => prevCount + 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

	useEffect(() => {

		// Listens for KeyDown event
		const handleKeyDown = (event) => {
			switch (event.key)
			{
				case 'ArrowUp':
					keys.current.ru = true;
					break;
				case 'ArrowDown':
					keys.current.rd = true;
					break;
				case 'e':
					keys.current.lu = true;
					break;
				case 'd':
					keys.current.ld = true;
					break;
			}
		};

		// Listens for KeyUp event
		const handleKeyUp = (event) => {
			switch (event.key)
			{
				case 'ArrowUp':
					keys.current.ru = false;
					break;
				case 'ArrowDown':
					keys.current.rd = false;
					break;
				case 'e':
					keys.current.lu = false;
					break;
				case 'd':
					keys.current.ld = false;
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
		if (keys.current.lu)
			LPaddle.current.y += (LPaddle.current.y <= 60 ? 0 : -5);
		if (keys.current.ld)
			LPaddle.current.y += (LPaddle.current.y >= 440 ? 0 : 5);
		if (keys.current.ru)
			RPaddle.current.y += (RPaddle.current.y <= 60 ? 0 : -5);
		if (keys.current.rd)
			RPaddle.current.y += (RPaddle.current.y >= 440 ? 0 : 5);
	}

    const handleFaster = () => {
        speed.current = (speed.current >= 100 ? 100 : speed.current + 1);
    };

    const handleSlower = () => {
        speed.current = (speed.current <= 1 ? 1 : speed.current - 1);
    };

	const playAgain = () => {

		// Adding score depending on the position of the ball, x=791.1 would be the right side, x=9 for left
		if (pos.current.x == 791.1)
			setScore((s) => s = {...s, left: s.left + 1});
		else
			setScore((s) => s = {...s, right: s.right + 1});

		// Resets the gamestate to keep playing (except scores)
		speed.current = 2;
		pos.current = ({ x: 400, y: 250 });
		obj.current = ({ x: 400, y: 250 });
		LPaddle.current = ({ x: 50, y: 250});
		RPaddle.current = ({ x: 750, y: 250});
		vec.current = 0.005;
		nextHit();
	}

	const restartGame = () => {

		// Resets completely the gamestate
		gameStarted.current = false;
		pos.current = ({ x: 400, y: 250 });
		obj.current = ({ x: 400, y: 250 });
		LPaddle.current = ({ x: 50, y: 250});
		RPaddle.current = ({ x: 750, y: 250});
		vec.current = 0.005;
		speed.current = 2;
	}
	
	const startGame = () => {

		if (gameStarted.current == true)
		return ;
		// Sets the gamestate to default values and allows the game to start moving the ball
		setCount(0);
		gameStarted.current = true;
		setScore({ left: 0, right: 0 });
		vec.current = 0.005;
		speed.current = 2;
		pos.current = ({ x: 400, y: 250 });
		obj.current = ({ x: 400, y: 250 });
	}

	const drawBall = (ctx, x, y) => {
		// Drawing the ball at the given position
		ctx.beginPath();
		ctx.arc(x, y, 10, 0, 2 * Math.PI);
		ctx.fillStyle = 'white';
		ctx.fill();
	};

	const drawPaddle = (ctx, x, y) => {
		// Drawing a paddle centered at the given position
		ctx.beginPath();
		ctx.rect(x, y - 60, 10, 120);
		ctx.fillStyle = 'white';
		ctx.fill();
	}

	const drawGame = (ctx) =>
	{
		// Fill background in black
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		// Drawing center lines for esthetics (looks nice, right ?)
		ctx.beginPath();
		for (let i = 0; i != 500; i += 10)
			ctx.rect(398, i, 4, 1);
		ctx.fillStyle = 'grey';
		ctx.fill();

		// Drawing non-static game elements
		drawPaddle(ctx, LPaddle.current.x - 10, LPaddle.current.y);
		drawPaddle(ctx, RPaddle.current.x, RPaddle.current.y);
		drawBall(ctx, pos.current.x, pos.current.y);
	}

	function isPaddleAtLevel(side, y) {
		
		let paddleY = (side == 1 ? RPaddle.current.y : LPaddle.current.y);

		// When at a paddle's x value, checks if the ball y value is inside the paddel's range to allow rebound
		if (y > paddleY + 65 || y < paddleY - 65)
			return (false);
		return (true);
	}

	function getNewVector(side, y) {

		let paddleY = (side == 1 ? RPaddle.current.y : LPaddle.current.y);
		let newVec = 2 * (Math.abs(paddleY - y) / 60);

		// A new vector is assigned relative to the location of a hit on a paddle
		newVec = (newVec < 0.05 ? 0.05 : newVec);
		newVec *= (paddleY - y > 0 ? -1 : 1);
		return (newVec);
	}

    const nextHit = () => {

		// Setting next hit position
		let newY = vec.current > 0 ? 491.1 : 9.1;
		let newX = dir.current * ((newY - obj.current.y) / vec.current) + obj.current.x;

		// Checking if the ball is going past a paddle, setting the next position no further than paddle level
		if (((newX > 750 && dir.current == 1) || (newX < 50 && dir.current == -1)) && pos.current.x < 750 && pos.current.x > 50)
		{
			newX = newX > 750 ? 750 : 50;
			newY = dir.current * (newX - obj.current.x) * vec.current + obj.current.y;

		} // Or, if at paddle level, checking if the ball is going to rebound or score a point
		else if (obj.current.x == 750 || obj.current.x == 50)
		{
			// And if this side's paddle is in range, the ball bounces off
			if (isPaddleAtLevel(dir.current, pos.current.y) == true)
			{
				vec.current = getNewVector(dir.current, pos.current.y);
				dir.current *= -1;
				newY = vec.current > 0 ? 491.1 : 9.1;
				newX = dir.current * ((newY - obj.current.y) / vec.current) + obj.current.x;
				if (newX >= 750 || newX <= 50) {
					newX = (newX >= 750 ? 750 : 50);
					newY = dir.current * (newX - pos.current.x) * vec.current + pos.current.y;
				}
				handleFaster();
			}
			else // Otherwise, the ball goes to score a point
			{
				if (newX >= 791 || newX <= 9) {
					newX = (newX >= 791 ? 791.1 : 9);
					newY = dir.current * (newX - pos.current.x) * vec.current + pos.current.y;
					dir.current *= -1;
				}
				else
					vec.current *= -1;
			}
		}
		else // Or rebound didn't need any specific verification
		{
			console.log("no specific");
			if (newX >= 750 || newX <= 50) {
				// if (pos.current.x >= 750 || pos.current.x <= 50)
				if (pos.current.x > 750 || pos.current.x < 50)
					newX = (newX >= 750 ? 791.1 : 9);
				else
					newX = (newX >= 750 ? 750 : 50);
				newY = dir.current * (newX - pos.current.x) * vec.current + pos.current.y;
				dir.current *= -1;
			}
			else
				vec.current *= -1;
		}

		pos.current = obj.current;
		obj.current = {x: newX, y: newY};
    };

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		const animate = (time) =>
		{
			if (time - lastUpdateTimeRef.current > 1000 / 61) {
				// Calculating the distance from the current position to the target position
				const dx = obj.current.x - pos.current.x;
				const dy = obj.current.y - pos.current.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				// The game is more fun when you can move the paddles
				handlePaddlesMovement();

				if (distance <= speed.current) { // Snap to target if close enough, not going further than target
					pos.current.x = obj.current.x;
					pos.current.y = obj.current.y;
					drawGame(context);
					// Checking if the ball has scored a point yet
					if (pos.current.x == 791.1 || pos.current.x == 9)
						playAgain();
					else if (gameStarted.current == true)
						nextHit();
				}
				else { // Determine the step's length towards the target, depending on speed
					const angle = Math.atan2(dy, dx);
					const newX = pos.current.x + Math.cos(angle) * speed.current;
					const newY = pos.current.y + Math.sin(angle) * speed.current;
					drawGame(context);
					pos.current = {x: newX, y: newY};
					lastUpdateTimeRef.current = time;
				}	
			}
			requestAnimationFrame(animate);

		};
		requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animate);
    }, []);

    return (
        <div className={styles.MovingBall}>
            <canvas ref={canvasRef} width={800} height={500} style={{ border: '5px solid white' }}></canvas>
			<h2>{score.left}:{score.right}</h2>
            <p>Speed: {speed.current}</p>
            <div>
                <button onClick={handleSlower}>Slower</button>
                <button onClick={startGame}>Start</button>
                <button onClick={handleFaster}>Faster</button>
            </div>
			<div>
				<button onClick={restartGame}>Restart</button>
			</div>
            <p>Since start: {count} sec</p>
        </div>
    );
}

export default Pong;
