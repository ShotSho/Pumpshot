const fs = require('fs');
const files = [
  'src/server/address.ts',
  'src/server/decode/normalizeTx.ts',
  'src/server/graph.ts',
  'src/server/history.ts'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Replace big int literals like 100n with BigInt(100)
  content = content.replace(/\b(\d+)n\b/g, 'BigInt($1)');
  fs.writeFileSync(f, content);
});
