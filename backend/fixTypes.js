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
      
      // Fix query<any[]> to query<any>
      content = content.replace(/query<any\[\]>/g, 'query<any>');
      
      // Fix roleGuard(['ADMIN', 'GERENTE']) to roleGuard('admin')
      content = content.replace(/roleGuard\(\['ADMIN', 'GERENTE'\]\)/g, "roleGuard('admin')");
      
      // Fix req.file typing in produtosController
      if (file === 'produtosController.ts') {
        content = content.replace('if (!req.file) {', 'if (!(req as any).file) {');
        content = content.replace('const fotoUrl = req.file.path', 'const fotoUrl = (req as any).file.path');
        content = content.replace('const imagem_url = req.file.path', 'const imagem_url = (req as any).file.path');
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
console.log('Fixed types');
