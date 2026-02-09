# Database Cleanup & Fix - Duplicate Requests

## Issue Identified
The supervisor is seeing 2 requests when there should only be 1.

This can happen due to:
1. Duplicate entries in the `labor_requests` table
2. Requests being created multiple times accidentally
3. Data from multiple supervisors being shown

## Solution: Clean Up Database

### Step 1: Check Current Database State

Run this query in your database console (Neon):

```sql
-- Check all requests
SELECT id, project_id, labor_id, supervisor_id, status, created_at 
FROM labor_requests 
ORDER BY created_at DESC;

-- Check requests for specific supervisor
SELECT id, project_id, labor_id, supervisor_id, status, created_at 
FROM labor_requests 
WHERE supervisor_id = 'YOUR_SUPERVISOR_ID' 
ORDER BY created_at DESC;

-- Count requests per supervisor
SELECT supervisor_id, COUNT(*) as request_count
FROM labor_requests
GROUP BY supervisor_id;
```

### Step 2: Identify Duplicates

```sql
-- Find duplicate requests for same project and labor
SELECT project_id, labor_id, supervisor_id, COUNT(*) as count
FROM labor_requests
GROUP BY project_id, labor_id, supervisor_id
HAVING COUNT(*) > 1;
```

### Step 3: Delete Duplicates (Keep Only One)

```sql
-- Option 1: Delete ALL requests for a specific supervisor
DELETE FROM labor_requests 
WHERE supervisor_id = 'SUPERVISOR_ID_TO_DELETE';

-- Option 2: Delete specific duplicate request by ID
DELETE FROM labor_requests 
WHERE id = 'REQUEST_ID_TO_DELETE';

-- Option 3: Keep only the latest request per (project, labor, supervisor)
DELETE FROM labor_requests 
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, labor_id, supervisor_id) id
  FROM labor_requests
  ORDER BY project_id, labor_id, supervisor_id, created_at DESC
);
```

---

## Easy Fix: Code-Level Deduplication

If you want to keep the database as is, add deduplication at the API level:

### Update `server/routes.ts`

Add this function to deduplicate requests:

```typescript
// Add this helper function near the top of routes.ts
function deduplicateRequests(requests: LaborRequest[]): LaborRequest[] {
  const seen = new Set<string>();
  return requests.filter(request => {
    const key = `${request.projectId}|${request.laborId}|${request.supervisorId}`;
    if (seen.has(key)) {
      return false; // Skip duplicate
    }
    seen.add(key);
    return true;
  });
}
```

Then update the GET endpoint:

```typescript
app.get("/api/labor-requests", requireAuth, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let requests;

    if (req.session.role === "admin") {
      if (status) {
        requests = await storage.getLaborRequestsByStatus(status as string);
      } else {
        const pending = await storage.getLaborRequestsByStatus("pending");
        const approved = await storage.getLaborRequestsByStatus("approved");
        const rejected = await storage.getLaborRequestsByStatus("rejected");
        requests = [...pending, ...approved, ...rejected];
      }
    } else if (req.session.role === "supervisor") {
      let supervisorRequests = await storage.getLaborRequestsBySupervisor(req.session.userId!);
      // ✅ ADD THIS LINE TO DEDUPLICATE
      supervisorRequests = deduplicateRequests(supervisorRequests);
      requests = supervisorRequests;
    } else {
      requests = await storage.getLaborRequestsByLabor(req.session.userId!);
    }

    // ... rest of the code
  }
});
```

---

## Database Connection Info

To access your database directly:
1. Go to https://console.neon.tech/
2. Login with your account
3. Select your database
4. Use the SQL Editor
5. Run the queries above

---

## After Fix

- [ ] Verify only 1 request shows in supervisor dashboard
- [ ] Test creating a new request
- [ ] Verify it appears once
- [ ] Test approval workflow
- [ ] Check admin sees all requests correctly

---

## Prevention

To prevent this in the future:
1. Add unique constraint on requests:
   ```sql
   ALTER TABLE labor_requests 
   ADD CONSTRAINT unique_project_labor_supervisor 
   UNIQUE (project_id, labor_id, supervisor_id);
   ```

2. Or check before creating:
   ```typescript
   // In POST /api/labor-requests route
   const existing = await storage.getLaborRequestsBySupervisor(supervisorId);
   const isDuplicate = existing.some(r => 
     r.projectId === projectId && r.laborId === laborId
   );
   if (isDuplicate) {
     return res.status(409).json({ message: "Request already exists" });
   }
   ```

---

**Choose one solution above and apply it!**
