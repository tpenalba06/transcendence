import React, {useMemo} from 'react';
import { BrowserRouter, Routes, Route} from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import Profil from "./pages/Profil"
import Pong from "./pages/Pong/Pong"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"
import RedirectHome from './pages/RedirectHome';
import CheckUser from './pages/CheckUser';


function App() {
	var ws = useMemo(() => {return new WebSocket("ws://localhost:8000/ws/global")}, [ws]);
	return (
    <BrowserRouter>
      <Routes>
	  <Route path="/" element={<ProtectedRoute> <RedirectHome/> </ProtectedRoute>}/>
	  <Route path="/home" element={<ProtectedRoute> <Home/> </ProtectedRoute>}/>
        <Route path="/check42user" element={<CheckUser/>}></Route>
        <Route path="/login" element={<Login/>}></Route>
        <Route path="/profil" element={<ProtectedRoute> <Profil/> </ProtectedRoute>}/>
        <Route path="/register" element={<Register/>}></Route>
        {/* <Route path="*" element={<NotFound/>}></Route> */}
        <Route path="/pong" element={<ProtectedRoute> <Pong/> </ProtectedRoute>}/>
      </Routes>
    </BrowserRouter>
	)
}

export default App
