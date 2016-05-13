from server.communication import *
class Game:

	class InvalidInputException(Exception):
		pass

	def do_tick(self, user_inputs):
		"""Do a single game tick and return a response.
		
		Arguments:
		user_inputs -- a dictionary of player ID - GameInput pairs
		
		Output:
		A dictionary of player ID - GameResponse pairs to be returned to the corresponding users
		"""

		for user_id in user_inputs:
			if not isinstance(user_inputs[user_id], GameInput):
				raise self.InvalidInputException('Input of {user} is not a valid GameInput instance'.format(user=user_id))
		pass

