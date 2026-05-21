const fs = require('fs');
const path = require('path');

const files = [
  'app/(director)/dashboard/page.tsx',
  'app/(jardinero)/hoy/page.tsx'
];

files.forEach(f => {
  const fullPath = path.join(__dirname, f);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove font-serif
  content = content.replace(/font-serif/g, 'font-sans font-medium tracking-tight');
  content = content.replace(/rounded-3xl/g, 'rounded-xl');
  content = content.replace(/rounded-2xl/g, 'rounded-lg');
  
  // Colors
  content = content.replace(/bg-\[#2a2928\]/g, 'bg-[#0a0a0a]');
  content = content.replace(/bg-\[#1f1e1d\]/g, 'bg-black');
  content = content.replace(/border-\[#3a3938\]/g, 'border-[#222]');
  content = content.replace(/border-\[#3d3a35\]/g, 'border-[#222]');
  content = content.replace(/bg-\[#3a3938\]/g, 'bg-[#222]');
  content = content.replace(/text-\[#f4f1ea\]/g, 'text-[#ededed]');
  content = content.replace(/text-\[#e0e0e0\]/g, 'text-[#ededed]');
  content = content.replace(/text-\[#e0deda\]/g, 'text-[#ededed]');
  content = content.replace(/text-\[#a3a19e\]/g, 'text-[#888888]');
  
  // Specific replacements for Hoy SVG rings
  if (f.includes('hoy')) {
    // Replace the massive SVG ring with a linear bar
    content = content.replace(/<svg[\s\S]*?<\/svg>/, `<div className="w-full h-1 bg-[#222] rounded-full overflow-hidden mt-4"><div className="h-full bg-primary transition-all" style={{ width: \`\${status.porcentaje}%\` }} /></div>`);
    // Compact checklists
    content = content.replace(/min-h-\[56px\]/g, 'min-h-[44px]');
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Processed', f);
});
