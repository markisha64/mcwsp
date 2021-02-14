// initialization
var WebSocket = require('ws');
var net = require('net');
var port = 25565;
var wsport = 5000;

// command line argument parsing (only port exists)
var args = process.argv.slice(2);
for (i=0;i<args.length;i++){
	if (args[i] == "-port" && args.length != i){
		try{
			port = parseInt(args[i+1]);
			if (port < 0 || port > 65536){
				console.log("port out of range");
				port = 80;
			}
		}
		catch (err){
			console.log("invalid port");
		}
	if (args[i] == "-wsport" && args.length != i){
		try{
			wsport = parseInt(args[i+1]);
			if (wsport < 0 || wsport > 65536){
				console.log("webscoket port out of range");
				wsport = 80;
			}
		}
		catch (err){
			console.log("invalid websocket port");
		}
}
// websocket server initialize
var wss = new WebSocket.Server({ port: 5000 });
// websocket server handler
wss.on('connection', ws => {
	// websocket init
	var connected = false;
	var client;
	console.log('client connected');

	// websocket message handler
	ws.on('message', (event)=>{
		// checks if Minecraft client is connected
		if (connected){
			// checks if message is a message for the server or the Minecraft client
			if (typeof event == "string"){
				// handles messages from browser
				switch(event){
					case "Disconnected from MC server":
						client.destroy();
						connected = false;
						break;
				}
			}
			else{
				// talk to MC client
				client.write(Buffer.from(event));
			}
		}
	});

	// local server init with connection handler
	var server = net.createServer((socket) =>{
		// tells browser to get ready for connection
		ws.send("Game client connected:");
		var remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
		console.log('new client connection from %s' + remoteAddress);

		connected = true;
		client = socket; // makes it so that the client attempts to reconnect 
					 	 // the websocket server is handling the right socket

		// sends data from Minecraft client to browser
		client.on('data', (data)=>{
			if (connected){
				ws.send(data);
			}
		});

		// rudimentary socket close handling 
		client.on('end', ()=>{
			client.destroy();
			connected = false;
			ws.send("MC client disconnected");
		});

		// rudimentary socket error handling (close and ignore)
		client.on('error', (error)=>{
			connected = false;
			client.destroy();
			ws.send("MC client disconnected");
			console.error(error);
		});

	});
	// rudimentary socket close handling
	ws.on('close', ()=>{
		ws.terminate();
		if (connected){
			connected = false;
			client.destroy();
		}
	});

	// rudimentary socket error handling (close and ignore)
	ws.on('error', ()=>{
		ws.terminate();
		if (connected){
			connected = false;
			client.destroy();
		}
	})

	// server start
	server.listen(port);
});
