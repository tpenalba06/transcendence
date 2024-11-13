import React from "react"
import { BrowserRouter, Routes, Route} from "react-router-dom"
import CheckUser from "./pages/CheckUser"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
	return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home/>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login/>}></Route>
        <Route path="/check42user" element={<CheckUser/>}></Route>
        <Route path="/register" element={<Register/>}></Route>
        <Route path="/home" element={<Home/>}></Route>
        {/* <Route path="*" element={<NotFound/>}></Route> */}
      </Routes>
    </BrowserRouter>
	)
}

export default App
