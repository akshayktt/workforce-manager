/**
 * Test script to verify project isolation per supervisor
 * Run with: node test-project-isolation.js
 */

require("dotenv").config();
const pg = require("pg");

async function testProjectIsolation() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    
    console.log("🔍 Testing Project Isolation\n");

    // 1. Get all supervisors
    const supervisorsResult = await client.query(`
      SELECT id, username, full_name FROM "users" WHERE role = 'supervisor'
    `);
    
    const supervisors = supervisorsResult.rows;
    console.log(`Found ${supervisors.length} supervisors:\n`);

    // 2. For each supervisor, check which projects they own
    for (const supervisor of supervisors) {
      const projectsResult = await client.query(`
        SELECT id, name, supervisor_id FROM "projects" WHERE supervisor_id = $1
      `, [supervisor.id]);
      
      console.log(`${supervisor.full_name} (@${supervisor.username}):`);
      console.log(`  - Supervisor ID: ${supervisor.id}`);
      console.log(`  - Projects owned: ${projectsResult.rows.length}`);
      
      if (projectsResult.rows.length > 0) {
        projectsResult.rows.forEach(p => {
          console.log(`    • ${p.name} (ID: ${p.id})`);
        });
      } else {
        console.log(`    (no projects)`);
      }
      console.log("");
    }

    // 3. Check if any projects belong to multiple supervisors (should be 0)
    const duplicateProjectsResult = await client.query(`
      SELECT supervisor_id, COUNT(*) as count FROM "projects" 
      GROUP BY supervisor_id
      HAVING COUNT(*) > 0
    `);
    
    console.log("✅ Project Distribution:");
    console.log(`Total projects: ${duplicateProjectsResult.rows.reduce((acc, r) => acc + r.count, 0)}`);
    console.log(`Supervisors with projects: ${duplicateProjectsResult.rows.length}`);
    
    // 4. Verify data integrity
    console.log("\n📊 Data Integrity Check:");
    const integrityResult = await client.query(`
      SELECT COUNT(*) as total_projects FROM "projects"
    `);
    console.log(`Total projects in DB: ${integrityResult.rows[0].total_projects}`);
    
    const orphanedProjects = await client.query(`
      SELECT COUNT(*) as orphaned FROM "projects"
      WHERE supervisor_id NOT IN (SELECT id FROM "users" WHERE role = 'supervisor')
    `);
    console.log(`Orphaned projects (invalid supervisor): ${orphanedProjects.rows[0].orphaned}`);

    if (orphanedProjects.rows[0].orphaned === 0) {
      console.log("✅ All projects have valid supervisors");
    } else {
      console.log("❌ Found orphaned projects!");
    }

    client.release();
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.detail) console.error("Details:", error.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testProjectIsolation();
