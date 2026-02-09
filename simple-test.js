const http = require("http");

function makeRequest(path, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 5000,
    };

    console.log(`Making ${method} request to ${path}...`);

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response headers:`, res.headers);
        console.log(`Response body:`, data);
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on("error", (e) => {
      console.error(`Request error (code ${e.code}):`, e.message);
      reject(e);
    });

    req.on("timeout", () => {
      console.error("Request timeout");
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  try {
    console.log("\n=== Testing Server ===\n");
    
    // Test 1: GET /
    console.log("TEST 1: GET /");
    await makeRequest("/");
    
    console.log("\n---\n");
    
    // Test 2: GET /api/
    console.log("TEST 2: GET /api/");
    await makeRequest("/api/");
    
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

main();
