import Form from "../components/Form"
import Snowfall from 'react-snowfall'

function Register() {

    return (
        <div>
            <Snowfall />
            <div className="div-login-page">
                {localStorage.clear()}
                <Form route="/api/user/register/" method="register" />
            </div>
        </div>
    );
}

export default Register