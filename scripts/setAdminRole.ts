import { auth } from "../server/lib/firebase-admin";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [, , email, roleArg] = process.argv;
  if (!email) {
    console.error("Usage: npm run set-admin <email> [role]");
    process.exit(1);
  }
  const role = roleArg ?? "super_admin";
  try {
    const userRecord = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(userRecord.uid, { role });
    console.log(`✅ Set role '${role}' for ${email}`);
  } catch (err) {
    console.error("Failed to set role", err);
    process.exit(1);
  }
}

main();
