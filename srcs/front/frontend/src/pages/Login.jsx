import Form from "../components/Form" 
import Snowfall from 'react-snowfall'

function Login() {

    return (
        <div>
            <Snowfall />
            <div className="div-login-page">
                {localStorage.clear()}
                <Form route="/api/user/token/" method="login"/>
            </div>
        </div>
    );
}

export default Login