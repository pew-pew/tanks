import json, random, copy
from communication import *

class BaseTankGame:

	DEFAULT_MAP = "maps/test_board.txt"
	TICK_RATE = 45
	BULLET_MODULO = 100

	class Entity:
		
		MOVE_INTERVAL = 1

		def __init__(self, x, y):
			self.x = x
			self.y = y
			self.sprite = "resources/entities/5x5gridtest.png"
			self.firstAct = True
			self.timeout = 0;

		def act(self):
			self.baseResponse = {"x": self.x, "y": self.y, "vel": 1000 * self.timeout / BaseTankGame.TICK_RATE}
			if self.firstAct:
				self.baseResponse["sprite"] = self.sprite
				self.firstAct = False
			self.deepResponse = {"x": self.x, "y": self.y, "sprite": self.sprite}
			return (self.baseResponse, self.deepResponse)

	class Tank(Entity):

		MOVE_INTERVAL = 3
		RELOAD_TIME = 45
		RESPAWN_TIME = 45

		def __init__(self, x, y):
			self.x = x
			self.y = y
			self.timeout = 0
			self.angle = 0
			self.oldangle = 0
			self.bulletcooldown = 0
			self.dead = False
			self.respawn = 0;
			self.firstAct = True
			self.sprite = "resources/entities/tank{}.png".format(random.randrange(4))

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

		def get_bullet_spawn(self):
			if self.angle % 360 == 0:
				return (self.x, self.y - 3)
			elif self.angle == 90:
				return (self.x + 3, self.y)
			elif self.angle == 180:
				return (self.x, self.y + 3)
			else:
				return (self.x - 3, self.y)

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
			self.baseResponse = {"x": self.x, "y": self.y, "vel": 1000 * self.timeout / BaseTankGame.TICK_RATE}
			if self.firstAct:
				self.baseResponse["sprite"] = self.sprite
				self.firstAct = False
			self.deepResponse = {"x": self.x, "y": self.y, "sprite": self.sprite}
			if (self.oldangle != self.angle):
				self.baseResponse["dir"] = self.angle
				if (self.oldangle - self.angle + 360) % 360 < 180:
					self.baseResponse["dir"] *= -1
				if (self.oldangle - self.angle + 360) % 360 == 180:
					self.baseResponse["dirvel"] = 0
				else:
					self.baseResponse["dirvel"] = 1000 * self.MOVE_INTERVAL / BaseTankGame.TICK_RATE
				self.oldangle = self.angle
			if "dir" in self.baseResponse:
				self.deepResponse["dir"] = self.baseResponse["dir"]
			else:
				self.deepResponse["dir"] = self.angle
			return (self.baseResponse, self.deepResponse)
	
	class Bullet(Entity):
		DIRS_X = {360: 0, 90: 1, 180: 0, 270: -1}
		DIRS_Y = {360: -1, 90: 0, 180: 1, 270: 0}

		MOVE_INTERVAL = 1

		def __init__(self, x, y, direction):
			self.x = x
			self.y = y
			self.direction = direction
			self.sprite = "resources/entities/bullet.png"
			self.dead = False
			self.firstAct = True
			self.timeout = 0;

		def get_destination(self):
			return (self.DIRS_X[self.direction], self.DIRS_Y[self.direction])

		def get_bounds(self):
			return ((0, 0), (0, 0))

		def act(self):
			self.baseResponse = {"x": self.x, "y": self.y, "vel": 1000 * self.timeout / BaseTankGame.TICK_RATE}
			if self.firstAct:
				self.baseResponse["sprite"] = self.sprite
				self.firstAct = False
			self.deepResponse = {"x": self.x, "y": self.y, "sprite": self.sprite}
			if (self.timeout > 0):
				self.timeout -= 1
			else:
				self.x += self.DIRS_X[self.direction]
				self.y += self.DIRS_Y[self.direction]
				self.timeout = self.MOVE_INTERVAL
			return (self.baseResponse, self.deepResponse)
		
	tanks = dict()
	bullets = dict()
	lastbullet = 0
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

	def can_coexist(self, i, j):
		ix1 = i.x + i.get_destination()[0] + i.get_bounds()[0][0]
		ix2 = i.x + i.get_destination()[0] + i.get_bounds()[0][1]
		iy1 = i.y + i.get_destination()[1] + i.get_bounds()[1][0]
		iy2 = i.y + i.get_destination()[1] + i.get_bounds()[1][1]
		jx1 = j.x + j.get_destination()[0] + j.get_bounds()[0][0]
		jx2 = j.x + j.get_destination()[0] + j.get_bounds()[0][1]
		jy1 = j.y + j.get_destination()[1] + j.get_bounds()[1][0]
		jy2 = j.y + j.get_destination()[1] + j.get_bounds()[1][1]
		if (ix1 >= jx1 and ix1 <= jx2) or (ix2 >= jx1 and ix2 <= jx2) or (jx1 >= ix1 and jx1 <= ix2) or (jx2 >= ix1 and jx2 <= ix2):
			if (iy1 >= jy1 and iy1 <= jy2) or (iy2 >= jy1 and iy2 <= jy2) or (jy1 >= iy1 and jy1 <= iy2) or (jy2 >= iy1 and jy2 <= iy2):
				return False
		return True

	def process_map(self, mapdict):
		return mapdict

	def do_tank_tick(self, user_inputs):
		for i in self.tanks:
			try:
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
			except KeyError:
				self.tanks[i].dead = True
				continue
		for i in self.tanks:
			if not self.tanks[i].cango(self.level):
				self.tanks[i].direction = "pass"
		update = True
		while update:
			update = False
			for i in self.tanks:
				for j in self.tanks:
					if i != j and not self.tanks[i].dead and not self.tanks[j].dead and not self.can_coexist(self.tanks[i], self.tanks[j]):
						self.tanks[i].direction = "pass"
						self.tanks[j].direction = "pass"
						update = True
		for i in self.tanks:
			self.tanks[i].x += self.tanks[i].get_destination()[0]
			self.tanks[i].y += self.tanks[i].get_destination()[1]
			if self.tanks[i].direction != "pass":
				self.tanks[i].timeout = self.tanks[i].MOVE_INTERVAL
			else:
				self.tanks[i].timeout = max(0, self.tanks[i].timeout - 1)
			if self.tanks[i].respawn > 0:
				self.tanks[i].respawn -= 1
			elif self.tanks[i].dead:
				self.tanks[i].dead = False

	def do_bullet_tick(self, user_inputs):
		for i in user_inputs:
			if i not in self.tanks:
				continue
			self.tanks[i].bulletcooldown = max(0, self.tanks[i].bulletcooldown - 1)
			if user_inputs[i].attack and self.tanks[i].bulletcooldown == 0:
				newbullet = self.Bullet(*self.tanks[i].get_bullet_spawn() + (self.tanks[i].angle,))
				newbullet.ID = self.lastbullet
				self.lastbullet = (self.lastbullet + 1) % self.BULLET_MODULO
				self.bullets["b{}".format(newbullet.ID)] = newbullet
				self.tanks[i].bulletcooldown = self.tanks[i].RELOAD_TIME
		for i in self.bullets:
			for j in self.tanks:
				if not self.can_coexist(self.bullets[i], self.tanks[j]):
					self.bullets[i].dead = True
					self.tanks[j].dead = True
					self.tanks[j].respawn = self.tanks[j].RESPAWN_TIME
			
	def do_tick(self, user_inputs):
		self.do_tank_tick(user_inputs)
		self.do_bullet_tick(user_inputs)
		baseResponse = {}
		deepResponse = {}
		entities = dict((str(tank), self.tanks[tank].act()) for tank in self.tanks)
		for i in self.bullets:
			entities[i] = self.bullets[i].act()
		baseResponse["entities"] = dict((i, entities[i][0]) for i in entities)
		deepResponse["entities"] = dict((i, entities[i][1]) for i in entities)
		topop = []
		for i in self.bullets:
			if self.bullets[i].dead:
				topop.append(i)
		for i in topop:
			baseResponse["entities"][str(i)] = {"draw": False}
			deepResponse["entities"].pop(str(i), None)
			self.bullets.pop(i, None)
		topop = []
		for i in self.tanks:
			if self.tanks[i].dead:
				baseResponse["entities"][str(i)]["draw"] = False
			else:
				baseResponse["entities"][str(i)]["draw"] = True
			if i not in user_inputs:
				topop.append(i)
		for i in topop:
			baseResponse["entities"][str(i)] = {"draw": False}
			deepResponse["entities"].pop(str(i), None)
			self.tanks.pop(i, None)
		deepResponse["palette"] = self.level["palette"]
		deepResponse["field"] = self.level["field"]
		response = {}
		for i in user_inputs:
			if i in self.tanks:
				response[i] = json.dumps(baseResponse)
			else:
				self.tanks[i] = self.Tank(7, 7)
				response[i] = json.dumps(deepResponse)
		return response
