
var WebSocket = require('ws');
var net = require('net');

var port = 25565;
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
}

var wss = new WebSocket.Server({ port: 5000 });
wss.on('connection', ws => {
	var connected = false;
	var client;
	console.log('client connected');

	ws.on('message', (event)=>{
		if (connected){
			if (typeof event == "string"){
				switch(event){
					case "Disconnected from MC server":
						client.destroy();
						connected = false;
						break;
				}
			}
			else{
				client.write(Buffer.from(event));
			}
		}
	});

	var server = net.createServer((socket) =>{
		ws.send("Game client connected:");
		var remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
		console.log('new client connection from %s' + remoteAddress);
		connected = true;
		client = socket;

		client.on('data', (data)=>{
			if (connected){
				ws.send(data);
			}
		});

		client.on('error', (error)=>{
			connected = false;
			client.destroy();
			ws.send("MC client disconnected");
			console.error(error);
		});
		
		client.on('end', ()=>{
			client.destroy();
			connected = false;
			ws.send("MC client disconnected");
		});

	});
	ws.on('close', ()=>{
		ws.terminate();
		if (connected){
			connected = false;
			client.destroy();
		}
	});

	ws.on('error', ()=>{
		ws.terminate();
		if (connected){
			connected = false;
			client.destroy();
		}
	})
	server.listen(port);
});
