const fs = require('fs');

let indexCode = fs.readFileSync('server/src/index.ts', 'utf8');

// Remove imports
indexCode = indexCode.replace(/import \{ getOrCreateUser, getUsers \} from "\.\/db\/users\.ts";\n?/g, '');

// Remove the endpoints
const endpointTarget = `  // Cloud SQL & Auth sync endpoints
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "";
      const displayName = req.body?.displayName;
      if (!uid) {
        return res.status(400).json({ error: "Missing user identity" });
      }
      const user = await getOrCreateUser(uid, email, displayName);
      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Failed to sync user with database:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const users = await getUsers();
      res.json({ users });
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });`;

indexCode = indexCode.replace(endpointTarget, '');
fs.writeFileSync('server/src/index.ts', indexCode);
console.log('Removed SQL endpoints from server/src/index.ts');

