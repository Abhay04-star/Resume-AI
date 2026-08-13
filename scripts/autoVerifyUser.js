const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return {};
  const src = fs.readFileSync(p, 'utf8');
  const obj = {};
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let [, key, val] = m;
    val = val.replace(/^"|"$/g, '');
    obj[key] = val;
  }
  return obj;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.MONGODB_URL || process.env.MONGODB_URL;
  if (!url) {
    console.error('MONGODB_URL is not set in .env.local');
    process.exit(1);
  }

  const emailArg = process.argv[2];
  const allFlag = process.argv.includes('--all');
  if (!emailArg && !allFlag) {
    console.log('Usage: node scripts/autoVerifyUser.js <email>   # mark single email verified');
    console.log('       node scripts/autoVerifyUser.js --all     # mark all unverified credential accounts verified');
    process.exit(1);
  }

  try {
    await mongoose.connect(url, { serverSelectionTimeoutMS: 10000 });
    const users = mongoose.connection.db.collection('users');

    if (allFlag) {
      const res = await users.updateMany({ password: { $exists: true }, emailVerified: null }, { $set: { emailVerified: new Date() } });
      console.log('Marked documents modified:', res.modifiedCount);
    } else {
      const normalized = emailArg.toLowerCase().trim();
      const res = await users.updateOne({ email: normalized }, { $set: { emailVerified: new Date() } });
      if (res.matchedCount === 0) {
        console.log('No user found for', normalized);
      } else {
        console.log('Marked user verified:', normalized);
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('autoVerifyUser failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
