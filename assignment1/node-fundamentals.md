# Node.js Fundamentals

## What is Node.js?
Node.js is a runtime environment that lets you run JavaScript outside of a web browser, usually on a server or your own machine.

## How does Node.js differ from running JavaScript in the browser?
In the browser, JavaScript runs inside a sandbox and has access to the DOM, the `window` object, and browser APIs, but it cannot freely reach the file system. Node.js runs directly on the machine for system level work and has no DOM or `window`. Browser JavaScript is mainly about building user interfaces, while Node.js is used for backend logic, files, and networking.

## What is the V8 engine, and how does Node use it?
V8 is the open source JavaScript engine that Google built for the Chrome browser. It compiles JavaScript into fast machine code instead of interpreting it line by line. Node.js embeds V8 to execute JavaScript, then wraps it with a C++ layer and the libuv library. That wrapper adds the event loop, non-blocking I/O, and access to system resources that V8 on its own does not provide.

## What are some key use cases for Node.js?
- Building web servers and REST or GraphQL APIs
- Real-time applications such as chat apps and live notifications using WebSockets
- Command-line tools and automation scripts
- Microservices and other backend services
- Streaming large amounts of data such as files, audio, and video
- Full-stack JavaScript applications where the same language is used on both the front end and back end

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

CommonJS is the original module system in Node.js. It loads modules synchronously with `require()` and shares values through `module.exports`. ES Modules (ESM) are the standardized JavaScript module system that use `import` and `export`, load asynchronously, and are enabled in Node by using a `.mjs` extension or setting `"type": "module"` in package.json.

**CommonJS (default in Node.js):**
```js
function greet(name) {
  return `Hello, ${name}!`;
}
module.exports = { greet };

const { greet } = require('./greet');
console.log(greet('World'));
```

**ES Modules (supported in modern Node.js):**
```js
export function greet(name) {
  return `Hello, ${name}!`;
}

import { greet } from './greet.js';
console.log(greet('World'));
```
