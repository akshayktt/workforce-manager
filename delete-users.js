/**
 * Script to delete specific users from the database
 * Execute with: node delete-users.js
 */

require("dotenv").config();
const pg = require("pg");

const userIdsToDelete = [
  "0479de7e-1a5a-4566-a006-991ec72a393a",
  "2b6d1501-3229-42e1-bfad-970a044f80f4",
  "b85b43b1-615b-4aec-9b7e-e61f7453abd7",
  "ba675f06-7f30-48e0-8637-eb0f90bda51a",
  "e5ce00a7-14a9-4f7b-89fe-491a8229cef9",
  "ee76b2cc-152d-492e-af89-99bff0051663",
];

async function deleteUsers() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();

    console.log("🗑️  Starting user deletion...\n");
    console.log("Users to delete:");
    userIdsToDelete.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    console.log("");

    // First delete related labor requests to respect foreign key constraints
    console.log("Step 1: Deleting related labor requests...");
    const idList = userIdsToDelete.map(id => `'${id}'`).join(", ");
    const deleteRequestsQuery = `
      DELETE FROM "labor_requests" 
      WHERE "labor_id" IN (${idList})
         OR "supervisor_id" IN (${idList})
    `;
    
    const deleteResult = await client.query(deleteRequestsQuery);
    console.log(`✅ Deleted ${deleteResult.rowCount} labor request(s)\n`);

    // Then delete the projects created by these supervisors
    console.log("Step 2: Deleting related projects...");
    const deleteProjectsQuery = `
      DELETE FROM "projects" 
      WHERE "supervisor_id" IN (${idList})
    `;
    
    const projectResult = await client.query(deleteProjectsQuery);
    console.log(`✅ Deleted ${projectResult.rowCount} project(s)\n`);

    // Finally, delete the users
    console.log("Step 3: Deleting users...");
    const query = `DELETE FROM "users" WHERE "id" IN (${idList})`;

    console.log("Executing delete query...\n");

    const result = await client.query(query);

    console.log(`✅ Successfully deleted ${result.rowCount} user(s)!\n`);

    if (result.rowCount === 0) {
      console.log("⚠️  No users were deleted. Check if IDs are correct.");
    } else {
      console.log(`Deleted user count: ${result.rowCount}`);
      console.log("Expected count: 6");
      if (result.rowCount === 6) {
        console.log("✅ All users deleted successfully!");
      }
    }

    client.release();
  } catch (error) {
    console.error("❌ Error deleting users:", error.message);
    if (error.detail) {
      console.error("Details:", error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
    console.log("\n✅ Connection closed");
  }
}

deleteUsers();
