import axios from "axios"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

axios.defaults.baseURL = import.meta.env.VITE_API_URL

export const getUser = async () => {
    const spl = localStorage.getItem(REFRESH_TOKEN).split('.')
    const sec_id = spl[2]
    console.log("ouaiiiiiiiiiii l'id 2: " + sec_id)
    const response = await axios.get("/api/user/getUser/?" + `${sec_id}`)
    return (response.data)
}
