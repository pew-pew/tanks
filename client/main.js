// import Level from "level.js";

// ^ Wow rude.

const DEFAULT_ADDR = "127.0.0.1:13337";

var Session = function(URI)
{
	// Soundworks here

	this.audioContext = new AudioContext();
	this.sounds = {};
	var intensity = 0;
	this.canvas = document.getElementById("gameCanvas");
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
		this.message = JSON.parse(event.data);
		if ("palette" in this.message)
		{
			this.level.setPalette(this.message["palette"]);
		}
		if ("field" in this.message)
		{
			this.level.setField(this.message["field"]);
		}
		if ("preload" in this.message)
		{
			if ("images" in this.message["preload"])
			{
				for (var i in this.message["preload"]["images"])
				{
					this.level.getImage(this.message["preload"]["images"][i]);
				}
			}
			if ("sounds" in this.message["preload"])
			{
				for (var i in this.message["preload"]["sounds"])
				{
					this.getSound(this.message["preload"]["sounds"][i], false);
				}
			}
		}
		if ("blocks" in this.message)
		{
			for (var block in this.message["blocks"])
			{
				this.level.setBlock(this.message["blocks"][block].x, this.message["blocks"][block].y, this.message["blocks"][block].type);
			}
		}
		if ("entities" in this.message)
		{
			for (var i in this.message["entities"])
			{
				this.level.act(i, this.message["entities"][i]);
			}
		}
		if ("sounds" in this.message)
		{
			for (var i in this.message["sounds"])
			{
				this.getSound(this.message["sounds"][i], true);
			}
		}
		if ("screenshake" in this.message)
		{
			this.canvas.style.marginTop = Math.round((Math.random() - 0.5) * 2 * this.message["screenshake"]).toString() + "px";
			this.canvas.style.marginLeft = Math.round((Math.random() - 0.5) * 2 * this.message["screenshake"]).toString() + "px";
		}
		else
		{
			this.canvas.style.marginTop = "0px";
			this.canvas.style.marginLeft = "0px";
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
			event.preventDefault();
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

	this.level.context = this.canvas.getContext("2d");
}

var addr = DEFAULT_ADDR;
if (window.location.search.split("?").length > 1)
{
	addr = window.location.search.split("?")[1];
}
a = new Session("ws://" + addr);
drawLoop = function()
{
	if (a.level.doDrawing)
	{
		a.level.draw(a.level.context);
	}
	if (a.level.alive)
	{
		requestAnimationFrame(drawLoop);
	}
}
drawLoop();
