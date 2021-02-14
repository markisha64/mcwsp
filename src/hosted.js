// initialization
const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const net = require('net');
const url = require('url');
var secure = false;
var port = 80; // webserver port
var auth = false;
var authKey;
// command line argument parsing parsing
var args = process.argv.slice(2);
for (i=0;i<args.length;i++){ 
	if (args[i] == "-secure" && args.length - i > 1){
		fp1 = args[i+1]; // file path 1 and 2
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
	if (args[i] == "-auth" && args.length != i){
		auth = true;
		authKey = String(args[i+1]);
	}
}
// webserver initialization
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
const wss = new WebSocket.Server({ noServer: webserver });


// static file serving
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
		    var filetype = filename.split(".").pop();
		    // content type
			switch(filetype){
				case "ico":
					res.writeHead(200, {'Content-Type': 'image/x-icon'});
		    		break;
		    	case "html":
		    		res.writeHead(200, {'Content-Type': 'text/html'});
		    		break;
		    	case "js":
		    		res.writeHead(200, {'Content-Type': 'text/javascript'});
		    		break;
		    	case "css":
		    		res.writeHead(200, {'Content-Type': 'text/css'});
		    		break;
		    	default:
		    		res.writeHead(200, {'Content-Type': 'text/plain'});
		    		break;
		    }
		    res.write(data);
		    return res.end();
		});
  	}
});


// upgrade handler / auth
var blocked = {}; // object that contains blocked adresses
webserver.on('upgrade', (request, socket, head)=>{
	if (auth){
		var clientIp = socket.remoteAddress;
		console.log(clientIp);
		if (blocked.hasOwnProperty(clientIp) && blocked[clientIp]["state"] == "blocked"){
			console.log("Connection refused")
			socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
		    socket.destroy();
			return;
		}
		var key = request.headers['sec-websocket-protocol'];
		if (key.includes("auth:")){
			key = key.substr(key.indexOf(':')+1);
			if (key == authKey){
				wss.handleUpgrade(request, socket, head, (ws)=>{
					wss.emit('connection', ws);
				});
			}
			else{
				if (blocked.hasOwnProperty(clientIp)){
					var attempts = blocked[clientIp]["attempts"];
					if (attempts > 3){
						blocked[clientIp]["state"] = "blocked";
						setTimeout((cl)=>{
							blocked[cl]["state"] = "allowed";
						}, (30 * (2**(attempts - 4)))*1000, clientIp);
					}
					blocked[clientIp]["attempts"] += 1;
					console.log("Connection refused");
					socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
				    socket.destroy();
					return;
				}
				else{
					// creating object
					var built = {
						'attempts': 1,
						'state': 'allowed'
					};
					// inserting object
					blocked[clientIp] = built;
					socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
				    socket.destroy();
					return;
				}
			}
		}
		else{
			console.log("Connection refused")
			socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
		    socket.destroy();
			return;
		}
	}
	else{
		wss.handleUpgrade(request, socket, head, (ws)=>{
			wss.emit('connection', ws);
		});
	}
});

// websocket server handler
wss.on('connection', ws => {
	console.log('client connected');

	// websocket init
	var mcip = "mc.hypixel.net";
	var mcport = 25565;
	var connected = false;
	var isFirstConnection = true;
	var client;

	// message handler
	ws.on('message', (event) =>{
		// checks if event is a string
		if (typeof event == "string"){ 
			// checks if it's connected to Minecraft and if the message contains "Game client connected:" as 
			// that's the message that contains the Minecraft server ip 
			if (connected == false && event.includes("Game client connected:")){
				// setting this to true makes the next packet (assumed handshake packet) get modified
				isFirstConnection = true;
				// parsing ip and port from string
				mcip = event
				mcip = mcip.substr(mcip.indexOf(':')+1);
				if (mcip.includes(':')){
					mcport = parseInt(mcip.substr(mcip.indexOf(':')+1));
					mcip = mcip.slice(0, mcip.indexOf(':'));
				}
				else{
					mcport = 25565;
				}
				// creating socket that connects to Minecraft server and connecting it with on connect handler
				client = new net.Socket();
				client.connect(mcport, mcip, ()=>{ // <-- on connect handler
					connected = true; // connected to Minecraft server
					console.log('Connected to mc server');
					// sending message to browser so it knows Minecraft server is connected
					ws.send("Connected to MC server");
					// sends data from from Minecraft server to browser
					client.on('data', (data)=>{
						ws.send(data);
					});

					// rudimentary socket close handling 
					client.on('end', ()=>{
						console.log("Disconnected from mc server");
						ws.send("Disconnected from MC server");
						isFirstConnection = true;
						connected = false;
					});

					// rudimentary error close handling
					client.on('error', (error)=>{
						console.error("Error: ",error);
						ws.send("Disconnected from MC server");
						client.destroy();
						isFirstConnection = true;
						connected = false;
					});
				});
			}
			else{
				// handling messages from browser (currently only 1)
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
			// handshale modification, special thanks to Azurethi
			if (isFirstConnection == true){
				data = Buffer.from(event);
		
				//Get the length of the first packet
				var firstPlen = data[0];   //d = [len, 0, ver, ver?, strlen, ...]

				//find string length varint
				//checking if the position of byte is correct, I should turn this into an actual loop but im lazy
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
				// send packets from browser to Minecraft server
				client.write(Buffer.from(event));	
			}
		}
	});

	// rudimentary websocket close handling
	ws.on("close", ()=>{
		ws.terminate();
		if (connected){
			client.destroy();
		}
		console.log("client disconnected");
	});

	// rudimentary websocket error handling (close and ignore)
	ws.on("error", (err)=>{
		ws.terminate();
		if (connected){
			client.destroy();
		}
		console.log(err);
	});
});

// if webserver error retries starting on same port every minute
webserver.on("error", (err)=>{
	console.log(err);
	setTimeout(function(){
		webserver.listen(port);
	}, 60000);
});

// initial server start
webserver.listen(port);
