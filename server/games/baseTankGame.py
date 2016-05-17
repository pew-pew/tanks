import json
from communication import *

class BaseTankGame:
	DEFAULT_MAP = "maps/test_board.txt"
	TICK_RATE = 20
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
	
	def process_map(self, mapdict):
		return mapdict

	def do_tick(self, user_inputs):
		response = {}
		for i in user_inputs:
			response[i] = "{}"
		return response
