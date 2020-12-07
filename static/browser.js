function hostcon(){
	if (hostedConnected == false){
		var host = window.location.hostname;
		var port = window.location.port;
		var hostip;
		if (window.location.protocol == "https:"){
			hostip = "wss://"+host+":"+port;
		}
		else{
			hostip = "ws://"+host+":"+port;
		}
		hostserv = new WebSocket(hostip);
		hostserv.onopen = function(event){
			console.log("Connected hosted WS");
			document.getElementById('hc').className="connected";
			hostedConnected = true;
		}
		hostserv.onmessage = function(event){
			if (typeof event.data == "string"){
				switch(event.data){
					case "Connected to MC server":
						document.getElementById("con").className="connected";
						serverConnected = true;
						break;
					case "Disconnected from MC server":
						document.getElementById("con").className="disconnected";
						serverConnected = false;
						break;
				}
			}
			else if (localConnected){
				locserv.send(event.data);
			}
			else{
				console.error("Can't redirect packets, local WS is disconnected");
			}
		}
		hostserv.onclose = function(event){
			document.getElementById('hc').className="disconnected";
			console.log("huh?")
			hostedConnected = false;
			console.log("Hosted WS disconnected");
		}
		hostserv.onerror = function(event){
			console.log("Error: ",event);
			document.getElementById('hc').className="disconnected";
			hostedConnected = false;
		}
	}
}
function loccon(){
	if (localConnected == false){
		locserv = new WebSocket("ws://localhost:5000");
		locserv.onopen = function(event){
			console.log("Connected local WS");
			document.getElementById('lc').className="connected";
			localConnected = true;
		}
		locserv.onmessage = function(event){
			if (typeof event.data == "string"){
				if (event.data.includes("Game client connected:")){
					hostserv.send("Game client connected:"+document.getElementById('a').value);
				}
				else{
					switch(event.data){
						case "MC client disconnected":
							dcmc();
							break;
					}
				}
			}
			else if (hostedConnected == false){
				console.error("Can't redirect packets, hosted WS is disconnected");
			}
			else{
				console.log("L -> G");
				hostserv.send(event.data);
			}
		}
		locserv.onclose = function(event){
			document.getElementById('lc').className="disconnected";
			localConnected = false;
			console.log("Local WS disconnected");
		}
		locserv.onerror = function(event){
			console.error("Error: ",event);
			document.getElementById('lc').className="disconnected";
			localConnected = false;
		}
	}
}
function dcmc(){
	if (serverConnected == true){
		hostserv.send("Disconnect from MC server");
		locserv.send("Disconnected from MC server");
	}
}