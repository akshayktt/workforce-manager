// test-duplicate-fix.js
// Test script to verify duplicate requests are fixed

const http = require("http");

// Configuration
const API_URL = "http://10.0.0.46:5000";
const SUPERVISOR_USERNAME = "supervisor1";
const SUPERVISOR_PASSWORD = "password123";

let sessionCookie = null;
let supervisorId = null;

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
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

    if (sessionCookie) {
      options.headers.Cookie = sessionCookie;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        // Extract and store Set-Cookie
        if (res.headers["set-cookie"]) {
          const cookieHeader = res.headers["set-cookie"][0];
          sessionCookie = cookieHeader.split(";")[0];
        }

        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log("🧪 Testing Duplicate Requests Fix\n");

  try {
    // Step 1: Login as supervisor
    console.log("1️⃣ Logging in as supervisor1...");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      username: SUPERVISOR_USERNAME,
      password: SUPERVISOR_PASSWORD,
    });

    if (loginRes.status !== 200) {
      console.error("❌ Login failed:", loginRes.body);
      process.exit(1);
    }

    supervisorId = loginRes.body.id;
    console.log(`✅ Login successful! User ID: ${supervisorId}`);

    // Step 2: Fetch all requests for this supervisor
    console.log("\n2️⃣ Fetching labor requests for supervisor...");
    const requestsRes = await makeRequest("GET", "/api/labor-requests");

    if (requestsRes.status !== 200) {
      console.error("❌ Failed to fetch requests:", requestsRes.body);
      process.exit(1);
    }

    const requests = requestsRes.body;
    console.log(`✅ Fetched ${requests.length} request(s)`);

    if (requests.length === 0) {
      console.log("⚠️  No requests found for this supervisor");
      process.exit(0);
    }

    // Step 3: Check for duplicates
    console.log("\n3️⃣ Checking for duplicates...");

    const seen = new Set();
    let duplicateCount = 0;

    requests.forEach((request, index) => {
      const key = `${request.projectId}|${request.laborId}|${request.supervisorId}`;
      const isDuplicate = seen.has(key);
      
      console.log(`\n  Request ${index + 1}:`);
      console.log(`    ID: ${request.id}`);
      console.log(`    Project: ${request.projectName}`);
      console.log(`    Labor: ${request.laborName}`);
      console.log(`    Status: ${request.status}`);
      
      if (isDuplicate) {
        console.log(`    🔴 DUPLICATE DETECTED!`);
        duplicateCount++;
      } else {
        console.log(`    ✅ Unique`);
        seen.add(key);
      }
    });

    // Step 4: Results
    console.log("\n" + "=".repeat(50));
    if (duplicateCount === 0) {
      console.log("✅ SUCCESS! No duplicates found!");
      console.log(`   Total requests: ${requests.length}`);
      console.log(`   All requests are unique`);
    } else {
      console.log(`❌ FAILED! Found ${duplicateCount} duplicate(s)`);
      console.log(`   Total requests: ${requests.length}`);
      console.log(`   Unique requests should be: ${requests.length - duplicateCount}`);
    }
    console.log("=".repeat(50));

    process.exit(duplicateCount === 0 ? 0 : 1);
  } catch (error) {
    console.error("❌ Test error:", error.message);
    process.exit(1);
  }
}

runTest();
