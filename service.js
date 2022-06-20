const fs = require('fs');
const passwd = require('passwd-linux');
const { execSync } = require('child_process');
const { join } = require('path');
const { io } = require('socket.io-client');

const getFile = (dir) => fs.readFileSync(join(__dirname, dir)).toString();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const { serverIpAddr, hostname } = JSON.parse(getFile('data.json'));
const socket = io(`https://${serverIpAddr}:3030`, {
  ca: getFile('./ssl/certificate.crt'),
  rejectUnauthorized: false,
});

socket.io.on('error', () => {
  console.error('Cannot connect to server. Exiting in 3 seconds...');
  await sleep(3000);
  process.exit(1);
});

socket.once('connect', () => {
  socket.emit('hosc_ip', { hostname });
});