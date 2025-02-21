import axios from "axios"
import { ACCESS_TOKEN } from "./constants";
axios.defaults.baseURL = import.meta.env.VITE_API_URL


export const getUser = async () => {
    const userToken = localStorage.getItem(ACCESS_TOKEN);
    const response = await axios.get("/api/user/getUser/?" + userToken);
    return (response.data)
}

export const getQR = async () => {
    const userToken = localStorage.getItem(ACCESS_TOKEN);
    const oui = await axios.get("/api/user/qrcode/?" + userToken);
    return (oui.data.qrcode)
}
