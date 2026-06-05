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

  const UserSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model('User', UserSchema, 'users');

  const users = await User.find({});
  console.log(`Found ${users.length} users in database:`);
  users.forEach(u => {
    console.log(`- ID: ${u._id}, Name: "${u.name}", Email: "${u.email}", Role: "${u.role}"`);
  });

  await mongoose.disconnect();
  console.log('Disconnected.');
}

run().catch(console.error);
