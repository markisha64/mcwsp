function globcon(){
	if (hostedConnected == false){
		var gcip = document.getElementById("i").value;
		hostserv = new WebSocket(gcip);
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
				console.log("G -> L");
				console.log(event.data)
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
			if (hostedConnected == false){
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
function conmc(){
	if (serverConnected == false){
		hostserv.send("Game client connected:"+document.getElementById('a').value);
	}
}