const http = require("http");

function makeRequest(method, path, body = null, cookies = {}) {
  return new Promise((resolve, reject) => {
    const cookieStr = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    const options = {
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (cookieStr) {
      options.headers.Cookie = cookieStr;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
            cookies: res.headers["set-cookie"],
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            cookies: res.headers["set-cookie"],
          });
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

async function test() {
  console.log("=== Testing Admin Approve Endpoint ===\n");

  try {
    // Step 1: Login as admin
    console.log("1. Logging in as admin...");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      username: "admin",
      password: "admin123",
    });
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Response:`, loginRes.body);

    if (loginRes.status !== 200) {
      console.log("Login failed!");
      return;
    }

    // Extract session cookie
    let sessionCookie = null;
    if (loginRes.cookies) {
      const cookieMatch = loginRes.cookies[0].match(/connect\.sid=([^;]+)/);
      if (cookieMatch) {
        sessionCookie = cookieMatch[1];
        console.log(`   Session: ✓ ${sessionCookie.substring(0, 20)}...`);
      }
    }

    if (!sessionCookie) {
      console.log("   ✗ No session cookie found!");
      return;
    }

    // Step 2: Get labor requests
    console.log("\n2. Fetching labor requests...");
    const requestsRes = await makeRequest("GET", "/api/labor-requests", null, {
      "connect.sid": sessionCookie,
    });
    console.log(`   Status: ${requestsRes.status}`);

    if (requestsRes.status !== 200) {
      console.log(`   Response:`, requestsRes.body);
      return;
    }

    const requests = requestsRes.body;
    console.log(`   Found ${requests.length} requests`);

    const pendingRequest = requests.find((r) => r.status === "pending");
    if (!pendingRequest) {
      console.log("   No pending requests found!");
      return;
    }

    console.log(`   First pending: ${pendingRequest.id}`);
    console.log(`   Project: ${pendingRequest.projectName}`);
    console.log(`   Labor: ${pendingRequest.laborName}`);

    // Step 3: Try to approve
    console.log(`\n3. Attempting to approve request ${pendingRequest.id}...`);
    const approveRes = await makeRequest(
      "PATCH",
      `/api/labor-requests/${pendingRequest.id}`,
      { status: "approved" },
      { "connect.sid": sessionCookie }
    );
    console.log(`   Status: ${approveRes.status}`);
    console.log(`   Response:`, approveRes.body);

    if (approveRes.status === 200) {
      console.log("\n✓ SUCCESS! Request approved");
    } else {
      console.log("\n✗ FAILED!");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
