
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const pathsToCheck = [
    path.join(appData, 'deskai-desktop', 'deskai.db'),
    path.join(appData, 'Electron', 'deskai.db'), // Fallback
    path.join(appData, 'Diffusers', 'deskai.db') // Another guess
];

let dbPath = null;
for (const p of pathsToCheck) {
    if (fs.existsSync(p)) {
        dbPath = p;
        break;
    }
}

if (!dbPath) {
    console.log('Database not found in:', pathsToCheck);
    process.exit(1);
}

console.log('Found database at:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    const count = db.prepare('SELECT count(*) as count FROM files').get();
    console.log('Total files in DB:', count.count);

    const rows = db.prepare('SELECT name, type, status FROM files LIMIT 5').all();
    console.log('Sample files:');
    rows.forEach(r => console.log(` - ${r.name} (${r.type}) [${r.status}]`));

} catch (e) {
    console.error('Error reading DB:', e);
}
