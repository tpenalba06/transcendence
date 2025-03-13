import React, {useEffect, useState} from 'react'
import "../styles/PongSelection.css"
import {useNavigate, useLocation} from "react-router-dom"
import {v4 as uuidv4} from 'uuid';
import classic_design from '../assets/img/classic_design.png'
import tennis_design from '../assets/img/tennis_design.png'
import classic_map_design from '../assets/img/classic_map_design.png'
import tennis_map_design from '../assets/img/tennis_map_design.png'
import table_tennis_map_design from '../assets/img/table_tennis_map_design.png'
import design_2 from '../assets/img/2.png'; import design_3 from '../assets/img/3.png'; import design_4 from '../assets/img/4.png';
import design_5 from '../assets/img/5.png'; import design_6 from '../assets/img/6.png'; import design_7 from '../assets/img/7.png';
import design_8 from '../assets/img/8.png'; import design_9 from '../assets/img/9.png'; 

function PongSelection() {

    const [difficulty, set_difficulty] = useState("medium");
    const paddle_designs = [classic_design, tennis_design];
    const map_designs = [classic_map_design, tennis_map_design, table_tennis_map_design];
    const point_design = [design_2, design_3, design_4, design_5, design_6, design_7, design_8, design_9];
    const [index_design, set_index_design] = useState(0), [index_map_design, set_index_map_design] = useState(0);
    const [points, set_points] = useState(0);

    const navigate = useNavigate();

    function handleLocalPong() {
      const roomId = uuidv4();
      navigate(`/pong/${roomId}`, {state : { isAI : false, map : index_map_design, design : index_design, points : points}});
    }

    function handleAIPong() {
      const roomId = uuidv4();
      navigate(`/pong/${roomId}`, {state : { isAI : true, difficulty : "easy", map : index_map_design, design : index_design, points : points}});
    }

    function handleRemotePong() {
      const roomId = uuidv4();
      navigate(`/multipong/${roomId}`,  {state : {map : index_map_design, design : index_design, points : points}});
    }

    function handleTourneyPong() {
      navigate(`/tourney/`,  {state : {map : index_map_design, design : index_design, points : points}});
    }

    return (
        <>
            <div className='container'>
              <div></div>
              <Selector name={"Map"} designs={map_designs} index={index_map_design} setIndex={set_index_map_design} />
              <Selector name={"Points"} designs={point_design} index={points} setIndex={set_points} />
              <Selector name={'Design'} designs={paddle_designs} index={index_design} setIndex={set_index_design} />
              <div></div>
            </div>
            <div className='container'>
              <div></div>
              <Button name={'Local'} callback={handleLocalPong} />
              <Button name={'AI'} callback={handleAIPong} />
              <Button name={'Remote'} callback={handleRemotePong} />
              <Button name={'Tourney'} callback={handleTourneyPong} />
              <div></div>
            </div>
           {/* <button className='button' onClick={() => setDifficulty("easy")}>Easy</button>
            <button className='button' onClick={() => setDifficulty("medium")}>Medium</button>
            <button className='button' onClick={() => setDifficulty("hard")}>Hard</button>*/}
        </>
    );
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

function Selector({name, designs, index, setIndex}) {
  const [imgDesign, setImgDesign] = useState(designs[0]);
  
  function handleOnClickLeftArrow()
  {
    setIndex(index + 1);
    index++;
    if (index >= designs.length) {
      setIndex(0);
      index = 0;
    }

    setImgDesign(designs[index]);
  }

  function handleOnClickRightArrow()
  {
    setIndex(index - 1);
    index--;
    if (index < 0) {
      setIndex(designs.length - 1);
      index = designs.length - 1;
    }

    setImgDesign(designs[index]);
  }

	return (
    <div className='selector'>
      <p>{name}</p>
      <div>
        <button className='arrowButton' onClick={handleOnClickRightArrow} id='leftArrow'>&lt;</button>
        <img src={imgDesign}/>
        <button className='arrowButton' onClick={handleOnClickLeftArrow} id='rightArrow'>&gt;</button>
      </div>
    </div>
  )
}

export default PongSelection;
