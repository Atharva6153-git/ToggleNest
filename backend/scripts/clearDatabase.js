require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

require('../models/User');
require('../models/Project');
require('../models/Task');
require('../models/ActivityLog');
require('../models/Notification');

const MODELS = ['User', 'Project', 'Task', 'ActivityLog', 'Notification'];

async function confirm() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question('This will DELETE ALL documents from every collection. Type "yes" to continue: ', resolve);
  });
  rl.close();

  return answer.trim().toLowerCase() === 'yes';
}

async function clearDatabase() {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error('Missing MONGO_URI in environment (.env)');
    process.exit(1);
  }

  const proceed = await confirm();
  if (!proceed) {
    console.log('Aborted. No data was deleted.');
    process.exit(0);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const name of MODELS) {
      const model = mongoose.model(name);
      const result = await model.deleteMany({});
      console.log(`Cleared ${name}: ${result.deletedCount} document(s) deleted`);
    }

    console.log('Database cleared.');
  } catch (err) {
    console.error('Failed to clear database:', err.message || err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearDatabase();
