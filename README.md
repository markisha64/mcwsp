# mcwsp
Minecraft web socket proxy, designed for use around a firewall that doesn't allow java.

Basic chart
Minecraft client <---> local js server <---> browser <---> hosted node server <---> Minecraft server

Hosted.js hosts a webserver over HTTP / HTTPS.
Browser connects to webserver and upgrades connection.
Browser also connects to local.js.
Minecraft client connects to local.js.

To get started pull the repository form GitHub on the server you wish to run the hosted server.
Initialize npm.
```
npm i
```

```
cd src
node hosted.js
```
By default hosted server runs on port 80.

Webserver serves files from the static folder index.html, browser.js and style.css or any other file you place inside the static folder.
On the device you plan to play minecraft you connect via browser to the server and press connect on hosted websocket.

Download Nodejs, npm and pull MCWSP from GitHub
Guide to setup node and npm with no admin rights
https://theshravan.net/blog/how-to-use-node-and-npm-without-installation-or-admin-rights/

```
npm i
node local.js
```

By default local server runs on port 25565
Next step is to connect the local websocket via browser interface.

Type in the Minecraft server adress you wish to play on.
If both websockets are connected you can connect your Minecraft client to localhost and you'll be playing on desired server.

For extra control you can use -secure , -auth , -port and -wsport command line arguments

-secure
```
node hosted.js -secure <key path> <certificate path>
```
Secure lets you run the server on HTTPS instead of HTTP

-auth
```
node hosted.js -auth <keyword>
```

Note: auth isn't mean't to be full on security, it's designed to stop unauthorized users to connect their websocket and is beatable via MITM attack.

-port
```
node hosted.js -port <desired port>
```
or
```
node local.js -port <desired port>
```

Makes the server run on the desired port.

-wsport
```
node local.js -wsport <desired port>
```
Makes the local websocket server run on desired port.

Useful in cases where port is already in use ie. 80, 25565 or 5000.
