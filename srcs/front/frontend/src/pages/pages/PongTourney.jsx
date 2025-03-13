import React, {useEffect, useState} from 'react'
import "../styles/PongSelection.css"
import axios from 'axios';
import {v4 as uuidv4} from 'uuid';
import { useNavigate, useLocation } from "react-router-dom"
import { getUser, getMatches } from "../api"
import design_2 from '../assets/img/2.png'; import design_3 from '../assets/img/3.png'; import design_4 from '../assets/img/4.png';
import design_5 from '../assets/img/5.png'; import design_6 from '../assets/img/6.png'; import design_7 from '../assets/img/7.png';
import design_8 from '../assets/img/8.png';
import icone_1 from '../assets/img/dravaono.jpg'; import icone_2 from '../assets/img/edfirmin.jpg'; import icone_3 from '../assets/img/fpalumbo.jpg';
import icone_4 from '../assets/img/jfazi.jpg'; import icone_5 from '../assets/img/ndesprez.jpg'; import icone_6 from '../assets/img/tpenalba.jpg';
import icone_7 from '../assets/img/hdupire.jpg'; import icone_8 from '../assets/img/ychirouz.jpg';
import { ACCESS_TOKEN } from "../constants";
import Navbarr from '../components/Navbar';

function Tourney() {
    const point_design = [design_2, design_3, design_4, design_5, design_6, design_7, design_8];
	  const userToken = localStorage.getItem(ACCESS_TOKEN);
    const [players, set_players] = useState(0);
    const [user, setUser] = useState()
    const [name1, set_name1] = useState()
    const [user_icone, set_user_icone] = useState()
    const [name2, set_name2] = useState("Player2")
    const [name3, set_name3] = useState("Player3")
    const [name4, set_name4] = useState("Player4")
    const [name5, set_name5] = useState("Player5")
    const [name6, set_name6] = useState("Player6")
    const [name7, set_name7] = useState("Player7")
    const [name8, set_name8] = useState("Player8")
    const navigate = useNavigate();
    
    const data = useLocation();
    const isAI = data.state == null ? false : data.state.isAI;
    const difficulty = data.state == null ? "easy" : data.state.difficulty;
    const map_index = data.state.map;
    const design_index = data.state.design;
    const p = data.state.points;

    useEffect(() => {
      inituser()
    }, []);

    useEffect(() => {
      if (user) {
        set_name1(user.username);
        set_user_icone(user.profil_pic);
      }
    }, [user]);

    const inituser = async () => {
        const TMPuser = await getUser()
        setUser(TMPuser);
    }

    async function handleLocalPong() {
      const tourney_id = uuidv4();
		  await axios.post('api/user/addTourneyStats/', {userToken, name1, name2, name3, name4, name5, name6, name7, name8, tourney_id})

      navigate(`/tourney/tourneyPresentation/`, {state : { isAI : isAI, map : map_index, design : design_index, points : p, players : players, tourney_id : tourney_id}});
    }

    if (!user) {
      return(<></>);
    }

    return (
        <>
            <Navbarr></Navbarr>
            <div className='container'>
                <div></div>
                <Selector name={"Nombre de joueurs"} designs={point_design} index={players} setIndex={set_players} />
                <div></div>
            </div>
            <div className='container'>
              <div></div>
            <div className='grid'>
                <PlayerUser name={name1} image={user_icone} position={0} points={players} />
                <Player name={name2} set_name={set_name2} image={icone_1} position={0} points={players} />
                <Player name={name3} set_name={set_name3} image={icone_2} position={1} points={players} />
                <Player name={name4} set_name={set_name4} image={icone_3} position={2} points={players} />
                <Player name={name5} set_name={set_name5} image={icone_4} position={3} points={players} />
                <Player name={name6} set_name={set_name6} image={icone_5} position={4} points={players} />
                <Player name={name7} set_name={set_name7} image={icone_6} position={5} points={players} />
                <Player name={name8} set_name={set_name8} image={icone_7} position={6} points={players} />
            </div>
              <div></div>
            </div>
            <div className='container'>
              <div></div>
              <Button name={'Play'} callback={handleLocalPong} />
              <div></div>
            </div>
        </>
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

function Player({name, set_name, image, position, points}) {


    if (position <= points)  
    {
      return (
            <div className='player'>
                <img src={image} />
                <input type="text" required minLength="1" maxLength="10" size="10"  value={name} onChange={e => set_name(e.target.value)} />
            </div>
        )
    }
    else {
      return (<></>)
    }

}

function PlayerUser({name, image, position, points}) {
  if (position <= points)  
  {
    return (
          <div className='player'>
              <img src={image} />
              <p>{name}</p>
          </div>
      )
  }
  else {
    return (<></>)
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

export default Tourney;