const CELL_SIZE = 8;
const DEFAULT_BG = "green";
const DEFAULT_SPRITE = "resources/entities/1x1gridtest.png"

// Gotta have that - prevents lots of reloading not taken away by caching...
// ...and also gives the game an option to pre-load images.
var images = []
var imagesReady = []

var getImage = function(URI)
{
	if (URI in images)
	{
		return images[URI];
	}
	else
	{
		images[URI] = new Image();
		images[URI].src = URI;
		imagesReady[URI] = false;
		images[URI].onload = function()
		{
			imagesReady[this.src] = true;
		}
		return images[URI];
	}
}

var currentTime = Date.now();
var delta = 0;

var Entity = function(x, y, spriteURI)
{
	this.oldX = x;
	this.olderX = x;
	this.oldY = y;
	this.olderY = y;
	this.newX = x;
	this.newY = y;
	this.vel = 0;
	this.oldDir = 0;
	this.newDir = 0;
	this.dirVel = 0;
	this.sprite = getImage(spriteURI);
	this.size = 0;
	this.updateSprite = true;
	this.doDrawing = true;
	this.spriteCanvas = document.createElement("canvas");
	this.spriteContext = this.spriteCanvas.getContext("2d")

	// Setting the width/height of the canvas. 
	
	this.spriteCanvas.width = Math.ceil(1.5 * this.sprite.height); 
	this.spriteCanvas.height = Math.ceil(1.5 * this.sprite.height + this.sprite.width / this.sprite.height);
	
	this.update = function(delta)
	{
		if (this.oldDir != this.newDir)
		{
			this.updateSprite = true;
		}

		if (delta >= this.vel)
		{
			this.olderX = this.oldX;
			this.olderY = this.oldY;
			this.oldX = this.newX;
			this.oldY = this.newY;
			this.vel = 0
		}
		else
		{
			this.olderX = this.oldX;
			this.olderY = this.oldY;
			this.oldX = (delta * this.newX + (this.vel - delta) * this.oldX) / this.vel;
			this.oldY = (delta * this.newY + (this.vel - delta) * this.oldY) / this.vel;
			this.vel -= delta;
		}

		if (delta >= this.dirVel)
		{
			this.oldDir = Math.abs(this.newDir);
		}
		else
		{
			this.oldDir = (this.oldDir + (Math.abs(this.newDir) - this.oldDir + 1080 * Math.sign(this.newDir)) % 360 * delta / this.dirVel) % 360;
			this.dirVel -= delta;
		}
	}
	// Draws the entity's sprite on an internal canvas

	this.drawSprite = function()
	{
		if (!this.sprite.complete)
		{
			return;
		}
		else if (this.size == 0)
		{
			this.size = Math.ceil(0.75 * this.sprite.height / CELL_SIZE);
		}
		this.spriteCanvas.width = this.spriteCanvas.width;
		this.spriteContext.translate(this.spriteCanvas.width / 2, this.spriteCanvas.height - this.spriteCanvas.width / 2);
		for (var layer = 0; layer < this.sprite.width / this.sprite.height; layer++)
		{
			this.spriteContext.rotate(this.oldDir * Math.PI / 180);
			this.spriteContext.drawImage(this.sprite, this.sprite.height * layer, 0, this.sprite.height, this.sprite.height, -this.sprite.height / 2, -this.sprite.height / 2, this.sprite.height, this.sprite.height);
			this.spriteContext.rotate(-this.oldDir * Math.PI / 180);
			this.spriteContext.translate(0, -1);
		}
		this.updateSprite = false;
	}

	// Draws the entity on the given context

	this.draw = function(context)
	{
		if (this.doDrawing)
		{
			if (!this.sprite.complete)
			{
				this.updateSprite = true;
				return;
			}
			else if (this.updateSprite)
			{
				this.drawSprite();
			}
			try
			{
				context.drawImage(this.spriteCanvas, CELL_SIZE * this.oldX - this.spriteCanvas.width / 2 + CELL_SIZE / 2, CELL_SIZE * this.oldY - this.spriteCanvas.height + this.spriteCanvas.width / 2 + CELL_SIZE / 2);
			}
			catch (e)
			{
				this.spriteCanvas = document.createElement("canvas");
				this.spriteCanvas.width = Math.ceil(1.5 * this.sprite.height); 
				this.spriteCanvas.height = Math.ceil(1.5 * this.sprite.height + this.sprite.width / this.sprite.height);
				this.updateSprite = true;
				this.spriteContext = this.spriteCanvas.getContext("2d")
			}
		}
	}
}

// Apparently, ECMAScript 6, which is literally the JS standard, isn't implemented in most browsers.
// So mad right now.

// export default function Level()

// ^ Nice implementation >:[

Level = function()
{
	this.palette = [];
	this.tiles = [];
	this.field = []; 
	this.fieldUpdates = []; 
	this.fieldStatus = []; 
	this.toUpdate = [];
	this.toUpdateNext = [];
	this.entities = {};
	this.context = undefined;
	this.alive = true;
	this.doDrawing = true;
	this.bgColor = DEFAULT_BG;
	// Makes entities act

	this.act = function(id, action)
	{
		if (!(id in this.entities))
		{
			if ("sprite" in action)
			{
				this.entities[id] = new Entity(action["x"], action["y"], action["sprite"])
			}
			else
			{
				this.entities[id] = new Entity(action["x"], action["y"], DEFAULT_SPRITE)
			}
			if ("dir" in action)
			{
				this.entities[id].oldDir = action["dir"];
			}
		}
		if ('x' in action)
		{
			this.entities[id].newX = action["x"];
		}
		if ('y' in action)
		{
			this.entities[id].newY = action["y"];
		}
		if ('dir' in action)
		{
			this.entities[id].newDir = action["dir"];
		}
		if ('vel' in action)
		{
			this.entities[id].vel = action["vel"];
		}
		if ('dirvel' in action)
		{
			this.entities[id].dirVel = action["dirvel"];
		}
		if ('draw' in action)
		{
			this.entities[id].doDrawing = action["draw"];
		}
		if ('sprite' in action)
		{
			if (this.entities[id].sprite.src != action["sprite"])
			{
				this.sprite = getImage(action["sprite"]);
			}
		}
	}

	this.chopPalette = function(paletteno)
	{
		for (var i = 0; i < 4; i++)
		{
			for (var j = 0; j < 4; j++)
			{
				this.tiles[paletteno][i * 4 + j] = document.createElement("canvas");
				this.tiles[paletteno][i * 4 + j].width = this.palette[paletteno].width / 4;
				this.tiles[paletteno][i * 4 + j].height = this.palette[paletteno].height / 4;
				var tilecontext = this.tiles[paletteno][i * 4 + j].getContext("2d");
				tilecontext.drawImage(this.palette[paletteno], -this.palette[paletteno].width * i / 4, -this.palette[paletteno].height * j / 4);
			}
		}
	}

	// Drawing functions: draws a lone tile

	this.drawTile = function(x, y, context)
	{

		var mytype = this.field[x][y];

		// Optimization for air

		if (this.palette[mytype] === null)
		{
			return;
		}

		// Wait until it's complete before drawing

		if (!this.palette[mytype].complete)
		{
			this.toUpdateNext[x] = true;
			return;
		}

		// Do we even have a freshly diced palette?

		if (this.tiles[mytype].length == 0)
		{
			this.chopPalette(mytype);
		}

		if (this.fieldUpdates[x][y])
		{

			// Find the appropriate cutout by looking at our neighbours.
	
			// The neighbour order is:  Up     Down   Left   Right
			
			// The cutout goes like
	
			//#<->
			//^╔═╗
			//|║╳║
			//V╚═╝

			var neighbours = [];

			neighbours[0] = (y != 0 && this.field[x][y - 1] == mytype);

			neighbours[1] = (y != this.field[x].length - 1  && this.field[x][y + 1] == mytype);

			neighbours[2] = (x != 0 && this.field[x - 1][y] == mytype);

			neighbours[3] = (x != this.field.length - 1 && this.field[x + 1][y] == mytype);

			var cuty = [0, 1, 3, 2][2 * neighbours[0] + neighbours[1]];

			var cutx = [0, 1, 3, 2][2 * neighbours[2] + neighbours[3]];

			this.fieldStatus[x][y] = cutx * 4 + cuty;

			this.fieldUpdates[x][y] = false;
		}
		try
		{
			context.drawImage(this.tiles[mytype][this.fieldStatus[x][y]], (x + 1) * CELL_SIZE - this.tiles[mytype][this.fieldStatus[x][y]].width, (y + 1) * CELL_SIZE - this.tiles[mytype][this.fieldStatus[x][y]].height);
		}
		catch(err)
		{
			console.log(err);
			this.toUpdateNext[x] = true;
		}
	}

	// Drawing functions: draws the entire level

	this.draw = function(context)
	{
		delta = Date.now() - currentTime;
		for (var i in this.entities)
		{
			this.entities[i].update(delta);
			for (var j = Math.max(0, Math.floor(Math.min(this.entities[i].olderX, this.entities[i].oldX) - this.entities[i].size)); j <= Math.min(this.field.length, Math.ceil(Math.max(this.entities[i].olderX, this.entities[i].oldX) + this.entities[i].size)); j++)
			{
				this.toUpdate[j] = true;
			}
		}
		context.fillStyle = this.bgColor;
		for (var x = 0; x < this.field.length; x++)
		{
			if (this.toUpdate[x])
			{
				context.fillRect(x * CELL_SIZE, 0, CELL_SIZE, this.field[x].length * CELL_SIZE);
			}
		}
		if (this.field.length > 0)
		{
			for (var y = 0; y < this.field[0].length; y++)
			{
				for (var x = 0; x < this.field.length; x++)
				{
					if (this.toUpdate[x])
					{
						this.drawTile(x, y, context);
					}
				}
				for (var entity in this.entities)
				{
					if (Math.round(this.entities[entity].oldY) == y)
					{
						this.entities[entity].draw(context);
					}
				}
			}
			for (var x = 0; x < this.field.length; x++)
			{
				this.toUpdate[x] = this.toUpdateNext[x];
				this.toUpdateNext[x] = false;
			}
		}
		currentTime += delta;
	}

	this.setField = function(map)
	{
		this.field = map;
		this.toUpdate = [];
		this.toUpdateNext = [];
		for (var i = 0; i < this.field.length; i++)
		{
			this.fieldStatus[i] = [];
			this.fieldUpdates[i] = [];
			this.toUpdate[i] = true;
			this.toUpdateNext[i] = false;
			for (var j = 0; j < this.field[i].length; j++)
			{
				this.fieldStatus[i][j] = 0;
				this.fieldUpdates[i][j] = true;
			}
		}
	}

	this.setBlock = function(x, y, type)
	{
		this.field[x][y] = type;
		if (x > 0)
		{
			this.fieldUpdates[x - 1][y] = true;
			this.toUpdate[x - 1] = true;
		}
		if (y > 0)
		{
			this.fieldUpdates[x][y - 1] = true;
		}
		if (x < this.field.length - 1)
		{
			this.fieldUpdates[x + 1][y] = true;
			this.toUpdate[x + 1] = true;
		}
		if (y < this.field[x].length - 1)
		{
			this.fieldUpdates[x][y + 1] = true;
		}
		this.toUpdate[x] = true;
	}

	this.setPalette = function(URIs)
	{
		this.palette = []
		for (var i = 0; i < URIs.length; i++)
		{
			if (URIs[i] === null)
			{
				this.palette[i] = null;
				this.tiles[i] = null;
			}
			else
			{
				this.palette[i] = getImage(URIs[i]);
				this.tiles[i] = [];
			}
		}
	}

}
