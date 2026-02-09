#!/usr/bin/env node

async function test() {
  console.log("Testing labor availability feature...\n");

  try {
    // Test 1: Login
    console.log("1. Testing login...");
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "supervisor1", password: "super123" }),
      credentials: "include",
    });

    if (!loginRes.ok) {
      console.log(`   ✗ Login failed: ${loginRes.status}`);
      const text = await loginRes.text();
      console.log(`   Response: ${text}`);
      return;
    }

    console.log("   ✓ Login successful");
    const loginData = await loginRes.json();
    console.log(`   User: ${loginData.username} (${loginData.role})\n`);

    // Extract session cookie
    const cookies = loginRes.headers.get("set-cookie");
    const sessionCookie = cookies?.split("=")[1]?.split(";")[0];
    console.log(`   Session: ${sessionCookie ? "✓" : "✗"}\n`);

    if (!sessionCookie) {
      console.log("No session cookie found");
      return;
    }

    // Test 2: Get labor list
    console.log("2. Fetching labor list...");
    const laborRes = await fetch("http://localhost:5000/api/users/labor", {
      credentials: "include",
      headers: { Cookie: `connect.sid=${sessionCookie}` },
    });

    if (!laborRes.ok) {
      console.log(`   ✗ Failed: ${laborRes.status}`);
      return;
    }

    const laborers = await laborRes.json();
    console.log(`   ✓ Found ${laborers.length} laborers`);

    if (laborers.length > 0) {
      const l = laborers[0];
      console.log(`\n   Sample laborer:`);
      console.log(`   - Name: ${l.fullName}`);
      console.log(`   - Username: ${l.username}`);
      console.log(`   - Skills: ${(l.skills || []).join(", ") || "None"}`);
      console.log(
        `   - Next Available: ${l.nextAvailableDate ? l.nextAvailableDate : "(Always available)"}`
      );

      // Test 3: Get scheduled ranges for this laborer
      console.log(`\n3. Fetching scheduled ranges for ${l.fullName}...`);
      const schedRes = await fetch(`http://localhost:5000/api/labor-scheduled/${l.id}`, {
        credentials: "include",
        headers: { Cookie: `connect.sid=${sessionCookie}` },
      });

      if (!schedRes.ok) {
        console.log(`   ✗ Failed: ${schedRes.status}`);
        const text = await schedRes.text();
        console.log(`   Response: ${text.substring(0, 100)}`);
      } else {
        const { scheduledRanges } = await schedRes.json();
        console.log(`   ✓ Found ${scheduledRanges.length} scheduled ranges`);
        scheduledRanges.forEach((range, i) => {
          console.log(
            `   - Range ${i + 1}: ${new Date(range.startDate).toLocaleDateString()} to ${new Date(range.endDate).toLocaleDateString()}`
          );
        });
      }
    }

    console.log("\n✓ Test complete!");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
