const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/svg/Map.svg');
const outputPath = path.join(__dirname, '../assets/svg/mapSvgContent.ts');

const svgContent = fs.readFileSync(svgPath, 'utf8');

// エスケープ不要。テンプレートリテラルでそのまま出力
const output = `const mapSvgContent = \`${svgContent}\`;\nexport default mapSvgContent;\n`;

fs.writeFileSync(outputPath, output);

console.log('✅ SVG converted to mapSvgContent.ts');