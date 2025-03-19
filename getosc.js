const fs = require('fs');
const osc = require('osc');
const yargs = require('yargs');

// Parse command-line arguments
const argv = yargs
  .usage('Usage: $0 [--json] [--output <filename>] <ip> <port> <address>') // Define usage with optional output file
  .command('$0 <ip> <port> <address>', 'Retrieve OSC values', (yargs) => {
    yargs
      .positional('ip', {
        describe: 'IP address of OSC server',
        type: 'string',
      })
      .positional('port', {
        describe: 'Port for OSC communication',
        type: 'number',
      })
      .positional('address', {
        describe: 'OSC address',
        type: 'string',
      });
  })
  .option('json', {
    alias: 'j',
    type: 'boolean',
    description: 'Output results as JSON',
    default: false,
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Write output to a file',
  })
  .demandCommand(3, 'You must provide an IP, Port, and Address.') // Ensure all 3 positional args
  .strict()
  .help()
  .parse();

// Create an OSC UDP socket
const udpPort = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: argv.port,
  remoteAddress: argv.ip,
  remotePort: argv.port,
});

// Open the UDP port
udpPort.open();

// Timeout error
let timeoutHandle = setTimeout(() => {
  const errorMsg = argv.json ? JSON.stringify({ error: 'No response timeout' }) : 'Error: No response timeout';
  if (argv.output) {
    fs.writeFileSync(argv.output, errorMsg);
  } else {
    process.stdout.write(errorMsg);
  }
  udpPort.close();
  process.exit(1);
}, 5000);

udpPort.on('ready', () => {
  // Send request to the provided OSC address
  udpPort.send({
    address: argv.address,
    args: [],
  });
});

// Handle incoming OSC messages
udpPort.on('message', (oscMsg) => {
  clearTimeout(timeoutHandle); // Cancel the timeout
  const output = argv.json ? JSON.stringify(oscMsg) : oscMsg.args.join();
  if (argv.output) {
    fs.writeFileSync(argv.output, output);
  } else {
    process.stdout.write(output);
  }
  udpPort.close();
  process.exit(0);
});

// Handle errors
udpPort.on('error', (err) => {
  clearTimeout(timeoutHandle);
  const errorMsg = argv.json ? JSON.stringify({ error: err }) : `Error: ${err}`;
  if (argv.output) {
    fs.writeFileSync(argv.output, errorMsg);
  } else {
    process.stdout.write(errorMsg);
  }
  process.exit(1);
});
