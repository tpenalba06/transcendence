import Form from "../components/Form"
import {useNavigate} from "react-router-dom"

function Register() {

    const navigate = useNavigate();

    const handleGoToLoginButton = () => {
        localStorage.clear();
        navigate("/login")
    }

    return (
        <div style={{padding:'8%'}}>
            {localStorage.clear()}
            <Form route="/api/user/register/" method="register" />
            <button className="go-to-login-button" onClick={() => handleGoToLoginButton()}>Login</button>
        </div>
    );
}

export default Register