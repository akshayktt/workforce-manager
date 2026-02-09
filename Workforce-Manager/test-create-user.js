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

    req.on("error", (e) => {
      console.error("Request error:", e.message, e.code);
      reject(e);
    });
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log("=== Testing Create User Endpoint ===\n");

  try {
    // Step 1: Login as admin
    console.log("1. Logging in as admin...");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      username: "admin",
      password: "admin123",
    });
    console.log(`   Status: ${loginRes.status}`);

    if (loginRes.status !== 200) {
      console.log("   ✗ Login failed!");
      return;
    }

    console.log("   ✓ Login successful");

    // Extract session cookie
    let sessionCookie = null;
    if (loginRes.cookies) {
      const cookieMatch = loginRes.cookies[0].match(/connect\.sid=([^;]+)/);
      if (cookieMatch) {
        sessionCookie = cookieMatch[1];
        console.log(`   ✓ Session: ${sessionCookie.substring(0, 20)}...\n`);
      }
    }

    if (!sessionCookie) {
      console.log("   ✗ No session cookie found!");
      return;
    }

    // Step 2: Create a labor user
    console.log("2. Creating a new labor user...");
    const createRes = await makeRequest(
      "POST",
      "/api/users/create",
      {
        username: "testlabor1",
        password: "password123",
        fullName: "Test Labor",
        role: "labor",
        skills: ["Carpentry", "Painting"],
      },
      { "connect.sid": sessionCookie }
    );

    console.log(`   Status: ${createRes.status}`);
    console.log(`   Response:`, createRes.body);

    if (createRes.status === 200) {
      console.log("\n✓ Labor created successfully!");
    } else {
      console.log("\n✗ Failed to create labor");
    }

    // Step 3: Create a supervisor user
    console.log("\n3. Creating a new supervisor user...");
    const createSupRes = await makeRequest(
      "POST",
      "/api/users/create",
      {
        username: "testsupervisor1",
        password: "password123",
        fullName: "Test Supervisor",
        role: "supervisor",
      },
      { "connect.sid": sessionCookie }
    );

    console.log(`   Status: ${createSupRes.status}`);
    console.log(`   Response:`, createSupRes.body);

    if (createSupRes.status === 200) {
      console.log("\n✓ Supervisor created successfully!");
    } else {
      console.log("\n✗ Failed to create supervisor");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
