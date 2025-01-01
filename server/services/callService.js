const axios = require('axios');
const { CORS_PROXY } = require('../config/constants');
require('dotenv').config();

class callService {
    async makeApiCall(url) {
        const proxyUrl = CORS_PROXY + url;
        console.log(`[API Call] Requesting: ${url}`);

        try {
            const response = await axios.get(proxyUrl, {
                headers: {
                    'X-API-KEY': process.env.DEX_API_KEY,
                    'Accept': 'application/json',
                    // 'Origin': 'http://localhost:3000'
                }
            });

            console.log(`[API Call] Response Status: ${response.status}`);

            if (response.status !== 200) {
                throw new Error(`[HTTP Error] Status: ${response.status}`);
            }

            const data = response.data;
            console.log(`[API Call] Raw Response: ${JSON.stringify(data).substring(0, 200)}...`);
            return data;
        } catch (error) {
            console.error(`[API Call Error] ${error.message}`);
            throw error;
        }
    }
}

module.exports = new callService();