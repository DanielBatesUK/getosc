# GetOSC: OSC Query Script

This script allows you to send a query to an OSC (Open Sound Control) server and retrieve values from a specified OSC address.

## Requirements

- Node.js (v14 or later recommended)
- `osc` package
- `yargs` package

## Installation

1. Clone the repository or download the script.
2. Install the required dependencies using npm:
   ```sh
   npm install osc yargs
   ```

## Usage

Run the script with the following command:

```sh
node script.js [--json] <ip> <port> <address>
```

### Positional Arguments

- `<ip>`: The IP address of the OSC server.
- `<port>`: The port number for OSC communication.
- `<address>`: The OSC address to query.

### Options

- `--json`, `-j`: Output results in JSON format (default: `false`).

### Example

Retrieve an OSC value from `192.168.1.100` on port `8000` at address `/volume`:

```sh
node script.js 192.168.1.100 8000 /volume
```

Retrieve the same value but output it as JSON:

```sh
node script.js --json 192.168.1.100 8000 /volume
```

## How It Works

1. The script initializes an OSC UDP socket to communicate with the specified OSC server.
2. It sends a query to the specified OSC address.
3. It waits for a response:
   - If a response is received, it prints the returned values.
   - If no response is received within 5 seconds, it prints a timeout error.
4. The script automatically closes the connection and exits after processing the response.

## Error Handling

- If the OSC server does not respond within 5 seconds, the script will exit with an error.
- If an invalid OSC message is received, the script will log the error and exit.
- If incorrect arguments are provided, the script will display usage instructions.

## License

This script is provided under the MIT License.
