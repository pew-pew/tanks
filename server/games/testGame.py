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
        response["field"][1][1] = 1
        response["field"][1][2] = 1
        response["field"][2][1] = 1
        response["field"][2][2] = 1
        response["entities"] = {"testTank": {"x": 10, "y": 10, "sprite":"resources/entities/tank0.png", "dir": self.direction, "dirvel": 100}}
        oldresponse["entities"] = {"testTank": {"x": 10, "y": 10, "sprite":"resources/entities/tank0.png", "dir": self.direction, "dirvel": 100}}
        self.direction += 10
        self.direction %= 360
        if self.direction == 0:
            self.direction = 360
        responseMap = {}

        for game_input in game_inputs:
            if game_input in self.were:
                responseMap[game_input] = json.dumps(oldresponse)
            else:
                responseMap[game_input] = json.dumps(response)
                self.were.add(game_input)
        return responseMap
