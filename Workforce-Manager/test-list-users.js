// test-list-users.js
// Simple test to list all users

const http = require("http");

const API_URL = "http://10.0.0.46:5000";

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function runTest() {
  console.log("📋 Listing all supervisors...\n");

  try {
    const supervisorsRes = await makeRequest("GET", "/api/users/supervisors");

    if (supervisorsRes.status !== 200) {
      console.error("❌ Failed:", supervisorsRes.body);
      process.exit(1);
    }

    const supervisors = supervisorsRes.body;
    console.log(`Found ${supervisors.length} supervisor(s):\n`);

    supervisors.forEach((supervisor, index) => {
      console.log(`${index + 1}. ${supervisor.fullName} (@${supervisor.username})`);
      console.log(`   ID: ${supervisor.id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

runTest();
