import json
from communication import *

class BaseTankGame:

	DEFAULT_MAP = "maps/test_board.txt"
	TICK_RATE = 45

	class Tank:

		MOVE_INTERVAL = 3

		def __init__(self, x, y):
			self.x = x
			self.y = y
			self.timeout = 0
			self.angle = 0
			self.oldangle = 0

		def canbe(self, x, y, level):
			if x < 2 or y < 2 or x > len(level["field"]) - 3 or y > len(level["field"][x]) - 3:
				return False
			for iterX in range(x - 2, x + 3):
				for iterY in range(y - 2, y + 3):
					if (level["palette"][level["field"][iterX][iterY]] != None):
						return False
			return True
		
		def get_bounds(self):
			return ((-2, 2), (-2, 2))

		def get_destination(self):
			if self.direction == 'up':
				return (0, -1)
			elif self.direction == 'left':
				return (-1, 0)
			elif self.direction == 'right':
				return (1, 0)
			elif self.direction == 'down':
				return (0, 1)
			else:
				return (0, 0)

		def cango(self, level):
			if self.timeout > 0:
				self.timeout -= 1
				return self.direction == "pass"
			if self.direction == 'up':
				return self.canbe(self.x, self.y - 1, level)
			elif self.direction == 'left':
				return self.canbe(self.x - 1, self.y, level)
			elif self.direction == 'right':
				return self.canbe(self.x + 1, self.y, level)
			elif self.direction == 'down':
				return self.canbe(self.x, self.y + 1, level)
			else:
				return self.canbe(self.x, self.y, level)

		def act(self):
			self.response = {"x": self.x, "y": self.y, "sprite": "resources/entities/tank0.png", "vel": 1000 * self.timeout / BaseTankGame.TICK_RATE}
			if (self.oldangle != self.angle):
				self.response["dir"] = self.angle
				if (self.oldangle - self.angle + 360) % 360 < 180:
					self.response["dir"] *= -1
				if (self.oldangle - self.angle + 360) % 360 == 180:
					self.response["dirvel"] = 0
				else:
					self.response["dirvel"] = 1000 * self.MOVE_INTERVAL / BaseTankGame.TICK_RATE
				self.oldangle = self.angle
			return self.response

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

	def can_coexist(self, i, j):
		ix1 = self.tanks[i].x + self.tanks[i].get_destination()[0] + self.tanks[i].get_bounds()[0][0]
		ix2 = self.tanks[i].x + self.tanks[i].get_destination()[0] + self.tanks[i].get_bounds()[0][1]
		iy1 = self.tanks[i].y + self.tanks[i].get_destination()[1] + self.tanks[i].get_bounds()[1][0]
		iy2 = self.tanks[i].y + self.tanks[i].get_destination()[1] + self.tanks[i].get_bounds()[1][1]
		jx1 = self.tanks[j].x + self.tanks[j].get_destination()[0] + self.tanks[j].get_bounds()[0][0]
		jx2 = self.tanks[j].x + self.tanks[j].get_destination()[0] + self.tanks[j].get_bounds()[0][1]
		jy1 = self.tanks[j].y + self.tanks[j].get_destination()[1] + self.tanks[j].get_bounds()[1][0]
		jy2 = self.tanks[j].y + self.tanks[j].get_destination()[1] + self.tanks[j].get_bounds()[1][1]
		if (ix1 >= jx1 and ix1 <= jx2) or (ix2 >= jx1 and ix2 <= jx2):
			if (iy1 >= jy1 and iy1 <= jy2) or (iy2 >= jy1 and iy2 <= jy2):
				return False
		return True

	def process_map(self, mapdict):
		return mapdict

	def do_tank_tick(self, user_inputs):
		for i in self.tanks:
			if user_inputs[i].up:
				self.tanks[i].direction = "up"
				self.tanks[i].angle = 360
			elif user_inputs[i].down:
				self.tanks[i].direction = "down"
				self.tanks[i].angle = 180
			elif user_inputs[i].left:
				self.tanks[i].direction = "left"
				self.tanks[i].angle = 270
			elif user_inputs[i].right:
				self.tanks[i].direction = "right"
				self.tanks[i].angle = 90
			else:
				self.tanks[i].direction = "pass"
		for i in self.tanks:
			self.tanks[i].willgo = self.tanks[i].cango(self.level)
		update = True
		while update:
			update = False
			for i in self.tanks:
				for j in self.tanks:
					if i != j and self.tanks[i].willgo and self.tanks[j].willgo and not self.can_coexist(i, j):
						self.tanks[i].willgo = False
						self.tanks[j].willgo = False
						update = True
		for i in self.tanks:
			if self.tanks[i].willgo:
				self.tanks[i].x += self.tanks[i].get_destination()[0]
				self.tanks[i].y += self.tanks[i].get_destination()[1]
				self.tanks[i].timeout = self.tanks[i].MOVE_INTERVAL
			
	def do_tick(self, user_inputs):
		self.do_tank_tick(user_inputs)
		# self.do_bullet_tick(user_inputs)
		response = {}
		entities = dict((str(tank), self.tanks[tank].act()) for tank in self.tanks)
		for i in user_inputs:
			response[i] = {}
			response[i]["entities"] = entities
			if i not in self.tanks:
				response[i]["palette"] = self.level["palette"]
				response[i]["field"] = self.level["field"]
				self.tanks[i] = self.Tank(7, 7)
			response[i] = json.dumps(response[i])
		return response
