import Form from "../components/Form"
import {useNavigate} from "react-router-dom"
import Snowfall from 'react-snowfall'
import logo_42auth from "../assets/42logo.png"

function Register() {
    const navigate = useNavigate();

    const handleGoToLoginButton = () => {
        localStorage.clear();
        navigate("/login")
    }

    const handleLoginWith42 = () => {
        window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-efb8810a6794b0509ab1b30b4baeb56fff909df009eb5c29cde1d675f5309a75&redirect_uri=https%3A%2F%2Flocalhost%3A5173%2Fcheck42user&response_type=code";
    };

    return (
        <div>
            <Snowfall />
            <div className="div-login-page">
                <Snowfall />
                {localStorage.clear()}
                <Form route="/api/user/register/" method="register" />
                <button className="go-to-login-button" onClick={() => handleGoToLoginButton()}>Already have an account ?</button>
                <h2>━━━━━━━━ Or continue with ━━━━━━━━</h2>
                <button className="login-with-42-button" onClick={handleLoginWith42}><img className="logo42" src={logo_42auth} alt="42 Authentication"/></button>
            </div>
        </div>
    );
}

export default Register