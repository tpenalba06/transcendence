import React, {Component} from "react";
import { useState, useEffect } from "react";
import { getUser } from "../api"
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import '../styles/Navbar.css';
import Snowfall from 'react-snowfall'
import logo from "../assets/logo.png"

function Navbarr() {
    const [user_pp, setUser] = useState([])

    const inituser = async () => {
        const TMPuser = await getUser()
        setUser(TMPuser.profil_pic);
    }

    useEffect(() => {
        inituser()
    }, []);
  return (
    <Navbar bg="myBG" variant="dark" className="navi">
      <Snowfall snowflakeCount={30} radius={[0.5,0.5]}/>
        <Navbar.Brand href="/home"><img className="logo" src={logo}/></Navbar.Brand>
          <Nav.Link href="/profil"><img className="pp_nav" src={user_pp}/></Nav.Link>
          <Nav className="language">
            <NavDropdown title="Language">
              <NavDropdown.Item className="language-item" href="">FR</NavDropdown.Item>
              <NavDropdown.Item className="language-item" href="">EN</NavDropdown.Item>
              <NavDropdown.Item className="language-item" href="">JP</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item className="language-item" href="/profil">Set def. language</NavDropdown.Item>
            </NavDropdown>
          </Nav>
    </Navbar>
  );
}

export default Navbarr;