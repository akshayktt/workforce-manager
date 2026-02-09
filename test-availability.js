const http = require("http");

async function makeRequest(method, path, body = null, sessionCookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (sessionCookie) {
      options.headers.Cookie = `connect.sid=${sessionCookie}`;
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
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
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
  console.log("=== Testing Labor Availability Feature ===\n");

  try {
    // Step 1: Login
    console.log("1. Logging in as supervisor1...");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      username: "supervisor1",
      password: "super123",
    });
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Response:`, loginRes.body);

    const sessionCookie = loginRes.headers["set-cookie"]?.[0]?.split(";")[0].split("=")[1];
    console.log(`   Session Cookie: ${sessionCookie ? "✓ Obtained" : "✗ Not found"}\n`);

    if (!sessionCookie) {
      console.log("Failed to obtain session cookie");
      return;
    }

    // Step 2: Get all labor
    console.log("2. Fetching all labor...");
    const laborRes = await makeRequest("GET", "/api/users/labor", null, sessionCookie);
    console.log(`   Status: ${laborRes.status}`);
    console.log(`   Found ${laborRes.body?.length || 0} laborers`);
    
    if (laborRes.body && laborRes.body.length > 0) {
      console.log(`   First laborer:`, {
        id: laborRes.body[0].id,
        fullName: laborRes.body[0].fullName,
        username: laborRes.body[0].username,
        nextAvailableDate: laborRes.body[0].nextAvailableDate,
      });
    }
    console.log();

    // Step 3: Get scheduled ranges for a laborer
    if (laborRes.body && laborRes.body.length > 0) {
      const laborId = laborRes.body[0].id;
      console.log(`3. Fetching scheduled ranges for laborer ${laborId}...`);
      const schedRes = await makeRequest(
        "GET",
        `/api/labor-scheduled/${laborId}`,
        null,
        sessionCookie
      );
      console.log(`   Status: ${schedRes.status}`);
      console.log(`   Response:`, schedRes.body);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
