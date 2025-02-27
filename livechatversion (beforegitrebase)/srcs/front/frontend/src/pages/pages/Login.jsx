import Form from "../components/Form" 
import {useNavigate} from "react-router-dom"
import Snowfall from 'react-snowfall'

function Login() {
    const navigate = useNavigate();

    const handleGoToRegisterButton = () => {
        localStorage.clear();
        navigate("/register")
    }

    return (
        <div>
            <Snowfall />
            <div className="div-login-page">
                <Snowfall />
                {localStorage.clear()}
                <Form route="/api/user/token/" method="login"/>
                <button className="go-to-register-button" onClick={() => handleGoToRegisterButton()}>Create an account</button>
            </div>
        </div>
    );
}

export default Login