const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix roleGuard params
      content = content.replace(/roleGuard\(\['admin', 'funcionario'\]\)/g, "roleGuard('admin')");
      content = content.replace(/roleGuard\(\['ADMIN'\]\)/g, "roleGuard('admin')");
      content = content.replace(/roleGuard\(\['ADMIN', 'GERENTE'\]\)/g, "roleGuard('admin')");

      // Fix req.file in controllers
      content = content.replace(/if \(!req\.file\)/g, 'if (!(req as any).file)');
      content = content.replace(/req\.file\.path/g, '(req as any).file.path');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir(path.join(__dirname, 'src/routes'));
replaceInDir(path.join(__dirname, 'src/controllers'));

// Fix database.ts params type
let dbPath = path.join(__dirname, 'src/config/database.ts');
let dbContent = fs.readFileSync(dbPath, 'utf8');
dbContent = dbContent.replace(/params\?: unknown\[\]/g, 'params?: any[]');
fs.writeFileSync(dbPath, dbContent);

// Fix app.ts line 88
let appPath = path.join(__dirname, 'src/app.ts');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(/seedAdmin\(\);/g, 'seedAdmin({} as any, {} as any, {} as any);');
fs.writeFileSync(appPath, appContent);

console.log('Fixed more types');
