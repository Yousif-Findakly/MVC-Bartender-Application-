/**
 * config/resetDatabase.js
 * ---------------------------------------------------------------------------
 * Utility script: wipes the SQLite file and rebuilds it with a fresh seeded
 * cocktail menu and an empty order queue. Handy before a demo.
 *
 * Run with:  npm run reset-db
 * ---------------------------------------------------------------------------
 */

const fs = require('fs');
const { DB_FILE } = require('./database');

if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE);
  console.log('Removed existing database:', DB_FILE);
}

// Re-require in a clean state so the schema + seed run against a new file.
delete require.cache[require.resolve('./database')];
const { initialize } = require('./database');
initialize();

console.log('Database rebuilt with the seeded cocktail menu and an empty order queue.');
