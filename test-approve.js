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
    console.log("\n=== Testing Approve Functionality ===\n");

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
    
    console.log("✅ Admin login successful");
    const setCookie = loginRes.headers["set-cookie"];
    const sessionCookie = setCookie[0].split(";")[0];

    // Step 2: Get labor requests
    console.log("\n2. Fetching labor requests...");
    const requestsRes = await makeRequest(
      "GET",
      "/api/labor-requests",
      null,
      sessionCookie
    );

    if (requestsRes.status !== 200) {
      console.error("❌ Failed to fetch requests:", requestsRes.body);
      return;
    }

    const requests = requestsRes.body;
    console.log(`✅ Fetched ${requests.length} requests`);
    
    const pendingRequest = requests.find(r => r.status === "pending");
    if (!pendingRequest) {
      console.log("⚠️  No pending requests to approve. Creating one first...");
      
      // Create a pending request
      console.log("\n   Creating new labor request...");
      
      // Get supervisor (create one first)
      const supervisors = await makeRequest("GET", "/api/users/supervisors", null, sessionCookie);
      let supervisorId = supervisors.body[0]?.id;
      
      if (!supervisorId) {
        console.log("   Creating supervisor...");
        const ts = Date.now();
        const supRes = await makeRequest("POST", "/api/users/create", {
          username: `sup_${ts}`,
          password: "pass123",
          fullName: "Test Supervisor",
          role: "supervisor"
        }, sessionCookie);
        supervisorId = supRes.body.id;
      }

      // Get labor
      const labor = await makeRequest("GET", "/api/users/labor", null, sessionCookie);
      let laborId = labor.body[0]?.id;
      
      if (!laborId) {
        console.log("   Creating labor...");
        const ts = Date.now();
        const labRes = await makeRequest("POST", "/api/users/create", {
          username: `lab_${ts}`,
          password: "pass123",
          fullName: "Test Labor",
          role: "labor",
          skills: ["welding"]
        }, sessionCookie);
        laborId = labRes.body.id;
      }

      // Get project or create one
      const projectsRes = await makeRequest("GET", "/api/projects", null, sessionCookie);
      let projectId = projectsRes.body[0]?.id;

      if (!projectId) {
        console.log("   Creating project (need supervisor to do this)...");
        // Login as supervisor
        const supLoginRes = await makeRequest("POST", "/api/auth/login", {
          username: "supervisor1",
          password: "password123"
        });
        
        if (supLoginRes.status === 200) {
          const supCookie = supLoginRes.headers["set-cookie"][0].split(";")[0];
          const projRes = await makeRequest("POST", "/api/projects", {
            name: "Test Project",
            description: "Test"
          }, supCookie);
          projectId = projRes.body.id;
        }
      }

      if (projectId && laborId && supervisorId) {
        console.log("   Creating labor request...");
        const start = new Date();
        const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const reqRes = await makeRequest("POST", "/api/labor-requests", {
          projectId,
          laborId,
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }, sessionCookie);
        
        if (reqRes.status === 200) {
          console.log("   ✅ Labor request created");
        } else {
          console.error("   ❌ Failed to create request:", reqRes.body);
        }
      }
      
      return;
    }

    console.log(`\n3. Testing approve on request: ${pendingRequest.id}`);
    console.log(`   Labor: ${pendingRequest.laborName}`);
    console.log(`   Project: ${pendingRequest.projectName}`);

    // Step 3: Approve the request
    console.log("\n4. Sending PATCH /api/labor-requests/:id with status='approved'...");
    const approveRes = await makeRequest(
      "PATCH",
      `/api/labor-requests/${pendingRequest.id}`,
      { status: "approved" },
      sessionCookie
    );

    console.log(`   Response status: ${approveRes.status}`);
    console.log(`   Response body:`, approveRes.body);

    if (approveRes.status === 200) {
      console.log("✅ Approve successful!");
    } else {
      console.error("❌ Approve failed!");
    }

  } catch (err) {
    console.error("❌ Test error:", err.message);
  }
}

main();
