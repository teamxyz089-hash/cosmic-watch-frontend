import axios from 'axios';

const API_BASE = 'https://cosmic-watch-backend-4bsv.onrender.com/api';

const getAsteroids = async () => {
    const response = await axios.get(`${API_BASE}/data`);
    return response.data.asteroids;
};

const fetchFreshData = async () => {
    const response = await axios.get(`${API_BASE}/fetch`);
    return response.data;
};

const getAlerts = async () => {
    const response = await axios.get(`${API_BASE}/alerts`);
    return response.data.items;
};

const getWishlist = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return [];

    const response = await axios.get(`${API_BASE}/wishlist`, {
        headers: { Authorization: `Bearer ${user.token}` }
    });
    return response.data.wishlist;
};

const addToWishlist = async (asteroid) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const response = await axios.post(`${API_BASE}/wishlist`, { asteroid }, {
        headers: { Authorization: `Bearer ${user.token}` }
    });
    return response.data;
};

const removeFromWishlist = async (nameOrId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const response = await axios.delete(`${API_BASE}/wishlist/${nameOrId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
    });
    return response.data;
};

const asteroidService = {
    getAsteroids,
    fetchFreshData,
    getAlerts,
    getWishlist,
    addToWishlist,
    removeFromWishlist
};

export default asteroidService;
