from communication import *
class Game:
	
	TICK_RATE = 20

	def do_tick(self, user_inputs):
		"""Do a single game tick and return a response.
		
		Arguments:
		user_inputs -- a dictionary of player ID - GameInput pairs
		
		Output:
		A dictionary of player ID - game response dictionary pairs to be returned to the corresponding users
		"""

		response = {}
		for i in user_inputs:
			response[i] = "{}"
		return response
