import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Note from './models/Notes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  try {
    const notesPath = path.join(__dirname, '../Notes.json');
    const raw = fs.readFileSync(notesPath, 'utf-8');
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      throw new Error('Notes.json is not an array');
    }

    let upserted = 0;
    for (const entry of data) {
      if (!entry?.branch || !Array.isArray(entry?.subjects)) continue;
      await Note.updateOne(
        { branch: entry.branch },
        { $set: { subjects: entry.subjects } },
        { upsert: true }
      );
      upserted += 1;
      console.log(`Upserted branch: ${entry.branch}`);
    }

    console.log(`Done. Upserted ${upserted} branches.`);
  } catch (err) {
    console.error('Error seeding notes:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
