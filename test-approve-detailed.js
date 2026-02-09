const http = require("http");

function makeRequest(method, path, body = null, headers = {}) {
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
      timeout: 5000,
    };

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
    console.log("\n=== Testing Approval Flow (Like the App) ===\n");

    // Step 1: Login as admin
    console.log("1. LOGIN");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      username: "admin",
      password: "admin123",
    });

    if (loginRes.status !== 200) {
      console.error("❌ Login failed:", loginRes.status, loginRes.body);
      return;
    }

    const sessionCookie = loginRes.headers["set-cookie"]?.[0];
    if (!sessionCookie) {
      console.error("❌ No session cookie in response");
      return;
    }

    const cookieValue = sessionCookie.split(";")[0];
    console.log(`✅ Login successful, cookie: ${cookieValue.substring(0, 30)}...`);

    // Step 2: Fetch labor requests
    console.log("\n2. FETCH REQUESTS");
    const requestsRes = await makeRequest(
      "GET",
      "/api/labor-requests",
      null,
      { Cookie: cookieValue }
    );

    if (requestsRes.status !== 200) {
      console.error("❌ Fetch failed:", requestsRes.status, requestsRes.body);
      return;
    }

    const requests = requestsRes.body;
    console.log(`✅ Fetched ${requests.length} requests`);

    const pendingRequests = requests.filter((r) => r.status === "pending");
    if (pendingRequests.length === 0) {
      console.log("⚠️  No pending requests to test");
      return;
    }

    const requestToApprove = pendingRequests[0];
    console.log(`   First pending: ${requestToApprove.id}`);
    console.log(`   Labor: ${requestToApprove.laborName}`);

    // Step 3: Approve
    console.log("\n3. APPROVE REQUEST");
    console.log(`   Sending PATCH to /api/labor-requests/${requestToApprove.id}`);
    console.log(`   With header Cookie: ${cookieValue.substring(0, 30)}...`);

    const approveRes = await makeRequest(
      "PATCH",
      `/api/labor-requests/${requestToApprove.id}`,
      { status: "approved" },
      { Cookie: cookieValue }
    );

    console.log(`   Response: ${approveRes.status}`);
    if (approveRes.status === 200) {
      console.log(`✅ APPROVED - Status is now: ${approveRes.body.status}`);
    } else if (approveRes.status === 401) {
      console.error(`❌ UNAUTHORIZED (401) - Session not working`);
      console.error(`   Response:`, approveRes.body);
    } else if (approveRes.status === 403) {
      console.error(`❌ FORBIDDEN (403) - User is not admin`);
      console.error(`   Response:`, approveRes.body);
    } else {
      console.error(`❌ ERROR ${approveRes.status}`);
      console.error(`   Response:`, approveRes.body);
    }

    // Step 4: Verify status changed
    console.log("\n4. VERIFY REQUEST STATUS");
    const verifyRes = await makeRequest(
      "GET",
      "/api/labor-requests",
      null,
      { Cookie: cookieValue }
    );

    if (verifyRes.status === 200) {
      const updatedRequest = verifyRes.body.find(
        (r) => r.id === requestToApprove.id
      );
      console.log(
        `   Updated status: ${updatedRequest?.status || "NOT FOUND"}`
      );
      if (updatedRequest?.status === "approved") {
        console.log("✅ STATUS VERIFIED");
      } else {
        console.error("❌ STATUS DID NOT CHANGE");
      }
    }
  } catch (err) {
    console.error("❌ Test error:", err.message);
  }
}

main();
