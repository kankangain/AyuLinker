const axios = require("axios");

// Base WHO Search API URL
const bioMedURL = "https://id.who.int/icd/release/11/2025-01/mms/search";

async function trySearch(queries, headers) {
  for (const q of queries) {
    const searchUrl = `${bioMedURL}?q=${encodeURIComponent(q)}`;
    // console.log("🔎 WHO Search URL:", searchUrl);
    try {
      const res = await axios.get(searchUrl, { headers });
      if (res.data.destinationEntities?.length > 0) {
        return res.data.destinationEntities[0]; // return first match
      }
    } catch (err) {
      console.error("WHO search error:", err.response?.data || err.message);
    }
  }
  return null;
}

module.exports = trySearch;