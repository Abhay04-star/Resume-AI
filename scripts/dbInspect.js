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
    const db = mongoose.connection.db;

    const usersCol = db.collection('users');
    const resumesCol = db.collection('resumes');

    const usersCount = await usersCol.countDocuments();
    const resumesCount = await resumesCol.countDocuments();

    console.log('Users count:', usersCount);
    console.log('Resumes count:', resumesCount);

    console.log('\nRecent users (5):');
    const users = await usersCol.find().sort({ _id: -1 }).limit(5).toArray();
    users.forEach((u) => {
      console.log(JSON.stringify({ _id: u._id.toString(), email: u.email, name: u.name || null, emailVerified: u.emailVerified ? u.emailVerified.toISOString() : null, passwordSet: !!u.password }, null, 2));
    });

    console.log('\nRecent resumes (5):');
    const resumes = await resumesCol.find().sort({ _id: -1 }).limit(5).toArray();
    resumes.forEach((r) => {
      console.log(JSON.stringify({ _id: r._id.toString(), title: r.title, owner: r.owner || r.userId || r.user || null, createdAt: r.createdAt ? r.createdAt.toISOString() : null }, null, 2));
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('DB inspect failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
