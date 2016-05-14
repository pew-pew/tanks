class GameInput:
	def __init__(self, packet):
		"""Process the packet and create an input object"""

		packetno = ord(packet)
		self.up = bool((packetno >> 7) % 2);
		self.down = bool((packetno >> 6) % 2);
		self.left = bool((packetno >> 5) % 2);
		self.right = bool((packetno >> 4) % 2);
		self.attack = bool((packetno >> 3) % 2);
		self.special = bool((packetno >> 2) % 2);

	def __repr__(self):
		s = ""
		if self.up:
			s += "U"
		else:
			s += "u"
		if self.down:
			s += "D"
		else:
			s += "d"
		if self.left:
			s += "L"
		else:
			s += "l"
		if self.right:
			s += "R"
		else:
			s += "r"
		if self.attack:
			s += "A"
		else:
			s += "a"
		if self.special:
			s += "B"
		else:
			s += "b"
		return s
