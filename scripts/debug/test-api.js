const http = require("http");

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null,
        });
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  try {
    console.log("=== Testing Create User API ===\n");

    // First, login as admin to get session
    console.log("1. Logging in as admin...");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      username: "admin",
      password: "admin123",
    });
    console.log("   Status:", loginRes.status);
    console.log("   Response:", loginRes.body);

    if (loginRes.status !== 200) {
      console.log("   ERROR: Login failed!");
      return;
    }

    // Extract session cookie
    const setCookie = loginRes.headers["set-cookie"];
    console.log("   Session Cookie:", setCookie ? "✓" : "✗");

    const cookieHeader = setCookie ? setCookie[0] : "";
    const timestamp = Date.now();

    // Now try to create a labor user
    console.log("\n2. Creating a labor user with skills...");
    const createRes = await makeRequest(
      "POST",
      "/api/users/create",
      {
        username: `laborer_${timestamp}`,
        password: "password123",
        fullName: "John Laborer",
        role: "labor",
        skills: ["welding", "carpentry"],
      },
      {
        cookie: cookieHeader,
      }
    );
    console.log("   Status:", createRes.status);
    console.log("   Response:", createRes.body);

    if (createRes.status === 201 || createRes.status === 200) {
      console.log("   ✓ Labor user created successfully!");
    } else {
      console.log("   ✗ Failed to create labor user");
    }

    // Try to create a supervisor user
    console.log("\n3. Creating a supervisor user...");
    const supervisorRes = await makeRequest(
      "POST",
      "/api/users/create",
      {
        username: `supervisor_${timestamp}`,
        password: "password123",
        fullName: "Jane Supervisor",
        role: "supervisor",
      },
      {
        cookie: cookieHeader,
      }
    );
    console.log("   Status:", supervisorRes.status);
    console.log("   Response:", supervisorRes.body);

    if (supervisorRes.status === 201 || supervisorRes.status === 200) {
      console.log("   ✓ Supervisor user created successfully!");
    } else {
      console.log("   ✗ Failed to create supervisor user");
    }

    console.log("\n=== Test Complete ===");
  } catch (error) {
    console.error("Test error:", error.message);
  }
}

test();
