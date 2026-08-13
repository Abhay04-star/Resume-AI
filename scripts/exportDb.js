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

  const outDir = path.resolve(process.cwd(), 'db_exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  try {
    await mongoose.connect(url, { serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;

    const collections = ['users', 'resumes', 'experiences', 'educations', 'skills'];
    for (const colName of collections) {
      const col = db.collection(colName);
      const docs = await col.find().sort({ _id: -1 }).limit(1000).toArray();
      const outPath = path.join(outDir, `${colName}.json`);
      fs.writeFileSync(outPath, JSON.stringify(docs, null, 2), 'utf8');
      console.log(`Exported ${docs.length} docs to ${outPath}`);
    }

    await mongoose.disconnect();
    console.log('Export complete.');
    process.exit(0);
  } catch (err) {
    console.error('Export failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
