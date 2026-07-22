const fs = require('fs');
const path = require('path');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

const sampleFile = path.join(sampleFilesDir, 'sample.txt');
fs.writeFileSync(sampleFile, 'Hello, async world!');

fs.readFile(sampleFile, 'utf8', (err, data) => {
  if (err) {
    console.log('Callback failed:', err.message);
    return;
  }
  console.log('Callback read:', data);
});

// Callback hell happens when each asynchronous step nests inside the
// previous callback, creating a deeply indented "pyramid" that is hard
// to read, reorder, and handle failures in:
//
// fs.readFile('a.txt', 'utf8', (err, a) => {
//   fs.readFile('b.txt', 'utf8', (err, b) => {
//     fs.readFile('c.txt', 'utf8', (err, c) => {
//       console.log(a, b, c);
//     });
//   });
// });

fs.promises
  .readFile(sampleFile, 'utf8')
  .then((data) => {
    console.log('Promise read:', data);
  })
  .catch((err) => {
    console.log('Promise failed:', err.message);
  });

async function readAsync() {
  try {
    const data = await fs.promises.readFile(sampleFile, 'utf8');
    console.log('Async/Await read:', data);
  } catch (err) {
    console.log('Async/Await failed:', err.message);
  }
}

readAsync();
