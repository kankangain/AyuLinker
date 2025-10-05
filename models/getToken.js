// models/getToken.js
const axios = require("axios");
require("dotenv").config();

const token = { ICD_API_KEY: null };

async function fetchICDToken() {
  try {
    const url = "https://icdaccessmanagement.who.int/connect/token";
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.ClientId);
    params.append("client_secret", process.env.ClientSecret);
    params.append("scope", "icdapi_access");

    const res = await axios.post(url, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    token.ICD_API_KEY = res.data.access_token;
    console.log("✅ Got ICD-11 API Token");
  } catch (err) {
    console.error("❌ Error fetching ICD token:", err.response?.data || err.message);
  }
}

fetchICDToken();
setInterval(fetchICDToken, 50 * 60 * 1000);

async function getToken() {
  while (!token.ICD_API_KEY) {
    console.log("⏳ Waiting for token...");
    await new Promise(r => setTimeout(r, 1000));
  }
  return token.ICD_API_KEY;
}

module.exports = { getToken };
