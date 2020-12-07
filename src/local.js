
var WebSocket = require('ws');
var net = require('net');

var wss = new WebSocket.Server({ port: 5000 });
wss.on('connection', ws => {
	var connected = false;
	var client = net.Socket();
	console.log('client connected');
	var server = net.createServer((socket) =>{
		ws.send("Game client connected:");
		var remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
		console.log('new client connection from %s' + remoteAddress);
		connected = true;
		client = socket;

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

		client.on('data', (data)=>{
			if (connected){
				ws.send(data);
			}
		});

		client.on('error', (error)=>{
			if (connected){
				connected = false;
				client.destroy();
				ws.send("MC client disconnected");
				console.error(error);
			}
		});
		
		client.on('end', (data)=>{
			if (connected){
				client.destroy();
				console.log(data);
				connected = false;
				ws.send("MC client disconnected");
			}
		});

		ws.on('close', ()=>{
			if (connected){
				connected = false;
				client.destroy();
			}
		});
	});

	server.listen(25565);
});

