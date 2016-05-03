// import Level from "level.js";

// ^ Wow rude.

var ctx = document.getElementById("gameCanvas").getContext("2d")

a = new Level();
a.act("test", {"x": 20, "y": 20, "dir": 90, "sprite": "resources/tanks/tank1.png"});
a.draw(100, 100, ctx)
