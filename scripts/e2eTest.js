const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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
    console.error('MONGODB_URL not set');
    process.exit(1);
  }

  await mongoose.connect(url, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');
  const resumes = db.collection('resumes');

  const timestamp = Date.now();
  const testEmail = `e2e-test+${timestamp}@example.com`;
  const password = 'e2eTestPass123';

  // Create user
  const hash = await bcrypt.hash(password, 12);
  const userDoc = {
    name: 'E2E Tester',
    email: testEmail,
    password: hash,
    emailVerified: new Date(),
    image: null,
  };

  const { insertedId } = await users.insertOne(userDoc);
  console.log('Inserted user:', testEmail, 'id=', insertedId.toString());

  // Create resume document
  const resumeDoc = {
    resumeId: `e2e-${timestamp}`,
    userId: insertedId.toString(),
    title: 'E2E Test Resume',
    updatedAt: new Date(),
    firstName: 'E2E',
    lastName: 'Tester',
    jobTitle: 'Test Engineer',
    summary: 'This is a test resume created by automated E2E script.',
    experience: [],
    education: [],
    skills: [],
    themeColor: '#000000',
    template: 'classic',
    sectionOrder: ['experience', 'education', 'skills'],
    skillsStyle: 'bars',
    dateFormat: 'default',
    hiddenSections: [],
    customSections: [],
    isPublic: false,
  };

  const res = await resumes.insertOne(resumeDoc);
  console.log('Inserted resume id=', res.insertedId.toString());

  // Verify
  const savedUser = await users.findOne({ _id: insertedId });
  const savedResume = await resumes.findOne({ _id: res.insertedId });
  console.log('Saved user email:', savedUser.email);
  console.log('Saved resume title:', savedResume.title);

  // List collections
  const cols = await db.listCollections().toArray();
  console.log('Collections:', cols.map((c) => c.name));

  // Clean up note: we intentionally leave the docs so you can inspect them in Atlas/Compass.

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error('E2E script failed:', e && e.message ? e.message : e);
  process.exit(1);
});
