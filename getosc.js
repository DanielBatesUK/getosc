const fs = require('fs');
const osc = require('osc');
const yargs = require('yargs');

// Retry options
let retries = 0;
const maxRetries = 3;
const retryDelay = 200; // 200ms between retries
const timeoutDuration = 5000; // 5 seconds total timeout

// Argument options
const argv = yargs
  .usage('Usage: $0 [--json] [--output <filename>] <ip> <port> <address>')
  .command('$0 <ip> <port> <address>', 'Retrieve OSC values', (yargs) => {
    yargs.positional('ip', { describe: 'IP address of OSC server', type: 'string' }).positional('port', { describe: 'Port for OSC communication', type: 'number' }).positional('address', { describe: 'OSC address', type: 'string' });
  })
  .option('json', { alias: 'j', type: 'boolean', description: 'Output results as JSON', default: false })
  .option('output', { alias: 'o', type: 'string', description: 'Write output to a file' })
  .demandCommand(3, 'You must provide an IP, Port, and Address.')
  .strict()
  .help()
  .parse();

// UDP port options
const udpPort = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: argv.port,
  remoteAddress: argv.ip,
  remotePort: argv.port,
});

// Master timeout to prevent infinite hanging
const masterTimeout = setTimeout(() => {
  handleTimeout();
}, timeoutDuration);
udpPort.open();
udpPort.on('ready', () => {
  sendOSCMessage();
});

// Send OSC message
function sendOSCMessage() {
  if (retries > maxRetries) return;
  udpPort.send({ address: argv.address, args: [] });
  retries++;
  // Schedule a retry if no response is received
  setTimeout(() => {
    if (retries <= maxRetries) {
      console.log('retries', retries);
      sendOSCMessage();
    }
  }, retryDelay);
}

// Handle timeout case
function handleTimeout() {
  const errorMsg = argv.json ? JSON.stringify({ error: 'No response timeout' }) : 'Error: No response timeout';
  if (argv.output) fs.writeFileSync(argv.output, errorMsg);
  else process.stdout.write(errorMsg);
  udpPort.close();
  process.exit(1);
}

// Handle incoming OSC messages
udpPort.on('message', (oscMsg) => {
  clearTimeout(masterTimeout); // Stop master timeout on success
  const output = argv.json ? JSON.stringify(oscMsg) : oscMsg.args.join();
  if (argv.output) fs.writeFileSync(argv.output, output);
  else process.stdout.write(output);
  udpPort.close();
  process.exit(0);
});

// Handle errors
udpPort.on('error', (err) => {
  clearTimeout(masterTimeout);
  const errorMsg = argv.json ? JSON.stringify({ error: err }) : `Error: ${err}`;
  if (argv.output) fs.writeFileSync(argv.output, errorMsg);
  else process.stdout.write(errorMsg);
  udpPort.close();
  process.exit(1);
});
