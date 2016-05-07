
String.prototype.format = function() {
    var formatted = this;
    for (var arg in arguments) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
}

TILE_SPRITE_PATH = ["./resources/air.png", "./resources/solid/solid{0}.png", "./resources/destro/destro{0}.png"]

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

Level = function(width, height)
{
	this.map = [];
	for (var y = 0; y < height; y++)
	{
		this.map[y] = [];
		for (var x = 0; x < width; x++)
		{
			this.map[y][x] = 0;
		}
	}

	this.draw = function()
	{
		for (var y = 0; y < height; y++)
		{
			
		}
	}
	//Stub :c
}

l = new Level(20, 15)

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
		l = new Level(width_to, height_to)
	}
}
