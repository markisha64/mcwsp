
var http = require('http');
var WebSocket = require('ws');
var fs = require('fs');
var net = require('net');

http.createServer(function(req,res){
	fs.readFile(__dirname + '/index.html', function(err,data){
		if (err){
			res.writeHead(404);
			res.end(JSON.stringify(err));
			return;
		}
		res.writeHead(200);
		res.end(data);
	});
}).listen(80);

var wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
	console.log('client connected');

	var mcip = "mc.hypixel.net";
	var mcport = 25565;
	var connected = false;
	var isFirstConnection = true;
	var client;

	ws.on('message', (event) =>{
		if (typeof event == "string"){
			if (connected == false && event.includes("Game client connected:")){
				mcip = event
				mcip = mcip.substr(mcip.indexOf(':')+1);
				if (mcip.includes(':')){
					mcport = parseInt(mcip.substr(mcip.indexOf(':')+1));
					mcip = mcip.slice(0, mcip.indexOf(':'));
				}
				else{
					mcport = 25565;
				}
				console.log(mcip);
				console.log(mcport);
				mcip = "mc.hypixel.net";
				mcport = 25565;
				client = net.connect(mcport, mcip, ()=>{
					connected = true;
					console.log('Connected to mc server');
					ws.send("Connected to MC server");
					client.on('data', (data)=>{
						ws.send(data);
					});
					client.on('end', ()=>{
						console.log("Disconnected from mc server");
						ws.send("Disconnected from MC server");
					});
					client.on('error', (error)=>{
						console.error("Error: ",error);
						ws.send("Disconnected from MC server");
					})
				});
			}
			else{
				switch(event){
					case "Disconnect from MC server":
						client.end();
						isFirstConnection = true;
						connected = false;
						break;
				}
			}
		}
		else{
			if (isFirstConnection){
				data = Buffer.from(event);
				console.log("Modifying handshake");
		
				//Get the length of the first packet
				var firstPlen = data[0];   //d = [len, 0, ver, ver?, strlen, ...]

				//find string length varint
				//checking if the position of byte is correct
				var stringPos = 3;
				if(data[2]>127)stringPos++; 

				//Get length of old string
				var stringLen = data[stringPos];   
				
				//Calculate what the new packet length will be (remove old string, insert new string)
				var newPacketLength = firstPlen - stringLen + mcip.length;  
				
				//allocate space
				var newData = new Uint8Array(data.length - firstPlen + newPacketLength);

				//set new packet length prefix
				newData[0] = newPacketLength;

				//Copy version info & packet id
				for(var i = 1; i<stringPos; i++){
					newData[i] = data[i];
				}

				//copy new addr string
				newData[stringPos] = mcip.length;
				for(var i = 1; i<=mcip.length; i++){
					newData[i+stringPos] = mcip.charCodeAt(i-1);
				}

				//copy rest of data from d
				for(var i = mcip.length+stringPos+1; i<newData.length; i++){
					newData[i] = data[i-mcip.length+stringLen];
				}
				
				//Overwrite old data
				data = newData;
				client.write(data);
				isFirstConnection = false;
			}
			else{
				client.write(Buffer.from(event));	
			}
		}
	});
});
