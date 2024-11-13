import Form from "../components/Form"
import {useNavigate} from "react-router-dom"

function Register() {

    const navigate = useNavigate();

    const handleGoToLoginButton = () => {
        localStorage.clear();
        navigate("/login")
    }

    return (
        <div>
            {localStorage.clear()}
            <button className="go-to-login-button" onClick={() => handleGoToLoginButton()}>Login</button>
            <Form route="/api/user/register/" method="register" />
        </div>
    );
}

export default Register