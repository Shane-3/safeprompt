const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('dist')) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const frontendFiles = walk('../frontend/src');
const backendFiles = walk('./src');
const allFiles = frontendFiles.concat(backendFiles);

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    let hasChanges = false;

    // Remove lines that are just AI section dividers like "// ── Enums ───"
    const cleanedLines = lines.filter(line => {
        if (line.includes('// ──')) {
            hasChanges = true;
            return false;
        }
        return true;
    });

    if (hasChanges) {
        fs.writeFileSync(file, cleanedLines.join('\n'), 'utf-8');
        console.log(`Cleaned ${file}`);
    }
});
