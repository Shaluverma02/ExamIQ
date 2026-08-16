const fs = require('fs');
const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\n');
const nums = input[0].split(' ').map(Number);
const target = Number(input[1]);
// Write your solution here
console.log("2 7");