const DEFAULT_PALETTE = [null, "resources/tilesets/metal.png","./resources/tilesets/destro.png"]

const POINT_BRUSH = -1;
const ERASER_BRUSH = -2;
const SELECTOR_BRUSH = -3;
var EditorSession = function(width, height)
{
	this.width = width;
	this.height = height;
	this.level = new Level();
	this.level.setPalette(DEFAULT_PALETTE);
	var map = [];
	for (var i = 0; i < width; i++)
	{
		map[i] = [];
		for (var j = 0; j < height; j++)
		{
			map[i][j] = 0;
		}
	}
	this.level.setField(map);
	this.level.context = document.getElementById("editorCanvas").getContext("2d");
	this.level.context.clearRect(0, 0, 800, 600);

	// Useful mouse info

	this.mouseDown = false;
	this.mouseWasDown = false;
	this.mouseX = 0;
	this.mouseY = 0;

	// The brush we're using: brush >= 0 - palette, brush <= 0 - entities

	this.brush = 1;

	// The next new point's number

	this.pointNo = 1;

	// The point we're editing: null if we aren't editing any

	this.currentPoint = null;
	


	this.setBrush = function(no)
	{
		this.brush = no;
		this.currentPoint = null;
	}
	
	var handleMouse = function(event)
	{
		this.mouseWasDown = this.mouseDown;
		if (event.type == "mousedown")
		{
			this.mouseDown = true;
		}
		if (event.type == "mouseup")
		{
			this.mouseDown = false;
		}
		this.mouseX = event.pageX - document.getElementById("editorCanvas").offsetLeft;
		this.mouseY = event.pageY - document.getElementById("editorCanvas").offsetTop;
		if (this.mouseDown)
		{
			if (this.brush == POINT_BRUSH)
			{
				if (!this.mouseWasDown)
				{
					this.level.act("point_" + this.pointNo, {"x": 
					Math.floor(this.mouseX / CELL_SIZE), "y": 
					Math.floor(this.mouseY / CELL_SIZE)});
					this.currentPoint = this.level.entities["point_" + this.pointNo]
					this.currentPoint.name = "point_" + this.pointNo;
					document.getElementById("pointName").value = "point_" + this.pointNo;
					this.pointNo++;
				}
			}
			else if (this.brush == ERASER_BRUSH)
			{
				if (!this.mouseWasDown)
				{
					for (var i in this.level.entities)
					{
						if ((this.level.entities[i].newX == Math.floor(this.mouseX / CELL_SIZE)) && (this.level.entities[i].newY == Math.floor(this.mouseY / CELL_SIZE)))
						{
							this.level.toUpdateNext[this.level.entities[i].newX] = true;
							delete this.level.entities[i];
						}
					}
				}
			}
			else if (this.brush == SELECTOR_BRUSH)
			{
				if (!this.mouseWasDown)
				{
					for (var i in this.level.entities)
					{
						if ((this.level.entities[i].newX == Math.floor(this.mouseX / CELL_SIZE)) && (this.level.entities[i].newY == Math.floor(this.mouseY / CELL_SIZE)))
						{
							this.currentPoint = this.level.entities[i];
							document.getElementById("pointName").value = this.level.entities[i].name;
						}
					}
				}
			}
			else
			{
				for (var iterX = Math.floor(this.mouseX / (5 * CELL_SIZE)) * 5; iterX < Math.floor(this.mouseX / (5 * CELL_SIZE)) * 5 + 5; iterX++)
				{
					for (var iterY = Math.floor(this.mouseY / (5 * CELL_SIZE)) * 5; iterY < Math.floor(this.mouseY / (5 * CELL_SIZE)) * 5 + 5; iterY++)
					{
						if (iterX < width && iterY < height && iterX >= 0 && iterY >= 0)
						{
							this.level.setBlock(iterX, iterY, this.brush);
						}
					}
				}
			}
		}
	}
	
	this.exportLevel = function()
	{
		var level = {};
		level.field = this.level.field;
		level.points = {};
		for (var i in this.level.entities)
		{
			level.points[this.level.entities[i].name] = {"x": this.level.entities[i].newX, "y": this.level.entities[i].newY};
		}
		console.log(level.points);
		level.palette = [];
		for (var i = 0; i < this.level.palette.length; i++)
		{
			if (this.level.palette[i] === null)
			{
				level.palette[i] = null;
			}
			else
			{
				level.palette[i] = this.level.palette[i].src;
			}
		}
		console.log(JSON.stringify(level));
		return "data:text," + JSON.stringify(level);
	}
	
	document.getElementById("editorCanvas").addEventListener("mousedown", handleMouse.bind(this));
	document.getElementById("editorCanvas").addEventListener("mouseup", handleMouse.bind(this));
	document.getElementById("editorCanvas").addEventListener("mousemove", handleMouse.bind(this));
}

l = new EditorSession(100, 75)

drawLoop = function()
{
	// Check if we are editing a point. If so, open the point menu

	if (l.currentPoint != null)
	{
		document.getElementById("pointEditor").style.visibility = "visible";
		l.currentPoint.name = document.getElementById("pointName").value;
	}
	else
	{
		document.getElementById("pointEditor").style.visibility = "hidden";
	}
	// Now, draw the level

	if (l.level.doDrawing)
	{
		l.level.draw(l.level.context);
	}
	if (l.level.alive)
	{
		requestAnimationFrame(drawLoop);
	}
}

drawLoop();

generateLevel = function()
{
	var width_to = +document.getElementById("width").value
	var height_to = +document.getElementById("height").value
	if (isNaN(width_to + height_to))
	{
		document.getElementById("error").textContent = "Width/height must be a number";
	}
	else
	{
		document.getElementById("error").textContent = "";
		l.level.alive = false;
		delete l;
		l = new EditorSession(width_to * 5, height_to * 5);
		requestAnimationFrame(function()
		{
			document.getElementById("editorCanvas").width =	document.getElementById("editorCanvas").width;
		});
	}
}

download = function()
{
	var file = document.getElementById("link");
	file.download = "level.txt";
	file.href = l.exportLevel();
	file.click();
}
