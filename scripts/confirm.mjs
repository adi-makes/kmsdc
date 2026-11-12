#!/usr/bin/env node
// Asks for explicit confirmation before destructive local operations.
import { createInterface } from 'node:readline/promises';

const message = process.argv[2] ?? 'Are you sure?';
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(`${message}\nType "yes" to continue: `);
rl.close();
if (answer.trim().toLowerCase() !== 'yes') {
  console.log('Aborted.');
  process.exit(1);
}
