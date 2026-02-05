const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_FOLDER = process.argv[2] || process.cwd(); // Pass folder as arg or use current
const INCLUDE_EXTS = ['.md', '.txt', '.pdf', '.py', '.js', '.ts', '.json', '.html', '.css', '.java', '.cpp', '.c', '.h', '.vue'];
const EXCLUDE_PATTERNS = ['node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__'];

console.log(`Scanning: ${TARGET_FOLDER}`);
console.log(`Includes: ${INCLUDE_EXTS.join(', ')}`);
console.log(`Excludes: ${EXCLUDE_PATTERNS.join(', ')}`);

async function recursiveScan(dir) {
    let results = [];
    try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const resPath = path.resolve(dir, entry.name);

            // Exclude check
            if (EXCLUDE_PATTERNS.some(p => resPath.includes(p))) {
                // console.log(`Skipping (excluded): ${resPath}`);
                continue;
            }

            if (entry.isDirectory()) {
                results = results.concat(await recursiveScan(resPath));
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (INCLUDE_EXTS.includes(ext)) {
                    // console.log(`Found: ${resPath}`);
                    results.push(resPath);
                } else {
                    // console.log(`Skipping (ext): ${resPath}`);
                }
            }
        }
    } catch (e) {
        console.error(`Error accessing ${dir}:`, e.message);
    }
    return results;
}

(async () => {
    console.log("--- START SCAN ---");
    const start = Date.now();
    const files = await recursiveScan(TARGET_FOLDER);
    const duration = Date.now() - start;

    console.log("--- SCAN COMPLETE ---");
    console.log(`Found ${files.length} valid files in ${duration}ms`);
    if (files.length > 0) {
        console.log("First 5 files:");
        files.slice(0, 5).forEach(f => console.log(' - ' + f));
    } else {
        console.log("❌ No files found! Check your folder content or extensions.");
    }
})();
