import json
from games.baseGame import Game

class TestGame(Game):
	
	direction = 0
	were = set()
	def do_tick(self, game_inputs):
		response = {}
		oldresponse = {}
		response["palette"] = [None, "resources/tilesets/destro.png"]
		response["field"] = [[0 for j in range(75)] for i in range(100)]
		response["entities"] = {"testTank": {"x": 10, "y": 10, "sprite":"resources/entities/tank0.png", "dir": self.direction, "dirvel": 100}}
		oldresponse["entities"] = {"testTank": {"x": 10, "y": 10, "sprite":"resources/entities/tank0.png", "dir": self.direction, "dirvel": 100}}
		response["blocks"] = [{'x': 2, 'y': 2, 'type': int(self.direction in range(1, 121))}, {'x': 4, 'y': 2, 'type': int(self.direction in range(121, 241))}, {'x': 6, 'y': 2, 'type': int(self.direction in range(241, 361))}]
		oldresponse["blocks"] = [{'x': 2, 'y': 2, 'type': int(self.direction in range(1, 121))}, {'x': 4, 'y': 2, 'type': int(self.direction in range(121, 241))}, {'x': 6, 'y': 2, 'type': int(self.direction in range(241, 361))}]
		if self.direction == 360:
			response["sounds"] = ["resources/sounds/tankShot.wav"]
			oldresponse["sounds"] = ["resources/sounds/tankShot.wav"]
		self.direction += 10
		self.direction %= 360
		if self.direction == 0:
			self.direction = 360
		responseMap = {}

		for game_input in game_inputs:
			response["screenshake"] = 10 * game_inputs[game_input].up
			oldresponse["screenshake"] = 10 * game_inputs[game_input].up
			if game_input in self.were:
				responseMap[game_input] = json.dumps(oldresponse)
			else:
				responseMap[game_input] = json.dumps(response)
				self.were.add(game_input)
		return responseMap
