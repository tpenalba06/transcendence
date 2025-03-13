import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function RedirectHome() {
  const location = useLocation(); // Moved outside useEffect
  const navigate = useNavigate(); // Moved outside useEffect

  useEffect(() => {
    console.log(location.pathname);

    if (location.pathname === "/") {
      navigate("/home");
    }
  }, [location, navigate]); // Adding location and navigate as dependencies

  return <></>;
}

export default RedirectHome;