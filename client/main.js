
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
	// Canvas + its context + server's URI
	
	this.canvas = document.getElementById("gameCanvas");
	this.context = this.canvas.getContext('2d');
	this.URI = URI;
	
	// Drawing functions: drawsprite draws sprite by its skin
	
	drawsprite = function(context, x, y)
	{
		// Rotation!
		context.translate(x + this.x * CELL_SIZE, y + this.y * CELL_SIZE);
		context.rotate(this.dir * Math.PI / 180);
		if (this.skin.width != 8)
		{
			console.log(this.skin.width);
		}
		// Fancy 3D - drawing several layers on top of each other
		for (var i = 0; i < (this.skin.width / (this.width * CELL_SIZE)); i++)
		{
			context.translate(- this.width * CELL_SIZE / 2, - this.skin.height + this.height * CELL_SIZE / 2);
			context.drawImage(this.skin, i * this.width * CELL_SIZE, 0, this.width * CELL_SIZE, this.skin.height,
			0, 0, this.width * CELL_SIZE, this.skin.height);
			context.translate(this.width * CELL_SIZE / 2, this.skin.height - this.height * CELL_SIZE / 2);
			context.rotate(-this.dir * Math.PI / 180);
			context.translate(0, -1);
			context.rotate(this.dir * Math.PI / 180);
		}
		context.rotate(-this.dir * Math.PI / 180);
		context.translate(- x - this.x * CELL_SIZE, - y - this.y * CELL_SIZE + this.skin.width / (this.width * CELL_SIZE));
	}
	
	// Drawing functions: drawsimplesprite draws sprite by its skin, but without fancy stuff - might fix everything
	
	drawsimplesprite = function(context, x, y)
	{
		context.drawImage(this.skin, x + this.x * CELL_SIZE - this.width * CELL_SIZE / 2, y + this.y * CELL_SIZE - this.skin.height + this.height * CELL_SIZE / 2);
	}
	
	this.fieldwidth = 75;
	this.fieldheight = 75;
	
	
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
	
	for (var i = 0; i < this.fieldheight; i++)
	{
		this.tilemap[i] = [];
		for (var j = 0; j < this.fieldwidth; j++)
		{
			//var thistype = ((i >= 15 && i <= 20 && j >= 15 && j <= 20) ? 1 : ((j >= 8 && j <= 12) || Math.random() > 0.3) ? 0 : 2)
			this.tilemap[i][j] = new this.Tile(0, i, j, this);
		}
	}
	
	this.Tank = function(no, x, y)
	{
		this.interpolx = 0;
		this.interpoly = 0;
		this.x = x;
		this.y = y;
		this.dir = 90;
		this.width = 5;
		this.height = 5;
		this.skin = tanksprites[no];
		this.draw = drawsprite;
	}
	
	this.tanks = [new this.Tank(0, 10, 10), new this.Tank(1, 20, 10), new this.Tank(2, 30, 10), new this.Tank(3, 40, 10)]
	var me = this;
	
	this.screenshake = 0;
	
	
	this.draw = function()
	{
		var scrx = 0;
		var scry = 0;
		if (this.screenshake > 0)
		{
			scrx = (Math.random() - 0.5) * this.screenshake
			scry = (Math.random() - 0.5) * this.screenshake
			this.screenshake--;
		}
		this.context.fillStyle = "green";
		this.context.fillRect(0, 0, 1000, 1000)
		for (var ynow in this.tilemap[0])
		{
			for (var xnow in this.tilemap)
			{
				this.tilemap[xnow][ynow].draw(this.context, scrx, scry);
			}
			for (var tanknow in this.tanks)
			{
				if (this.tanks[tanknow].y == ynow)
				{
					this.tanks[tanknow].draw(this.context, scrx, scry);
				}
			}
		}
	}
	
	
	// Server functions
	
	var onServerOpen = function(event)
	{
		console.log("Connected!!!  !!")
	}
	var genOnServerMessage = function(me)
	{
		return function(event)
		{
			console.log("Message?")
			console.log(event)
			var message = JSON.parse(event.data)
			for (var i in message["tanks"])
			{
				if (message["tanks"][i]["action"] == "spawn")
				{
					me.tanks[i] = new me.Tank(i, message["tanks"][i]["x"], message["tanks"][i]["y"]);
					me.tanks[i].dir = DIRS[message["tanks"][i]["dir"]];
				}
				else if (message["tanks"][i]["action"] == "die")
				{
					me.tanks[i] = false;
				}
				else if (message["tanks"][i]["action"] == "move")
				{
					me.tanks[i].x += XMOVES[message["tanks"][i]["dir"]] * message["tanks"][i]["move"];
					me.tanks[i].y += YMOVES[message["tanks"][i]["dir"]] * message["tanks"][i]["move"];
					me.tanks[i].dir = DIRS[message["tanks"][i]["dir"]];
				}
			}
			me.draw();
		}
	}
	
	var onServerError = function(event)
	{
		console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHHHHHHHHHHHH")
		console.log(event);
	}
	
	var onServerClose = function(event)
	{
		console.log("Disconnect DDD::")
	}
	
	// Server socket
	
	this.serverconn = new WebSocket(URI);
	this.serverconn.onopen = onServerOpen;
	this.serverconn.onmessage = genOnServerMessage(this);
	this.serverconn.onerror = onServerError;
	this.serverconn.onclose = onServerClose;
	
	// Buttons that you press
	
	this.keymask = {'ArrowUp': false, 'ArrowDown': false, 'ArrowLeft': false, 'ArrowRight': false, ' ': false}
	this.lastkey = 'NoArrow';
	this.keysend = {'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right', 'NoArrow': 'pass'}
	this.lastsend = 'NoArrow';
	
	this.genUpdateKeys = function(me)
	{
		return function(event)
		{
			if (me.keymask.hasOwnProperty(event.key))
			{
				if (event.type == "keydown" ^ me.keymask[event.key])
				{
					//console.log("!")
					me.keymask[event.key] = !me.keymask[event.key]
					if (event.key == me.lastkey)
					{
						me.lastkey = 'NoArrow';
						for (var key in me.keymask)
						{
							if (me.keymask[key] && key != ' ')
							{
								me.lastkey = key;
								break;
							}
						}
					}
					if (event.key != ' ' && event.type == 'keydown')
					{
						me.lastkey = event.key;
					}
					if (me.lastkey != me.lastsend || event.key == ' ')
					{
						me.serverconn.send(JSON.stringify({'dir': me.keysend[me.lastkey], 'fire': me.keymask[' ']}));
						console.log(JSON.stringify({'dir': me.keysend[me.lastkey], 'fire': me.keymask[' ']}));
						me.lastsend = me.lastkey;
					}
				}
			}
		}
	}
	
	addEventListener("keydown", this.genUpdateKeys(this));
	addEventListener("keyup", this.genUpdateKeys(this));
	
}
ses = new Session("ws://127.0.0.1:13337");
ses.draw();

rotate = function()
{
	for (var tank in ses.tanks)
	{
		//console.log("Tanks: {0}/{1}".format(tankspritesnow, tankspritesready))
		//console.log("Tiles: {0}/{1}".format(tilespritesnow, tilespritesready))
		ses.tanks[tank].dir+= 1;
		//ses.tanks[tank].x += 0.05;
	}
	ses.draw();
}

var red = false
/*addEventListener("keypress", function()
{
	if (!red)
	{
		//red = true;
		//rotate();
		setInterval(rotate, 20);
	}
	else
	{
		ses.screenshake = 20;
	}
})*/