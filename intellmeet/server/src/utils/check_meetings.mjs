import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is missing from environment.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  const MeetingSchema = new mongoose.Schema({}, { strict: false });
  const Meeting = mongoose.model('Meeting', MeetingSchema, 'meetings');

  const meetings = await Meeting.find({});
  console.log(`Found ${meetings.length} meetings in database:`);
  meetings.forEach(m => {
    console.log(`- ID: ${m._id}, Title: "${m.title}", Status: "${m.status}", Host: "${m.host}", Creator: "${m.creator}"`);
  });

  await mongoose.disconnect();
  console.log('Disconnected.');
}

run().catch(console.error);
