const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file === 'node_modules' || file === '.expo') return;
      results = results.concat(walk(filePath));
    } else {
      if (/\.(js|jsx|ts|tsx)$/.test(file)) results.push(filePath);
    }
  });
  return results;
}

const projectRoot = path.resolve(__dirname, '..');
const files = walk(projectRoot);
const importRe = /from\s+['\"]([^'\"]+)['\"]/g;
const requireRe = /require\(['\"]([^'\"]+)['\"]\)/g;
const problems = [];

files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = importRe.exec(content))) {
    const imp = m[1];
    if (imp.startsWith('.') || imp.startsWith('/')) {
      const resolved = path.resolve(path.dirname(f), imp);
      try {
        const stats = fs.statSync(resolved);
        if (stats.isDirectory()) problems.push({ file: f, import: imp, resolved });
      } catch (e) {}
    }
  }
  while ((m = requireRe.exec(content))) {
    const imp = m[1];
    if (imp.startsWith('.') || imp.startsWith('/')) {
      const resolved = path.resolve(path.dirname(f), imp);
      try {
        const stats = fs.statSync(resolved);
        if (stats.isDirectory()) problems.push({ file: f, import: imp, resolved });
      } catch (e) {}
    }
  }
});

console.log(JSON.stringify(problems, null, 2));
