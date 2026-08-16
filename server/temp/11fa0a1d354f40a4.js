// Write your solution here

function solution(input) {
  const lines = input.trim().split('\n');

  const n = parseInt(lines[0]);
  const arr = lines[1].split(' ').map(Number);

  let sum = 0;

  for (const x of arr) {
    sum += x;
  }

  return sum;
}

const fs = require('fs');

const input = fs.readFileSync(0, 'utf8');

console.log(solution(input));