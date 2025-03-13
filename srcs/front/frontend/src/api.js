import axios from "axios"
import { ACCESS_TOKEN } from "./constants";
axios.defaults.baseURL = import.meta.env.VITE_API_URL


export const getUser = async (username = null) => {
    try {
        const userToken = localStorage.getItem(ACCESS_TOKEN);
        const url = username 
            ? `/api/user/getUser/?username=${username}&token=${userToken}`
            : `/api/user/getUser/?token=${userToken}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
}

export const getTourney = async (tourney_id) => {
    const response = await axios.get("/api/user/getTourney/?" + tourney_id);
    return (response.data)
}

export const getMatches = async () => {
    const userToken = localStorage.getItem(ACCESS_TOKEN);
    const url = `/api/user/getMatches/?token=${userToken}`;
    const response = await axios.get(url);
    return (response.data)
}

export const getQR = async () => {
    const userToken = localStorage.getItem(ACCESS_TOKEN);
    const oui = await axios.get("/api/user/qrcode/?token=" + userToken);
    return (oui.data)
}

export const getFriends = async () => {
    try {
        const userToken = localStorage.getItem(ACCESS_TOKEN);
        const response = await axios.get(`/api/user/friends/?token=${userToken}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching friends:', error);
        throw error;
    }
}

export const addFriend = async (username) => {
    try {
        const userToken = localStorage.getItem(ACCESS_TOKEN);
        const response = await axios({
            method: 'post',
            url: `/api/user/friends/?token=${userToken}`,
            data: { username },
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error adding friend:', error);
        throw error;
    }
}

export const removeFriend = async (username) => {
    try {
        const userToken = localStorage.getItem(ACCESS_TOKEN);
        const response = await axios.delete(`/api/user/friends/${username}/?token=${userToken}`);
        return response.data;
    } catch (error) {
        console.error('Error removing friend:', error);
        throw error;
    }
}

// export const changeUser = async () => {
//     const userToken = localStorage.getItem(ACCESS_TOKEN);
//     await axios.post("api/user/edit/?" + userToken)
// }
