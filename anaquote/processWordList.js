#! /usr/bin/env node

process.stdin.setEncoding('latin1')
let readline = require('readline')
let rl = readline.createInterface({ input: process.stdin })
let prefixes = []

rl.on('line', (word) => {
  word = word.toUpperCase()
  let len = word.length
  if (!prefixes[len]) prefixes[len] = new Set()
  for (let i = 0; i <= len; i++) prefixes[len].add(word.substr(0, i))
}).on('close', () => {
  prefixes = prefixes.map(set => [...set])
  console.log(JSON.stringify(prefixes))
})
