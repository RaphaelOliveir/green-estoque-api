const fs = require('fs');
const path = require('path');

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixFiles(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const idx = content.indexOf('.Groups[1].Value');
      if (idx !== -1) {
        // Encontrar o início da linha corrompida import \{ query, execute \}  "from '$(...
        // Mas a corrupção na verdade cria múltiplas coisas. 
        // Em auth.ts a linha foi: `.Groups[1].Value)'" ;`
        // Mas logo antes dela, o arquivo estava correto? Sim! O arquivo termina corretamente no `export default router;` ou na última função.
        // O regex replace que eu rodei substituiu "from '../controllers/'" por "from '.Groups[1].Value'".
        // Na verdade, eu posso só truncar antes do primeiro '.Groups[1].Value'.
        // Vamos procurar a string ".Groups" e voltar até a quebra de linha anterior.
        let cutIdx = content.lastIndexOf('\n', idx);
        
        // Wait, some files have `import \{ ... \}  "from '$(import ...` at the TOP of the file.
        // Let's check auth.ts again. Line 4 is `import \{ query, execute \}  "from '$(import { Request, Response, NextFunction } from 'express';`
        // This means the top of the file IS corrupted.
        
        console.log("File is corrupted:", fullPath);
      }
    }
  }
}

fixFiles(path.join(__dirname, 'src'));
