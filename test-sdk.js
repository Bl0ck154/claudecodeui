import { query } from '@anthropic-ai/claude-agent-sdk';
import path from 'path';

// Set up environment
process.env.ANTHROPIC_BASE_URL = "http://127.0.0.1:20128/v1";
process.env.ANTHROPIC_AUTH_TOKEN = "sk-006a49cda95a2016-twpcgw-ba67e1ea";
process.env.ANTHROPIC_MODEL = "kr/claude-sonnet-4.5";

// Ensure node is in PATH
const nodePath = process.execPath;
const nodeDir = nodePath.substring(0, nodePath.lastIndexOf(path.sep));
if (!process.env.PATH.includes(nodeDir)) {
  process.env.PATH = `${nodeDir}${path.delimiter}${process.env.PATH}`;
}

console.log('Testing SDK with config:');
console.log('- BASE_URL:', process.env.ANTHROPIC_BASE_URL);
console.log('- MODEL:', process.env.ANTHROPIC_MODEL);
console.log('- NODE PATH:', nodeDir);

async function test() {
  try {
    console.log('\nStarting SDK query...');

    const result = await query({
      prompt: 'Say "hello" in one word',
      model: 'kr/claude-sonnet-4.5',
      apiUrl: 'http://127.0.0.1:20128/v1',
      workingDirectory: 'C:\\Users\\zail'
    });

    console.log('\nSDK Response:');
    for await (const chunk of result) {
      console.log('Chunk:', JSON.stringify(chunk, null, 2));
    }

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('\nSDK Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
