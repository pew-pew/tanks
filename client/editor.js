const DEFAULT_PALETTE = ["./resources/tilesets/air.png","./resources/tilesets/metal.png","./resources/tilesets/destro.png"]

var EditorSession = function(width, height)
{
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
	this.mouseDown = false;
	this.mouseX = 0;
	this.mouseY = 0;
	this.brush = 1;
	
	this.setBrush = function(no)
	{
		this.brush = no;
	}
	
	var handleMouse = function(event)
	{
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
			for (var iterX = Math.floor(this.mouseX / (5 * CELL_SIZE)) * 5; iterX < Math.floor(this.mouseX / (5 * CELL_SIZE)) * 5 + 5; iterX++)
			{
				for (var iterY = Math.floor(this.mouseY / (5 * CELL_SIZE)) * 5; iterY < Math.floor(this.mouseY / (5 * CELL_SIZE)) * 5 + 5; iterY++)
				{
					this.level.field[iterX][iterY] = this.brush;
				}
			}
		}
	}
	
	this.exportLevel = function()
	{
		var data = "data:text/plain;charset=utf-8,"
		for (var i = 0; i < this.level.field.length; i++)
		{
			for (var j = 0; j < this.level.field[i].length; j++)
			{
				data += this.level.field[i][j];
			}
			data += "%0D";
		}
		console.log(data);
		return data;
	}
	
	document.getElementById("editorCanvas").addEventListener("mousedown", handleMouse.bind(this));
	document.getElementById("editorCanvas").addEventListener("mouseup", handleMouse.bind(this));
	document.getElementById("editorCanvas").addEventListener("mousemove", handleMouse.bind(this));
	this.level.drawLoop();
}

l = new EditorSession(100, 75)

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
		l = new EditorSession(width_to * 5, height_to * 5)
	}
}

download = function()
{
	var file = document.getElementById("link");
	file.download = "level.txt";
	file.href = l.exportLevel();
	file.click();
}
