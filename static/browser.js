
// initialization
var localConnected = false; // bool local WS connected
var hostedConnected = false; // bool hosted WS connected
var serverConnected = false; // bool minecraft server connected
var hostserv; // hosted WS object init
var locserv; // local WS object init

function hostcon(){
	if (hostedConnected == false){
		// grabs webserver adress and port
		var host = window.location.hostname;
		var port = window.location.port;
		var hostip;

		// checks if webserver is running on secure or not
		if (window.location.protocol == "https:"){
			hostip = "wss://"+host+":"+port;
		}
		else{
			hostip = "ws://"+host+":"+port;
		}

		// hosted webserver init
		var connecting = true; // bool connecting to hosted WS
		hostserv = new WebSocket(hostip, ["auth"+document.getElementById('auth').value]);
		document.getElementById('hc').innerHTML = "Connecting";
		
		// on connect handler
		hostserv.onopen = function(event){
			document.getElementById('hosted').style.backgroundColor = "green";
			document.getElementById('hc').innerHTML = "Disconnect";
			hostedConnected = true;
			connecting = false;
		}

		// hosted WS connection attempt timeout
		setTimeout(()=>{
			if (hostedConnected == false && connecting == true){
				hostserv.close();
				document.getElementById('hc').value = "Connect";
				console.alert("Connection attempt timed out!");
			}
		}, 5000);

		// hosted WS message handler
		hostserv.onmessage = function(event){
			if (typeof event.data == "string"){
				// handles non-packet message from hosted WS
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
			// if local WS connected redirect packet to local WS, else close hosted WS as it should not be running
			else if (localConnected){ 
				locserv.send(event.data);
			}
			else{
				hostserv.close();
			}
		}

		// rudimentary hosted WS close handling
		hostserv.onclose = function(event){
			document.getElementById('hosted').style.backgroundColor="red";
			document.getElementById('hc').innerHTML = "Connect";
			hostedConnected = false;
			connecting = false;
		}

		// rudimentary hosted WS error handling (close and ignore)
		hostserv.onerror = function(event){
			document.getElementById('hosted').style.backgroundColor="red";
			document.getElementById('hc').innerHTML = "Connect";
			hostedConnected = false;
			connecting = false;
		}
	}
	else{
		// close hosted WS 
		hostserv.close();
		document.getElementById('hosted').style.backgroundColor="red";
		document.getElementById('hc').innerHTML = "Connect";
		hostedConnected = false;
	}
}
function loccon(){
	if (localConnected == false){

		// local WS init
		var port = document.getElementById("lPort").value;
		
		locserv = new WebSocket("ws://localhost:" + port);

		// on connect handler
		// no timeout as I expect people to be able to connect to a local server .-.
		locserv.onopen = function(event){
			document.getElementById('local').style.backgroundColor="green";
			document.getElementById('lc').innerHTML = "Disconnect";
			localConnected = true;
		}

		// local WS message handler
		locserv.onmessage = function(event){
			// handles non-packet message from local WS
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
			// if hosted WS connected redirect packet to local WS, else tell user he didn't connect hosted WS
			else if (hostedConnected){
				hostserv.send(event.data);
			}
			else{
				console.alert("Can't redirect packets, hosted WS is disconnected, connect hosted WS!");
			}
		}

		// rudimentary local WS close handling
		locserv.onclose = function(event){
			document.getElementById('local').style.backgroundColor="red";
			document.getElementById('lc').innerHTML = "Connect";
			localConnected = false;
		}

		// rudimentary local WS error handling (close and ignore)
		locserv.onerror = function(event){
			document.getElementById('local').style.backgroundColor="red";
			document.getElementById('lc').innerHTML = "Connect";
			localConnected = false;
		}
	}
	else{
		// close local WS
		locserv.close();
		document.getElementById('local').style.backgroundColor="red";
		document.getElementById('lc').innerHTML = "Connect";
		localConnected = false;
	}
}