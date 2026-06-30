import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('users').updateOne(
    { name: 'Deepak Kumar' },
    { $set: { role: 'owner' } }
  );
  console.log('Modified count:', result.modifiedCount);
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
