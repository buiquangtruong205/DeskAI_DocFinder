

// Mock electron
const mockPath = 'C:\\Users\\Admin\\AppData\\Roaming\\DeskAI_DocFinder'; // Adjust based on OS/User? Or use process.env.APPDATA
// Better: use a temporary path or just try to require 'electron' and mock it if possible.
// Since we can't easily mock the module system's require('electron'), we might fail if db.ts imports it at top level.

// Approach 2: Create a minimal db.ts copy for testing if the original imports electron
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join('C:\\Users\\Admin\\AppData\\Roaming\\DeskAI_DocFinder', 'database.sqlite'); // Guessing default
// Check if file exists
if (!fs.existsSync(dbPath)) {
    console.error('DB file not found at guessed path:', dbPath);
    // Try to find it relative to us?
}

// ... actually, let's look at db.ts content first before writing this.

try {
    const allFiles = filesRepo.list({ limit: 5 });
    console.log(`filesRepo.list returned ${allFiles.length} files.`);
    allFiles.forEach(f => console.log(` - ${f.name} (${f.type})`));
} catch (e) {
    console.error('filesRepo.list failed:', e);
}

console.log('\n--- Testing searchService.search("") ---');
try {
    const results = await searchService.search('', { mode: 'hybrid' });
    console.log(`searchService.search("") returned ${results.length} results.`);
    results.forEach(r => console.log(` - ${r.title} [${r.matchType}]`));
} catch (e) {
    console.error('searchService.search failed:', e);
}
}

test();
