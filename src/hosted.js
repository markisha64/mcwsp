
const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const net = require('net');
const url = require('url');

var secure = false;
var port = 80;
var args = process.argv.slice(2);
for (i=0;i<args.length;i++){
	if (args[i] == "-secure" && args.length - i > 1){
		fp1 = args[i+1];
		fp2 = args[i+2];
		try{
			if (fs.readFileSync(fp1) && fs.readFileSync(fp2)){
				secure = true;
			}
		}
		catch (err){
			console.log("Bad key/cert path");
		}
	}
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
}


var webserver;
var options = {};
if (secure == true){
	options = {
		key: fs.readFileSync(fp1),
		cert: fs.readFileSync(fp2)
	}
	webserver = https.createServer(options);
}
else{
	webserver = http.createServer({});
}
const wss = new WebSocket.Server({ server: webserver });



webserver.on('request', (req,res)=>{
	var q = url.parse(req.url, true);
  	var filename = "." + q.pathname;
  	if (filename == "./"){
  		fs.readFile('../static/index.html', (err,data)=>{
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
  		fs.readFile('../static/'+filename, function(err, data) {
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
				client = new net.Socket();
				client.connect(mcport, mcip, ()=>{
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
						client = 0;
						break;
				}
			}
		}
		else{
			if (isFirstConnection == true){
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

webserver.listen(port);
