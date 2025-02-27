import "../styles/NotFound.css"
import { useNavigate } from "react-router-dom";
import ligth from "../assets/cropped.svg"

function NotFound() {

    const navigate = useNavigate()
    const handleButton = () => {
            navigate("/rounohome")
    }

    return (
        <section className="bg-notfound">
            <div className="content-notfound">
                <h1>404 Not Found</h1>
                <h1>Are you lost ?</h1>
                <h1>Are you lost ?</h1>
            </div>
            <img className="ligth" src={ligth} />
            <button className="ligth-button" onClick={handleButton}></button>
        </section>
    )
}

export default NotFound