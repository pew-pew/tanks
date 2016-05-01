Level = function(width, height)
{
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
