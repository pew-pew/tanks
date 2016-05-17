// import Level from "level.js";

// ^ Wow rude.

const DEFAULT_ADDR = "127.0.0.1:13337";

var Session = function(URI)
{
	// Soundworks here

	this.audioContext = new AudioContext();
	this.sounds = {};
	var intensity = 0;
	this.getSound = function(URI, play)
	{
		if (URI in this.sounds)
		{
			if (play)
			{
				this.playSound(URI);
			}
			return;
		}
		var soundreq = new XMLHttpRequest();
		soundreq.open('GET', URI);
		soundreq.responseType = 'arraybuffer';
		soundreq.onload = function(e)
		{
			this.audioContext.decodeAudioData(soundreq.response, function(buffer)
			{
				this.sounds[URI] = buffer;
			}.bind(this), function(e)
			{
				console.log(e);
			});
			if (play)
			{
				this.playSound(URI);
			}
		}.bind(this);
		soundreq.send();
	}

	this.playSound = function(URI)
	{
		var src = this.audioContext.createBufferSource();
		src.buffer = this.sounds[URI];
		src.connect(this.audioContext.destination);
		src.start(0);
	}
	this.level = new Level();
	this.socket = new WebSocket(URI);
	onSocketOpen = function(event)
	{
		console.log("Connected!");
	}
	onSocketMessage = function(event)
	{ 
		var message = JSON.parse(event.data);
		if ("palette" in message)
		{
			this.level.setPalette(message["palette"]);
		}
		if ("field" in message)
		{
			this.level.setField(message["field"]);
		}
		if ("preload" in message)
		{
			if ("images" in message["preload"])
			{
				for (var i in message["preload"]["images"])
				{
					this.level.getImage(message["preload"]["images"][i]);
				}
			}
			if ("sounds" in message["preload"])
			{
				for (var i in message["preload"]["sounds"])
				{
					this.getSound(message["preload"]["sounds"][i], false);
				}
			}
		}
		if ("blocks" in message)
		{
			for (var block in message["blocks"])
			{
				newblock = message["blocks"][block];
				this.level.setBlock(newblock.x, newblock.y, newblock.type);
			}
		}
		if ("entities" in message)
		{
			for (var i in message["entities"])
			{
				this.level.act(i, message["entities"][i]);
			}
		}
		if ("sounds" in message)
		{
			for (var i in message["sounds"])
			{
				this.getSound(message["sounds"][i], true);
			}
		}
		if ("screenshake" in message)
		{
			document.getElementById("gameCanvas").style.marginTop = Math.round((Math.random() - 0.5) * 2 * message["screenshake"]).toString() + "px";
			document.getElementById("gameCanvas").style.marginLeft = Math.round((Math.random() - 0.5) * 2 * message["screenshake"]).toString() + "px";
		}
		else
		{
			document.getElementById("gameCanvas").style.marginTop = "0px";
			document.getElementById("gameCanvas").style.marginLeft = "0px";
		}
	}
	onSocketError = function(event)
	{
		alert("Error!");
	}
	onSocketClose = function(event)
	{
		alert("Disconnected!");
	}

	this.socket.addEventListener("open", onSocketOpen.bind(this));
	this.socket.addEventListener("message", onSocketMessage.bind(this));
	this.socket.addEventListener("erroe", onSocketError.bind(this));
	this.socket.addEventListener("close", onSocketClose.bind(this));

	this.keys = {16: false, 32: false, 37: false, 38: false, 39: false, 40: false};
	this.order = [38, 40, 37, 39, 32, 16]
	this.lastno = 0;
	this.handleKeys = function(event)
	{
		if (event.keyCode in this.keys)
		{
			this.keys[event.keyCode] = (event.type == "keydown");
		}
		var byteno = 0;
		for (var i in this.order)
		{
			byteno += this.keys[this.order[i]];
			byteno *= 2;
		}
		byteno *= 2;
		if (byteno != this.lastno)
		{
			this.socket.send(String.fromCharCode(byteno));
			this.lastno = byteno;
		}
	}

	addEventListener("keydown", this.handleKeys.bind(this));
	addEventListener("keyup", this.handleKeys.bind(this));

	this.level.context = document.getElementById("gameCanvas").getContext("2d");
	this.level.drawLoop();
}

var addr = DEFAULT_ADDR;
if (window.location.search.split("?").length > 1)
{
	addr = window.location.search.split("?")[1];
}
a = new Session("ws://" + addr);
