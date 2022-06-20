const fs = require('fs');
const passwd = require('passwd-linux');
const { execSync } = require('child_process');
const { join } = require('path');
const { io } = require('socket.io-client');
const prompts = require('prompts');

const getFile = (dir) => fs.readFileSync(join(__dirname, dir)).toString();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const hoscData = {};

if (fs.existsSync(join(__dirname, 'data.json'))) {
  console.error('This machine has already been configured');
  process.exit(1);
}

const init = async () => {
  console.log('=== HEPHAIST OS CLIENT (HOSC) ===');
  console.log('');

  const { serverIpAddr } = await prompts({
    type: 'text',
    name: 'serverIpAddr',
    message: 'Enter IP address of the server',
  });

  const socket = io(`https://${serverIpAddr}:3030`, {
    ca: getFile('./ssl/certificate.crt'),
    rejectUnauthorized: false,
  });
  hoscData.serverIpAddr = serverIpAddr;
  socket.io.on('error', () => {
    console.error('Cannot connect to server. Please try again.');
    if (socket.connected) {
      socket.disconnect();
    }
    init();
  });

  console.log('Connecting to server...');
  socket.once('connect', () => {
    askHostnameAndSetup(socket);
  });
};

const askHostnameAndSetup = (socket) => async () => {
  console.log('');
  const { hostname } = await prompts({
    type: 'text',
    name: 'hostname',
    message: 'Enter a hostname for this PC',
  });
  hoscData.hostname = hostname;

  execSync(`hostnamectl set-hostname "${hostname}"`);

  socket.emit('hosc_setup', { hostname }, ({ sshPublicKey, hoscPassword, error }) => {
    if (error) {
      console.log('ERROR:' + error);
      askHostnameAndSetup(socket)();
      return;
    }

    fs.writeFileSync('/home/hosc/.ssh/authorized_keys', sshPublicKey);
    await runPasswd('hosc', hoscPassword);
    saveData(hoscData);

    console.log('HOSC setup complete. Rebooting now...');
    await sleep(3000);

    socket.disconnect();
    process.exit();
  });
};

const runPasswd = (username, password) => new Promise(resolve => {
  passwd.changePassword(username, password, function (err, response) {
    if (err) {
      console.log(err);
    } else {
      resolve(response);
    }
  });
});

const saveData = (data) => {
  fs.writeFileSync(
    join(__dirname, 'data.json'),
    JSON.stringify(data)
  );
};

init();

