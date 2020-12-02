
var WebSocket = require('ws');
var net = require('net');

var wss = new WebSocket.Server({ port: 5000 });
wss.on('connection', ws => {
	var connected = false;
	console.log('client connected');
	var server = net.createServer((socket) =>{
		ws.send("Game client connected:");
		var remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
		console.log('new client connection from %s' + remoteAddress);
		connected = true;

		ws.on('message', (event)=>{
			if (connected){
				if (typeof event == "string"){
					switch(event){
						case "Disconnected from MC server":
							socket.destroy();
							connected = false;
							break;
					}
				}
				else{
					socket.write(Buffer.from(event));
				}
			}
		});
		ws.on('close', ()=>{
			connected = false;
			socket.destroy();
		})
		socket.on('data', (data)=>{
			ws.send(data);

		});
		socket.on('error', (error)=>{
			connected = false;
			console.error(error);
			socket.destroy();
			ws.send("MC client disconnected");
		});

		socket.on('end', ()=>{
			socket.destroy()
			connected = false;
			ws.send("MC client disconnected");
		});
	});
	server.listen(25565);

	ws.on('close', ()=>{
		console.log("client disconnected")
	})
});

