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

		hostserv = new WebSocket(hostip, "auth:"+document.getElementById('auth').value);
		document.getElementById('hc').innerHTML = "Connecting";
		connecting = true;

		hostserv.onopen = function(event){
			console.log("Connected hosted WS");
			document.getElementById('hosted').style.backgroundColor = "green";
			document.getElementById('hc').innerHTML = "Disconnect";
			hostedConnected = true;
			connecting = false;
		}

		setTimeout(()=>{
			if (hostedConnected == false && connecting == true){
				hostserv.close();
				document.getElementById('hc').value = "Connect";
				console.log("Connection timed out")
			}
		}, 5000);

		hostserv.onmessage = function(event){
			if (typeof event.data == "string"){
				switch(event.data){
					case "Connected to MC server":
						document.getElementById("mc").style.backgroundColor="green";
						serverConnected = true;
						break;
					case "Disconnected from MC server":
						document.getElementById("mc").style.backgroundColor="red";
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
			document.getElementById('hosted').style.backgroundColor="red";
			document.getElementById('hc').innerHTML = "Connect";
			hostedConnected = false;
			connecting = false;
			console.log("Hosted WS disconnected");
		}
		hostserv.onerror = function(event){
			document.getElementById('hosted').style.backgroundColor="red";
			document.getElementById('hc').innerHTML = "Connect";
			hostedConnected = false;
			connecting = false;
		}
	}
	else{
		hostserv.close();
		document.getElementById('hosted').style.backgroundColor="red";
		document.getElementById('hc').innerHTML = "Connect";
		hostedConnected = false;
	}
}
function loccon(){
	if (localConnected == false){
		locserv = new WebSocket("ws://localhost:5000");
		locserv.onopen = function(event){
			console.log("Connected local WS");
			document.getElementById('local').style.backgroundColor="green";
			document.getElementById('lc').innerHTML = "Disconnect";
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
							hostserv.send("Disconnect from MC server");
							document.getElementById('hosted').style.backgroundColor="red";
							document.getElementById('hc').innerHTML = "Connect";
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
			document.getElementById('local').style.backgroundColor="red";
			document.getElementById('lc').innerHTML = "Connect";
			localConnected = false;
			console.log("Local WS disconnected");
		}
		locserv.onerror = function(event){
			console.error("Error: ",event);
			document.getElementById('local').style.backgroundColor="red";
			document.getElementById('lc').innerHTML = "Connect";
			localConnected = false;
		}
	}
	else{
		locserv.close();
		document.getElementById('local').style.backgroundColor="red";
		document.getElementById('lc').innerHTML = "Connect";
		localConnected = false;
	}
}