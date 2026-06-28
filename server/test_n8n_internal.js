require("dotenv").config({ path: "../.env" });
const axios = require("axios");

const url = "http://localhost:5678/rest/workflows/VcUrkhErV1yVtszT";
const auth = {
  username: "admin",
  password: "admin123",
};

async function main() {
  try {
    console.log("Fetching internal workflow...");
    const res = await axios.get(url, { auth });
    console.log("Status:", res.status);
    console.log("Response headers:", res.headers);
    console.log("Response body:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error status:", err.response?.status);
    console.error("Error body:", JSON.stringify(err.response?.data, null, 2));
    console.error("Error message:", err.message);
  }
}

main();
