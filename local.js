
var WebSocket = require('ws');
var net = require('net');

var wss = new WebSocket.Server({ port: 5000 });
wss.on('connection', ws => {
	console.log('client connected');
	var server = net.createServer((socket) =>{
		var remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
		console.log('new client connection from %s' + remoteAddress);

		ws.on('message', (event)=>{
			socket.write(Buffer.from(event));
		});
		socket.on('data', (data)=>{
			console.log(data)
			ws.send(data);

		});
		socket.on('error', (error)=>{
			console.error(error);
		});

	});
	server.listen(25565);
});

