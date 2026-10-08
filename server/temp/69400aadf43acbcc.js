// Write your JavaScript solution
const fs = require('fs');

function solution() {
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (!input) return;
  console.log(input);
}

solution();