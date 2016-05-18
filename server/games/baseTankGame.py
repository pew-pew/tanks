import json
from communication import *

class BaseTankGame:
	class Tank:
		def __init__(self, x, y):
			self.x = x
			self.y = y

		def canbe(self, x, y, level):
			if x < 2 or y < 2 or x > len(level["field"]) - 3 or y > len(level["field"][x]) - 3:
				return False
			for iterX in range(x - 2, x + 3):
				for iterY in range(y - 2, y - 3):
					if (level["palette"][level["field"][iterX][iterY]] != None):
						return False
			return True
		
		def get_bounds(self):
			return ((-2, 2), (-2, 2))

		def get_destination(self, direction):
			if direction == 'up':
				return (0, -1)
			elif direction == 'left':
				return (-1, 0)
			elif direction == 'right':
				return (1, 0)
			elif direction == 'down':
				return (0, 1)
			else:
				return (0, 0)

		def cango(self, direction, level):
			if direction == 'up':
				return self.canbe(self.x, self.y - 1, level)
			elif direction == 'left':
				return self.canbe(self.x - 1, self.y, level)
			elif direction == 'right':
				return self.canbe(self.x + 1, self.y, level)
			elif direction == 'down':
				return self.canbe(self.x, self.y + 1, level)
			else:
				return self.canbe(self.x, self.y, level)

		def act(self):
			return {"x": self.x, "y": self.y, "sprite": "resources/entities/tank0.png", "dir": 0}

	DEFAULT_MAP = "maps/test_board.txt"
	TICK_RATE = 20
	tanks = dict()
	def __init__(self, *args, **kwargs):
		mapfile = self.DEFAULT_MAP
		if ("map" in kwargs):
			print("GAME: Reading map {}".format(kwargs["map"]))
			mapfile = kwargs["map"]
		else:
			print("GAME: No map found, defaulting to {}".format(self.DEFAULT_MAP))
		try:
			self.level = self.process_map(json.loads(open(mapfile, "r").read()))
		except ValueError:
			print("GAME: Error loading map!")
			self.level = {}
		print(self.level)

	def can_coexist(i, j):
		pass

	def process_map(self, mapdict):
		return mapdict

	def do_tank_tick(self, user_inputs):
		for i in self.tanks:
			if user_inputs[i].up:
				self.tanks[i].direction = "up"
			elif user_inputs[i].down:
				self.tanks[i].direction = "down"
			elif user_inputs[i].left:
				self.tanks[i].direction = "left"
			elif user_inputs[i].right:
				self.tanks[i].direction = "right"
			else:
				self.tanks[i].direction = "pass"
		for i in self.tanks:
			self.tanks[i].willgo = self.tanks[i].cango(self.tanks[i].direction, self.level)
		update = True
		while update:
			update = False
			for i in self.tanks:
				for j in self.tanks:
					if i != j and self.tanks[i].willgo and self.tanks[j].willgo and not can_coexist(i, j):
						self.tanks[i].willgo = False
						self.tanks[j].willgo = False
						update = True
		for i in self.tanks:
			if self.tanks[i].willgo:
				self.tanks[i].x += self.tanks[i].get_destination(self.tanks[i].direction)[0]
				self.tanks[i].y += self.tanks[i].get_destination(self.tanks[i].direction)[1]
			
	def do_tick(self, user_inputs):
		self.do_tank_tick(user_inputs)
		# self.do_bullet_tick(user_inputs)
		response = {}
		for i in user_inputs:
			response[i] = {}
			response[i]["entities"] = dict((str(tank), self.tanks[tank].act()) for tank in self.tanks)
			if i not in self.tanks:
				response[i]["palette"] = self.level["palette"]
				response[i]["field"] = self.level["field"]
				self.tanks[i] = self.Tank(7, 7)
			response[i] = json.dumps(response[i])
		return response
