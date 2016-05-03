const CELL_SIZE = 8

// Apparently, ECMAScript 6, which is literally the JS standard, isn't implemented in most browsers.
// So mad right now.

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
	this.sprite = new Image();
	this.sprite.src = spriteURI;
	this.updateSprite = true;
	this.spriteCanvas = document.createElement("canvas");
	this.spriteContext = this.spriteCanvas.getContext("2d")

	// Setting the width/height of the canvas. 
	
	this.spriteCanvas.width = Math.ceil(1.5 * this.sprite.height); 
	this.spriteCanvas.height = Math.ceil(1.5 * this.sprite.height + this.sprite.width / this.sprite.height);
	
	this.update = function()
	{
		// Stub :c
	}
	// Draws the sprite on an internal canvas

	this.drawSprite = function()
	{
		this.spriteCanvas.width = this.spriteCanvas.width;
		this.spriteContext.translate(this.spriteCanvas.width / 2, this.spriteCanvas.height - this.spriteCanvas.width / 2)
		for (var layer = 0; layer < this.sprite.width / this.sprite.height; layer++)
		{
			this.spriteContext.rotate(this.oldDir * Math.PI / 180);
			this.spriteContext.drawImage(this.sprite, this.sprite.height * layer, 0, this.sprite.height, this.sprite.height, -this.sprite.height / 2, -this.sprite.height / 2, this.sprite.height, this.sprite.height);
			this.spriteContext.rotate(-this.oldDir * Math.PI / 180);
			this.spriteContext.translate(0, -1);
		}
		this.updateSprite = false;
	}

	// Draws the sprite on the given context

	this.draw = function(x, y, context)
	{
		this.update();
		if (this.updateSprite)
		{
			this.drawSprite();
		}
		context.drawImage(this.spriteCanvas, x, y);
	}
}

// export default function Level()

// ^ Nice implementation >:[
Level = function()
{
	this.field = []
	this.entities = []
	this.act = function(id, action)
	{
		if (!(id in this.entities))
		{
			console.log(id)
			this.entities[id] = new Entity(action["x"], action["y"], action["sprite"])
			if ("dir" in action)
			{
				this.entities[id].oldDir = action["dir"];
			}
			console.log(this.entities)
		}
	}
	this.draw = function(x, y, context)
	{
		for (var entity in this.entities)
		{
			this.entities[entity].draw(x, y, context);
		}
	}

}
