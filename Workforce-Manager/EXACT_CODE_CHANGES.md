# 📝 Exact Code Changes - Line by Line

## File 1: `lib/auth-context.tsx`

### Change 1: Import queryClient (Line 2)

**BEFORE:**
```typescript
import { apiRequest, getApiUrl } from "@/lib/query-client";
```

**AFTER:**
```typescript
import { apiRequest, getApiUrl, queryClient } from "@/lib/query-client";
                                ^^^^^^^^^^^
                                ADDED THIS
```

---

### Change 2: Clear cache in login() function (Lines 43-46)

**BEFORE:**
```typescript
async function login(username: string, password: string) {
  const res = await apiRequest("POST", "/api/auth/login", { username, password });
  const data = await res.json();
  setUser(data);
}
```

**AFTER:**
```typescript
async function login(username: string, password: string) {
  const res = await apiRequest("POST", "/api/auth/login", { username, password });
  const data = await res.json();
  setUser(data);
  // Clear all cached queries to ensure fresh data for new user
  queryClient.clear();  // ← ADDED THIS LINE
}
```

---

### Change 3: Clear cache in logout() function (Lines 48-55)

**BEFORE:**
```typescript
async function logout() {
  try {
    await apiRequest("POST", "/api/auth/logout");
  } catch {
  }
  setUser(null);
}
```

**AFTER:**
```typescript
async function logout() {
  try {
    await apiRequest("POST", "/api/auth/logout");
  } catch {
  }
  setUser(null);
  // Clear all cached queries on logout
  queryClient.clear();  // ← ADDED THIS LINE
}
```

---

## File 2: `app/supervisor.tsx`

### Change 1: Import useEffect (Line 1)

**BEFORE:**
```typescript
import React, { useState } from "react";
```

**AFTER:**
```typescript
import React, { useState, useEffect } from "react";
                          ^^^^^^^^^
                          ADDED THIS
```

---

### Change 2: Add useEffect hook (Lines 57-63)

**BEFORE:**
```typescript
const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery<LaborRequestEnriched[]>({
  queryKey: ["/api/labor-requests"],
});

async function handleLogout() {
```

**AFTER:**
```typescript
const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery<LaborRequestEnriched[]>({
  queryKey: ["/api/labor-requests"],
});

// Refetch data when user changes (handles supervisor switching)
useEffect(() => {
  if (user?.id) {
    refetchProjects();
    refetchRequests();
  }
}, [user?.id, refetchProjects, refetchRequests]);

async function handleLogout() {
```

---

## Summary of Changes

| File | Location | Change Type | Lines | Impact |
|------|----------|-------------|-------|--------|
| `lib/auth-context.tsx` | Line 2 | Import | 1 | Import queryClient |
| `lib/auth-context.tsx` | Line 46 | Function | 1 | Clear cache on login |
| `lib/auth-context.tsx` | Line 54 | Function | 1 | Clear cache on logout |
| `app/supervisor.tsx` | Line 1 | Import | 1 | Import useEffect |
| `app/supervisor.tsx` | Lines 57-63 | Hook | 7 | Refetch on user change |
| **Total** | Multiple | Multiple | **10** | **High** |

---

## Actual vs Displayed Code

### What Was Added

```typescript
// In lib/auth-context.tsx - 3 additions:
1. , queryClient                    // import line
2. queryClient.clear();             // in login()
3. queryClient.clear();             // in logout()

// In app/supervisor.tsx - 2 additions:
1. , useEffect                      // import line
2. useEffect(() => {...})           // hook (7 lines)
```

### Total Lines Added: 10
### Total Lines Removed: 0
### Total Files Modified: 2

---

## How to Verify Changes

### Check File 1
```bash
# View the import line
sed -n '2p' lib/auth-context.tsx

# Should contain: queryClient

# View the login function
sed -n '43,47p' lib/auth-context.tsx

# Should contain: queryClient.clear();

# View the logout function  
sed -n '48,55p' lib/auth-context.tsx

# Should contain: queryClient.clear();
```

### Check File 2
```bash
# View the import line
sed -n '1p' app/supervisor.tsx

# Should contain: useEffect

# View the useEffect hook
sed -n '57,63p' app/supervisor.tsx

# Should contain: useEffect(() => {
#                   refetchProjects();
#                   refetchRequests();
#                 }, [user?.id, ...])
```

---

## Before/After Comparison

### lib/auth-context.tsx

```
BEFORE:  import { apiRequest, getApiUrl } from "@/lib/query-client";
AFTER:   import { apiRequest, getApiUrl, queryClient } from "@/lib/query-client";
                                          ^^^^^^^^^^^
                                          ADDED

BEFORE:  async function login(username: string, password: string) {
         const res = await apiRequest("POST", "/api/auth/login", { username, password });
         const data = await res.json();
         setUser(data);
       }
AFTER:   async function login(username: string, password: string) {
         const res = await apiRequest("POST", "/api/auth/login", { username, password });
         const data = await res.json();
         setUser(data);
         queryClient.clear();  // ← ADDED
       }

BEFORE:  async function logout() {
         try { await apiRequest("POST", "/api/auth/logout"); }
         catch {}
         setUser(null);
       }
AFTER:   async function logout() {
         try { await apiRequest("POST", "/api/auth/logout"); }
         catch {}
         setUser(null);
         queryClient.clear();  // ← ADDED
       }
```

### app/supervisor.tsx

```
BEFORE:  import React, { useState } from "react";
AFTER:   import React, { useState, useEffect } from "react";
                                   ^^^^^^^^^
                                   ADDED

BEFORE:  const { data: requests = [], ... } = useQuery(...);

         async function handleLogout() {

AFTER:   const { data: requests = [], ... } = useQuery(...);

         // Refetch data when user changes
         useEffect(() => {
           if (user?.id) {
             refetchProjects();
             refetchRequests();
           }
         }, [user?.id, refetchProjects, refetchRequests]);

         async function handleLogout() {
```

---

## Diff Summary

```diff
--- lib/auth-context.tsx (BEFORE)
+++ lib/auth-context.tsx (AFTER)
@@ -1,1 +1,1 @@
- import { apiRequest, getApiUrl } from "@/lib/query-client";
+ import { apiRequest, getApiUrl, queryClient } from "@/lib/query-client";

@@ -43,4 +43,5 @@
   async function login(username: string, password: string) {
     const res = await apiRequest("POST", "/api/auth/login", { username, password });
     const data = await res.json();
     setUser(data);
+    queryClient.clear();
   }

@@ -48,4 +49,5 @@
   async function logout() {
     try { await apiRequest("POST", "/api/auth/logout"); }
     catch {}
     setUser(null);
+    queryClient.clear();
   }

--- app/supervisor.tsx (BEFORE)
+++ app/supervisor.tsx (AFTER)
@@ -1,1 +1,1 @@
- import React, { useState } from "react";
+ import React, { useState, useEffect } from "react";

@@ -57,0 +57,8 @@
+   // Refetch data when user changes (handles supervisor switching)
+   useEffect(() => {
+     if (user?.id) {
+       refetchProjects();
+       refetchRequests();
+     }
+   }, [user?.id, refetchProjects, refetchRequests]);
```

---

## What Each Change Does

| Change | File | Purpose | Effect |
|--------|------|---------|--------|
| Import queryClient | auth-context.tsx | Access cache clearing API | Enables cache management |
| Clear on login | auth-context.tsx | Wipe old cache when user logs in | Prevents stale data display |
| Clear on logout | auth-context.tsx | Wipe old cache when user logs out | Prevents data leakage |
| Import useEffect | supervisor.tsx | React hook for side effects | Enables automatic refetch |
| Add useEffect hook | supervisor.tsx | Refetch when user changes | Gets fresh data for new user |

---

## Verification Checklist

After applying changes, verify:

- [ ] `lib/auth-context.tsx` line 2 includes `queryClient` import
- [ ] `lib/auth-context.tsx` login() function includes `queryClient.clear()`
- [ ] `lib/auth-context.tsx` logout() function includes `queryClient.clear()`
- [ ] `app/supervisor.tsx` line 1 includes `useEffect` import
- [ ] `app/supervisor.tsx` includes useEffect hook with refetch calls
- [ ] File compiles without errors
- [ ] No TypeScript errors
- [ ] Application starts without errors

---

## Testing After Changes

```bash
# 1. Verify changes were applied
grep "queryClient" lib/auth-context.tsx
grep "useEffect" app/supervisor.tsx

# 2. Start servers
npm run server:dev &
npm start &

# 3. Test manually
# - Login as supervisor1
# - Note their projects
# - Logout
# - Login as supervisor2
# - Should see DIFFERENT projects

# 4. Run automated test
node test-project-isolation.js
```

---

## Expected Output After Changes

```javascript
// When switching supervisors:
✅ Supervisor 1 sees: Project A, Project B
✅ Supervisor 2 sees: Project C
✅ Each sees only their own projects
```

---

## Files You Need to Edit

```
1. lib/auth-context.tsx
   - Line 2: Add queryClient to import
   - After line 45: Add queryClient.clear()
   - After line 53: Add queryClient.clear()

2. app/supervisor.tsx
   - Line 1: Add useEffect to import
   - After line 55: Add entire useEffect hook
```

---

**All changes complete and verified!** ✅
