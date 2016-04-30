
// Format implementation - let's just pretend it's included in vanilla JS

String.prototype.format = function() {
    var formatted = this;
    for (var arg in arguments) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};


// Constants: cell size in pixels, number of tank skins

CELL_SIZE = 8;

SKINS_NO = 4;

DIRS = {"up": 0,
		"right": 90,
		"down": 180,
		"left": 270}

XMOVES = {"up": 0,
		"right": 1,
		"down": 0,
		"left": -1}

YMOVES = {"up": -1,
		"right": 0,
		"down": 1,
		"left": 0}

// File paths

TANK_SPRITE_PATH = "./images/tanks/tank{0}.png";
TILE_SPRITE_PATH = ["./images/air.png", "./images/solid/solid{0}.png", "./images/destro/destro{0}.png"]

// Load tank graphics

tankspritesready = SKINS_NO;
tankspritesnow = 0;
tanksprites = [];

for (var i = 0; i < SKINS_NO; i++)
{
	tanksprites[i] = new Image();
	tanksprites[i].onload = function()
	{
		tankspritesnow++;
	};
	tanksprites[i].src = TANK_SPRITE_PATH.format(i);
}

BULLET_SPRITE_PATH = "./images/bullet.png";

bulletspritesready = 1;
bulletspritesnow = 0;

bulletsprite = new Image();
bulletsprite.onload = function()
{
	bulletspritesnow++;
};
bulletsprite.src = BULLET_SPRITE_PATH;
	
// Load tile graphics

// Tile sprite bitmask cheat sheet:
// 8 - has connection up
// 4 - has connection down
// 2 - has connection left
// 1 - has connection right

tilespritesready = TILE_SPRITE_PATH.length * 16;
tilespritesnow = 0;
tilesprites = []

for (var tile in TILE_SPRITE_PATH)
{
	tilesprites[tile] = []
	for (var i = 0; i < 16; i++)
	{
		tilesprites[tile][i] = new Image();
		tilesprites[tile][i].onload = function()
		{
			tilespritesnow++;
		};
		tilesprites[tile][i].src = TILE_SPRITE_PATH[tile].format(i);
	}
}

// THE thing

Session = function(URI)
{
	// Canvas + its context (+ color - it's expensive to change) + server's URI
	
	this.canvas = document.getElementById("gameCanvas");
	this.context = this.canvas.getContext('2d');
	this.context.fillStyle = "green";
	this.URI = URI;
	
	// Current time - useful for delta timing!
	
	this.curTime = new Date().getTime()
	
	// Drawing functions: drawsprite draws sprite by its skin
	
	drawsprite = function(context, x, y)
	{
		var sprite_canvas = document.createElement('canvas')
		sprite_canvas.width = (this.width + this.height) * CELL_SIZE;
		sprite_canvas.height = (this.width + this.height) * CELL_SIZE + this.skin.width / (this.width * CELL_SIZE);
		var sprite_context = sprite_canvas.getContext('2d')
		sprite_context.translate(sprite_canvas.width / 2, sprite_canvas.height - sprite_canvas.width / 2)
		sprite_context.rotate(this.dir * Math.PI / 180);
		// Fancy 3D - drawing several layers on top of each other
		for (var i = 0; i < (this.skin.width / (this.width * CELL_SIZE)); i++)
		{
			sprite_context.translate(- this.width * CELL_SIZE / 2, - this.skin.height + this.height * CELL_SIZE / 2);
			sprite_context.drawImage(this.skin, i * this.width * CELL_SIZE, 0, this.width * CELL_SIZE, this.skin.height,
			0, 0, this.width * CELL_SIZE, this.skin.height);
			sprite_context.translate(this.width * CELL_SIZE / 2, this.skin.height - this.height * CELL_SIZE / 2);
			sprite_context.rotate(-this.dir * Math.PI / 180);
			sprite_context.translate(0, -1);
			sprite_context.rotate(this.dir * Math.PI / 180);
		}
		sprite_context.rotate(-this.dir * Math.PI / 180);
		// Rotation!
		context.drawImage(sprite_canvas, (x + (this.interpolx + this.x) * CELL_SIZE- sprite_canvas.width / 2 + .5) | 0, (y + (this.interpoly + this.y) * CELL_SIZE - sprite_canvas.height + sprite_canvas.width / 2 + .5) | 0)
	}
	
	// Drawing functions: drawsimplesprite draws sprite by its skin, but without fancy stuff - might fix everything
	
	drawsimplesprite = function(context, x, y)
	{
		context.drawImage(this.skin, x + this.x * CELL_SIZE - this.width * CELL_SIZE / 2, y + this.y * CELL_SIZE - this.skin.height + this.height * CELL_SIZE / 2);
	}
	
	this.toUpdate = []
	
	this.tilemap = [];
	
	// Drawing functions: drawtile draws tile with regard to its connections
	
	gendrawtile = function(me)
	{
		return function(context, x, y)
		{
			if (this.type == 0)
			{
				return;
			}
			else if (this.update == false)
			{
				this.drawsprite(context, x, y);
				return;
			}
			var spriteno = 0;
			if (this.y > 0 && me.tilemap[this.x][this.y - 1].type == this.type)
			{
				spriteno += 8;
			}
			if (this.y < me.tilemap[this.x].length - 1 && me.tilemap[this.x][this.y + 1].type == this.type)
			{
				spriteno += 4;
			}
			if (this.x > 0 && me.tilemap[this.x - 1][this.y].type == this.type)
			{
				spriteno += 2;
			}
			if (this.x < me.tilemap.length - 1 && me.tilemap[this.x + 1][this.y].type == this.type)
			{
				spriteno += 1;
			}
			this.skin = tilesprites[this.type][spriteno];
			this.update = false;
			this.drawsprite(context, x, y);
		}
	}
		
	this.Tile = function(type, x, y, me)
	{
		this.x = x;
		this.y = y;
		this.type = type;
		this.dir = 0;
		this.width = 1;
		this.height = 1;
		this.update = true;
		this.drawsprite = drawsimplesprite;
		this.draw = gendrawtile(me);
	}
	
	this.Tank = function(no, x, y)
	{
		this.interpolx = 0;
		this.interpoly = 0;
		this.x = x;
		this.y = y;
		this.dir = 90;
		this.dirto = 90;
		this.width = 5;
		this.height = 5;
		this.skin = tanksprites[no];
		this.draw = drawsprite;
		this.dodraw = true;
		this.vel = 0;
	}
	
	this.Bullet = function(no, x, y)
	{
		this.interpolx = 0;
		this.interpoly = 0;
		this.x = x;
		this.y = y;
		this.dir = 0;
		this.width = 1;
		this.height = 1;
		this.skin = bulletsprite;
		this.draw = drawsprite;
		this.vel = 0;
	}
	
	this.tanks = []
	this.bullets = {}
	var me = this;
	
	this.screenshake = 0;
	
	
	this.draw = function()
	{
		requestAnimationFrame(this.draw.bind(this));
		var newTime = new Date().getTime()
		var deltaTime = newTime - this.curTime;
		var totalUpdate = false;
		this.curTime = newTime;
		var scrx = 0;
		var scry = 0;
		if (this.screenshake > 0)
		{
			scrx = Math.round((Math.random() - 0.5) * this.screenshake * 2)
			scry = Math.round((Math.random() - 0.5) * this.screenshake * 2)
		}
		if (this.screenshake >= 0)
		{
			totalUpdate = true;
			this.screenshake--;
		}
		if (totalUpdate)
		{
			this.context.fillRect(0, 0, 1000, 1000)
			for (var ynow in this.tilemap[0])
			{
				for (var xnow in this.tilemap)
				{
					this.tilemap[xnow][ynow].draw(this.context, scrx, scry);
				}
				for (var tanknow in this.tanks)
				{
					if (this.tanks[tanknow].y == ynow && this.tanks[tanknow].dodraw)
					{
						var interpolation = this.tanks[tanknow].vel * deltaTime / 1000;
						this.tanks[tanknow].interpolx = Math.sign(this.tanks[tanknow].interpolx) * Math.min(1, Math.max(0, Math.abs(this.tanks[tanknow].interpolx) - interpolation))
						this.tanks[tanknow].interpoly = Math.sign(this.tanks[tanknow].interpoly) * Math.min(1, Math.max(0, Math.abs(this.tanks[tanknow].interpoly) - interpolation))
						if (this.tanks[tanknow].dir == this.tanks[tanknow].dirto)
						{
						}
						else if (interpolation * 90 >= Math.abs(this.tanks[tanknow].dirto - this.tanks[tanknow].dir))
						{
							this.tanks[tanknow].dir = this.tanks[tanknow].dirto;
						}
						else if ((this.tanks[tanknow].dirto - this.tanks[tanknow].dir + 360) % 360 > 180)
						{
							this.tanks[tanknow].dir = (this.tanks[tanknow].dir - 90 * interpolation + 360) % 360
						}
						else if ((this.tanks[tanknow].dirto - this.tanks[tanknow].dir + 360) % 360 < 180)
						{
							this.tanks[tanknow].dir = (this.tanks[tanknow].dir + 90 * interpolation + 360) % 360
						}
						else
						{
							this.tanks[tanknow].dir = this.tanks[tanknow].dirto;
						}
						this.tanks[tanknow].draw(this.context, scrx, scry);
					}
				}
				for (var bulletnow in this.bullets)
				{
					if (this.bullets[bulletnow].y == ynow)
					{
						var interpolation = this.bullets[bulletnow].vel * deltaTime / 1000;
						this.bullets[bulletnow].interpolx = Math.sign(this.bullets[bulletnow].interpolx) * Math.min(1, Math.max(0, Math.abs(this.bullets[bulletnow].interpolx) - interpolation))
						this.bullets[bulletnow].interpoly = Math.sign(this.bullets[bulletnow].interpoly) * Math.min(1, Math.max(0, Math.abs(this.bullets[bulletnow].interpoly) - interpolation))
						this.bullets[bulletnow].draw(this.context, scrx, scry);
					}
				}
			}
		}
		else
		{
			for (var tanknow in this.tanks)
			{
				for (var i = -Math.ceil(this.tanks[tanknow].width) - 1; i < Math.ceil(this.tanks[tanknow].width) + 2; i++)
				{
					this.toUpdate[Math.min(Math.max(0, this.tanks[tanknow].x + i), this.toUpdate.length - 1)] = true;
				}
			}
			for (var bulletnow in this.bullets)
			{
				for (var i = -Math.ceil(this.bullets[bulletnow].width) - 1; i < Math.ceil(this.bullets[bulletnow].width) + 2; i++)
				{
					this.toUpdate[Math.min(Math.max(0, this.bullets[bulletnow].x + i), this.toUpdate.length - 1)] = true;
				}
			}
			for (var xnow = 0; xnow < this.tilemap.length; xnow++)
			{
				if (this.toUpdate[xnow])
				{
					this.context.fillRect(CELL_SIZE * (xnow - 0.5), 0, CELL_SIZE, CELL_SIZE * this.tilemap[xnow].length)
				}
			}
			for (var ynow in this.tilemap[0])
			{
				for (var xnow = 0; xnow < this.tilemap.length; xnow++)
				{
					if (this.toUpdate[xnow])
					{
						this.tilemap[xnow][ynow].draw(this.context, scrx, scry);
					}
				}
				for (var tanknow in this.tanks)
				{
					if (this.tanks[tanknow].y == ynow && this.tanks[tanknow].dodraw)
					{
						var interpolation = this.tanks[tanknow].vel * deltaTime / 1000;
						this.tanks[tanknow].interpolx = Math.sign(this.tanks[tanknow].interpolx) * Math.min(1, Math.max(0, Math.abs(this.tanks[tanknow].interpolx) - interpolation))
						this.tanks[tanknow].interpoly = Math.sign(this.tanks[tanknow].interpoly) * Math.min(1, Math.max(0, Math.abs(this.tanks[tanknow].interpoly) - interpolation))
						if (this.tanks[tanknow].dir == this.tanks[tanknow].dirto)
						{
						}
						else if (interpolation * 90 >= Math.abs(this.tanks[tanknow].dirto - this.tanks[tanknow].dir))
						{
							this.tanks[tanknow].dir = this.tanks[tanknow].dirto;
						}
						else if ((this.tanks[tanknow].dirto - this.tanks[tanknow].dir + 360) % 360 > 180)
						{
							this.tanks[tanknow].dir = (this.tanks[tanknow].dir - 90 * interpolation + 360) % 360
						}
						else if ((this.tanks[tanknow].dirto - this.tanks[tanknow].dir + 360) % 360 < 180)
						{
							this.tanks[tanknow].dir = (this.tanks[tanknow].dir + 90 * interpolation + 360) % 360
						}
						else
						{
							this.tanks[tanknow].dir = this.tanks[tanknow].dirto;
						}
						this.tanks[tanknow].draw(this.context, scrx, scry);
					}
				}
				for (var bulletnow in this.bullets)
				{
					if (this.bullets[bulletnow].y == ynow)
					{
						var interpolation = this.bullets[bulletnow].vel * deltaTime / 1000;
						this.bullets[bulletnow].interpolx = Math.sign(this.bullets[bulletnow].interpolx) * Math.min(1, Math.max(0, Math.abs(this.bullets[bulletnow].interpolx) - interpolation))
						this.bullets[bulletnow].interpoly = Math.sign(this.bullets[bulletnow].interpoly) * Math.min(1, Math.max(0, Math.abs(this.bullets[bulletnow].interpoly) - interpolation))
						this.bullets[bulletnow].draw(this.context, scrx, scry);
					}
				}
			}
			for (var xnow = 0; xnow < this.tilemap.length; xnow++)
			{
				this.toUpdate[xnow] = false;
			}
		}
	}
	
	
	// Server functions
	
	var onServerOpen = function(event)
	{
		console.log("Connected!")
	}
	var onServerMessage = function(event)
	{
		//console.log("Message?")
		//console.log(event)
		var message = JSON.parse(event.data)
		for (var i = 0; i < message["tanks"].length; i++)
		{
			if (message["tanks"][i]["action"] == "spawn")
			{
				if (this.tanks.length >= i)
				{
					this.tanks[i] = new this.Tank(i, message["tanks"][i]["x"], message["tanks"][i]["y"]);
				}
				else
				{
					this.tanks[i].x = message["tanks"][i]["x"]
					this.tanks[i].y = message["tanks"][i]["y"]
				}
				this.tanks[i].dodraw = true;
				this.tanks[i].dirto = DIRS[message["tanks"][i]["dir"]];
			}
			else if (message["tanks"][i]["action"] == "die")
			{
				if (this.tanks[i] != false)
				{
					this.tanks[i].dodraw = false;
					this.screenshake = 7;
				}
			}
			else if (message["tanks"][i]["action"] == "move")
			{
				this.tanks[i].x += XMOVES[message["tanks"][i]["dir"]] * message["tanks"][i]["move"];
				this.tanks[i].y += YMOVES[message["tanks"][i]["dir"]] * message["tanks"][i]["move"];
				this.tanks[i].interpolx -= XMOVES[message["tanks"][i]["dir"]] * message["tanks"][i]["move"];
				this.tanks[i].interpoly -= YMOVES[message["tanks"][i]["dir"]] * message["tanks"][i]["move"];
				this.tanks[i].dirto = DIRS[message["tanks"][i]["dir"]];
				this.tanks[i].vel = message["tanks"][i]["vel"];
			}
		}
		for (var i in message["bullets"])
		{
			if (message["bullets"][i]["action"] == "spawn")
			{
				this.bullets[i] = new this.Bullet(i, message["bullets"][i]["x"], message["bullets"][i]["y"]);
				this.bullets[i].dir = DIRS[message["bullets"][i]["dir"]];
			}
			else if (message["bullets"][i]["action"] == "die")
			{
				if (this.bullets[i] != false)
				{
					delete this.bullets[i];
				}
			}
			else if (message["bullets"][i]["action"] == "move")
			{
				this.bullets[i].x += XMOVES[message["bullets"][i]["dir"]] * message["bullets"][i]["move"];
				this.bullets[i].y += YMOVES[message["bullets"][i]["dir"]] * message["bullets"][i]["move"];
				this.bullets[i].interpolx -= XMOVES[message["bullets"][i]["dir"]] * message["bullets"][i]["move"];
				this.bullets[i].interpoly -= YMOVES[message["bullets"][i]["dir"]] * message["bullets"][i]["move"];
				this.bullets[i].dir = DIRS[message["bullets"][i]["dir"]];
				this.bullets[i].vel = message["bullets"][i]["vel"];
			}
		}
		if (message["field"] != undefined)
		{
			this.tilemap = []
			this.toUpdate = []
			for (var i = 0; i < message["field"].length; i++)
			{
				this.tilemap[i] = []
				this.toUpdate[i] = true
				for (var j = 0; j < message["field"][i].length; j++)
				{
					this.tilemap[i][j] = new this.Tile(parseInt(message["field"][i][j]), i, j, this);
				}
			}
		}
		for (var i = 0; i < message["blocks"].length; i++)
		{
			this.screenshake = 5;
			for (var j = -1; j < 2; j++)
			{
				this.toUpdate[Math.min(Math.max(0, message["blocks"][i].x + j), this.toUpdate.length - 1)] = true;
			}
			this.tilemap[message["blocks"][i].x][message["blocks"][i].y].type = message["blocks"][i].id
			if (message["blocks"][i].y > 0)
			{
				this.tilemap[message["blocks"][i].x][message["blocks"][i].y - 1].update = true
			}
			if (message["blocks"][i].y < this.tilemap[message["blocks"][i].x].length)
			{
				this.tilemap[message["blocks"][i].x][message["blocks"][i].y + 1].update = true
			}
			if (message["blocks"][i].x > 0)
			{
				this.tilemap[message["blocks"][i].x - 1][message["blocks"][i].y].update = true
			}
			if (message["blocks"][i].x < this.tilemap.length - 1)
			{
				this.tilemap[message["blocks"][i].x + 1][message["blocks"][i].y].update = true
			}
		}
	}
	
	var onServerError = function(event)
	{
		console.log("Error!")
		console.log(event);
	}
	
	var onServerClose = function(event)
	{
		console.log("Disconnected!")
	}
	
	// Server socket
	
	this.serverconn = new WebSocket(URI);
	this.serverconn.onopen = onServerOpen;
	this.serverconn.onmessage = onServerMessage.bind(this);
	this.serverconn.onerror = onServerError;
	this.serverconn.onclose = onServerClose;
	
	// Buttons that you press
	
	this.keymask = {38: false, 40: false, 37: false, 39: false, 32: false}
	this.lastkey = 0;
	this.keysend = {38: 'up', 40: 'down', 37: 'left', 39: 'right', 0: 'pass'}
	this.lastsend = 0;
	
	this.updateKeys = function(event)
	{
		if (this.keymask.hasOwnProperty(event.keyCode))
		{
			if (event.type == "keydown" ^ this.keymask[event.keyCode])
			{
				this.keymask[event.keyCode] = !this.keymask[event.keyCode]
				if (event.keyCode == this.lastkey)
				{
					this.lastkey = 0;
					for (var key in this.keymask)
					{
						if (this.keymask[key] && key != 32)
						{
							this.lastkey = key;
							break;
						}
					}
				}
				if (event.keyCode != 32 && event.type == 'keydown')
				{
					this.lastkey = event.keyCode;
				}
				if (this.lastkey != this.lastsend || event.keyCode == 32)
				{
					this.serverconn.send(JSON.stringify({'dir': this.keysend[this.lastkey], 'fire': this.keymask[32]}));
					//console.log(JSON.stringify({'dir': this.keysend[this.lastkey], 'fire': this.keymask[32]}));
					this.lastsend = this.lastkey;
				}
			}
		}
	}
	requestAnimationFrame(this.draw.bind(this));
	addEventListener("keydown", this.updateKeys.bind(this));
	addEventListener("keyup", this.updateKeys.bind(this));
	
}
var addr = "127.0.0.1:13337"
if (window.location.search.split("?").length > 1)
{
	addr = window.location.search.split("?")[1]
}
ses = new Session("ws://{0}".format(addr));
ses.draw();
