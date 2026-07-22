const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

console.log('Platform:', os.platform());
console.log('CPU:', os.cpus()[0].model);
console.log('Total Memory:', os.totalmem());

const joinedPath = path.join(sampleFilesDir, 'folder', 'file.txt');
console.log('Joined path:', joinedPath);

async function run() {
  const demoFile = path.join(sampleFilesDir, 'demo.txt');
  await fs.promises.writeFile(demoFile, 'Hello from fs.promises!');
  const demoContent = await fs.promises.readFile(demoFile, 'utf8');
  console.log('fs.promises read:', demoContent);

  const largeFile = path.join(sampleFilesDir, 'largefile.txt');
  let lines = '';
  for (let i = 1; i <= 100; i++) {
    lines += `This is line ${i} in a large file for streaming.\n`;
  }
  await fs.promises.writeFile(largeFile, lines);

  const stream = fs.createReadStream(largeFile, {
    encoding: 'utf8',
    highWaterMark: 1024,
  });

  stream.on('data', (chunk) => {
    console.log('Read chunk:', chunk.slice(0, 40));
  });

  stream.on('end', () => {
    console.log('Finished reading large file with streams');
  });
}

run();
