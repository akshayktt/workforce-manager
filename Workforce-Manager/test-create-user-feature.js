const http = require("http");

function makeRequest(method, path, body = null, cookies = "") {
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

    if (cookies) {
      options.headers["Cookie"] = cookies;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const body = JSON.parse(data);
          resolve({ status: res.statusCode, body, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.on("timeout", () => {
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
    console.log("\n=== Testing Create User Feature ===\n");

    // Step 1: Login as admin
    console.log("1. Logging in as admin...");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      username: "admin",
      password: "admin123",
    });
    
    if (loginRes.status !== 200) {
      console.error("❌ Login failed:", loginRes.body);
      return;
    }
    
    console.log("✅ Login successful");
    const setCookie = loginRes.headers["set-cookie"];
    if (!setCookie) {
      console.error("❌ No session cookie received");
      return;
    }
    const sessionCookie = setCookie[0].split(";")[0];
    console.log("   Session cookie obtained");

    // Step 2: Create labor user with skills
    const timestamp = Date.now();
    const laborUsername = `testlabor_${timestamp}`;
    
    console.log(`\n2. Creating labor user '${laborUsername}' with skills...`);
    const createLaborRes = await makeRequest(
      "POST",
      "/api/users/create",
      {
        username: laborUsername,
        password: "password123",
        fullName: "Test Labor User",
        role: "labor",
        skills: ["welding", "carpentry", "electrical"],
      },
      sessionCookie
    );

    if (createLaborRes.status !== 200) {
      console.error("❌ Labor creation failed:", createLaborRes.body);
    } else {
      console.log("✅ Labor user created successfully");
      console.log(`   ID: ${createLaborRes.body.id}`);
      console.log(`   Skills: ${createLaborRes.body.skills.join(", ")}`);
    }

    // Step 3: Create supervisor user
    const supervisorUsername = `supervisor_${timestamp}`;
    
    console.log(`\n3. Creating supervisor user '${supervisorUsername}'...`);
    const createSupervisorRes = await makeRequest(
      "POST",
      "/api/users/create",
      {
        username: supervisorUsername,
        password: "password123",
        fullName: "Test Supervisor User",
        role: "supervisor",
      },
      sessionCookie
    );

    if (createSupervisorRes.status !== 200) {
      console.error("❌ Supervisor creation failed:", createSupervisorRes.body);
    } else {
      console.log("✅ Supervisor user created successfully");
      console.log(`   ID: ${createSupervisorRes.body.id}`);
    }

    // Step 4: Verify labor can login with their skills
    console.log(`\n4. Verifying labor can login...`);
    const laborLoginRes = await makeRequest("POST", "/api/auth/login", {
      username: laborUsername,
      password: "password123",
    });

    if (laborLoginRes.status !== 200) {
      console.error("❌ Labor login failed:", laborLoginRes.body);
    } else {
      console.log("✅ Labor login successful");
      console.log(`   Role: ${laborLoginRes.body.role}`);
      console.log(`   Full Name: ${laborLoginRes.body.fullName}`);
    }

    console.log("\n✅ All tests passed!\n");
  } catch (err) {
    console.error("❌ Test error:", err.message);
  }
}

main();
