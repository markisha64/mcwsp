
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const net = require('net');
const url = require('url');

const webserver = http.createServer({});
const wss = new WebSocket.Server({ server: webserver });

webserver.on('request', (req,res)=>{
	var q = url.parse(req.url, true);
  	var filename = "." + q.pathname;
  	if (filename == "./"){
  		fs.readFile('index.html', (err,data)=>{
  			if (err) {
			res.writeHead(404, {'Content-Type': 'text/html'});
			return res.end("404 Not Found");
	    } 
	    res.writeHead(200, {'Content-Type': 'text/html'});
	    res.write(data);
	    return res.end();
  		});

  	}
  	else{
  		fs.readFile(filename, function(err, data) {
		    if (err) {
				res.writeHead(404, {'Content-Type': 'text/html'});
				return res.end("404 Not Found");
		    } 
		    res.writeHead(200, {'Content-Type': 'text/html'});
		    res.write(data);
		    return res.end();
		});
  	}
});

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
				isFirstConnection = true;
				mcip = event
				mcip = mcip.substr(mcip.indexOf(':')+1);
				if (mcip.includes(':')){
					mcport = parseInt(mcip.substr(mcip.indexOf(':')+1));
					mcip = mcip.slice(0, mcip.indexOf(':'));
				}
				else{
					mcport = 25565;
				}
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
						isFirstConnection = true;
						connected = false;
					});

					client.on('error', (error)=>{
						console.error("Error: ",error);
						client.destroy();
						ws.send("Disconnected from MC server");
						isFirstConnection = true;
						connected = false;
					});
				});
			}
			else{
				switch(event){
					case "Disconnect from MC server":
						client.destroy();
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

webserver.listen(80);
