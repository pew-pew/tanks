const CELL_SIZE = 8;
const DEFAULT_BG = "green";

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

var currentTime = new Date().getTime();

var Entity = function(x, y, spriteURI)
{
	this.oldX = x;
	this.oldY = y;
	this.newX = x;
	this.newY = y;
	this.vel = 0;
	this.oldDir = 0;
	this.newDir = 0;
	this.dirVel = 0;
	this.sprite = getImage(spriteURI);
	this.updateSprite = true;
	this.doDrawing = true;
	this.spriteCanvas = document.createElement("canvas");
	this.spriteContext = this.spriteCanvas.getContext("2d")

	// Setting the width/height of the canvas. 
	
	this.spriteCanvas.width = Math.ceil(1.5 * this.sprite.height); 
	this.spriteCanvas.height = Math.ceil(1.5 * this.sprite.height + this.sprite.width / this.sprite.height);
	
	this.update = function()
	{
		if (this.oldDir != this.newDir)
		{
			this.updateSprite = true;
		}

		var delta = new Date().getTime() - currentTime;
		if (delta >= this.vel)
		{
			this.oldX = this.newX;
			this.oldY = this.newY;
			this.vel = 0
		}
		else
		{
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
		this.update();
		if (this.doDrawing)
		{
			if (this.updateSprite)
			{
				this.drawSprite();
			}
			try
			{
				context.drawImage(this.spriteCanvas, CELL_SIZE * this.oldX, CELL_SIZE * this.oldY);
			}
			catch (e)
			{
				console.log(e);
				this.drawSprite();
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
	this.field = []; 
	this.entities = {};
	this.context = undefined;
	this.doDrawing = true;
	this.bgColor = DEFAULT_BG;
	// Makes entities act

	this.act = function(id, action)
	{
		if (!(id in this.entities))
		{
			this.entities[id] = new Entity(action["x"], action["y"], action["sprite"])
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
			this.entities[id].sprite.src = action["sprite"];
		}
	}

	// Drawing functions: draws a lone tile

	this.drawTile = function(x, y, context)
	{

		// First, we find the appropriate cutout by looking at our neighbours.

		// The neighbour order is:  Up     Down   Left   Right
		
		// The cutout goes like

		//#<->
		//^╔═╗
		//|║╳║
		//V╚═╝

		var mytype = this.field[x][y];

		// Optimization for air

		if (this.palette[mytype] === null)
		{
			return;
		}

		var neighbours = [];

		neighbours[0] = (y != 0 && this.field[x][y - 1] == mytype);

		neighbours[1] = (y != this.field[x].length - 1  && this.field[x][y + 1] == mytype);

		neighbours[2] = (x != 0 && this.field[x - 1][y] == mytype);

		neighbours[3] = (x != this.field.length - 1 && this.field[x + 1][y] == mytype);

		var cuty = [0, 1, 3, 2][2 * neighbours[0] + neighbours[1]];

		var cutx = [0, 1, 3, 2][2 * neighbours[2] + neighbours[3]];
		try
		{
			context.drawImage(this.palette[mytype], this.palette[mytype].width * cutx / 4, this.palette[mytype].height * cuty / 4, this.palette[mytype].width / 4, this.palette[mytype].height / 4, (x + 1) * CELL_SIZE - this.palette[mytype].width / 4, (y + 1) * CELL_SIZE - this.palette[mytype].height / 4, this.palette[mytype].width / 4, this.palette[mytype].height / 4);
		}
		catch(err)
		{
			//console.log(err);
		}
	}

	// Drawing functions: draws the entire level

	this.draw = function(context)
	{
		for (var x = 0; x < this.field.length; x++)
		{
			context.fillStyle = this.bgColor;
			context.fillRect(x * CELL_SIZE, 0, CELL_SIZE, this.field[x].length * CELL_SIZE);
		}
		if (this.field.length > 0)
		{
			for (var y = 0; y < this.field[0].length; y++)
			{
				for (var x = 0; x < this.field.length; x++)
				{
					this.drawTile(x, y, context);
				}
				for (var entity in this.entities)
				{
					if (Math.round(this.entities[entity].oldY) == y)
					{
						this.entities[entity].draw(context);
					}
				}
			}
			currentTime = new Date().getTime();
		}
	}

	this.drawLoop = function()
	{
		if (this.doDrawing)
		{
			this.draw(this.context);
		}
		requestAnimationFrame(this.drawLoop.bind(this))
	}

	this.setField = function(map)
	{
		this.field = map;
	}

	this.setBlock = function(x, y, type)
	{
		this.field[x][y] = type;
	}

	this.setPalette = function(URIs)
	{
		this.palette = []
		for (var i = 0; i < URIs.length; i++)
		{
			if (URIs[i] === null)
			{
				this.palette[i] = null;
			}
			else
			{
				this.palette[i] = getImage(URIs[i]);
			}
		}
	}

}
