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

  try {
    await mongoose.connect(url, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');
    const cols = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', cols.map((c) => c.name));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('DB check failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
