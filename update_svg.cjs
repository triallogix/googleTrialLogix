const fs = require('fs');
const svg = fs.readFileSync('public/architecture.svg', 'utf8');
let component = fs.readFileSync('src/components/ArchitectureDiagram.tsx', 'utf8');
const startIdx = component.indexOf('const svgContent = `');
const endIdx = component.lastIndexOf('`;');
if (startIdx !== -1 && endIdx !== -1) {
  const newSvg = svg.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const newComponent = component.substring(0, startIdx) + 'const svgContent = `\n' + newSvg + '\n`;' + component.substring(endIdx + 2);
  fs.writeFileSync('src/components/ArchitectureDiagram.tsx', newComponent);
  console.log('Successfully updated component');
} else {
  console.error('failed to replace');
}
