// import Level from "level.js";

// ^ Wow rude.

var Session = function(URI)
{
	this.socket = new WebSocket(URI);
	socket.onOpen = function(event)
	{
		alert("Connected!");
	}
	socket.onMessage = function(event)
	{
		alert("Message!");
	}
	socket.onError = function(event)
	{
		alert("Error!");
	}
	socket.onClose = function(event)
	{
		alert("Disconnected!");
	}
}
var ctx = document.getElementById("gameCanvas").getContext("2d")

a = new Level();
a.act("test", {"x": 20, "y": 20, "dir": 90, "sprite": "resources/tanks/tank1.png"});
a.setPalette(["resources/tilesets/air.png", "resources/tilesets/metal.png"])
a.context = ctx;
a.drawLoop();
a.act("test", {"x": 22, "y": 20, "dir": 0, "vel": 1000, "dirvel": 1000, "sprite": "resources/tanks/tank1.png"});
