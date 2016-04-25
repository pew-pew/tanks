from fractions import gcd

def lcd(a, b):
    return a * b // gcd(a, b)


TANK_SPEED = 10
BULLET_SPEED = 20
TICK_RATE = lcd(TANK_SPEED, BULLET_SPEED)
CURMAXID = 1

def time_to_tick(time): #convert from time to amount of ticks
    eps = 0.0001
    return int(time * TICK_RATE + eps)


BULLET_COOLDOWN = time_to_tick(2.5)
DEATH_TIME = time_to_tick(1)
UNTOUCH_TIME = time_to_tick(1)

class TankAns:
    def __init__(self):
        self.dye = False
        self.move = dict()
        self.new_bullet = dict()
    def set_move(self, dir, move):
        self.move['action'] = 'move'
        self.move['dir'] = dir
        self.move['move'] = move
class BulletAns:
    def __init__(self):
        self.dye = False
        self.move = dict()
        self.destroy = dict()
        self.destroy['tank'] = -1
        self.destroy['fill'] = []
    def set_move(self, dir, move):
        self.move['action'] = 'move'
        self.move['dir'] = dir
        self.move['move'] = move
    def destroy_tank(self, id):
        self.dye = True
        self.destroy['tank'] = id
    def destroy_fill(self, kl):
        self.dye = True
        self.destroy['fill'] = kl
class GlobalAns():
    def __init__(self):
        self.tanks = []
        self.bullets = dict()
        self.board = []
    def set_tank(self, id, localans):
        pass
class Tank:
    def __init__(self, id, x, y, dir):
        self.id = id
        self.untouch = UNTOUCH_TIME
        self.x = x
        self.y = y
        self.dir = dir
        self.cooldown = time_to_tick(0)
        self.death = time_to_tick(0)
    def destroy(self):
        self.death = DEATH_TIME
    def can_right(self, board):
        flag = True
        for x1 in range(self.x - 2, self.x + 3):
            if (board[x1][self.y + 3] != 0):
                flag = False
        return flag
    def can_left(self, board):
        flag = True
        for x1 in range(self.x - 2, self.x + 3):
            if (board[x1][self.y - 3] != 0):
                flag = False
        return flag
    def can_up(self, board):
        flag = True
        for y1 in range(self.y - 2, self.y + 3):
            if (board[self.x - 3][y1] != 0):
                flag = False
        return flag
    def can_down(self, board):
        flag = True
        for y1 in range(self.y - 2, self.y + 3):
            if (board[self.x + 3][y1] != 0):
                flag = False
        return flag
    def do_tick(self, tick, commands, board):
        if self.death > 0:
            self.death -= 1
            answer = TankAns()
            answer.dye = True
            return answer
        elif tick % TANK_SPEED == 0:
            answer = TankAns()
            if self.cooldown == 0 and commands['fire'] == True:
                self.cooldown = BULLET_COOLDOWN
                if self.dir == 'up':
                    bullets[CURMAXID] = Bullet(CURMAXID, x - 2, y, 'up')
                elif self.dir == 'down':
                    bullets[CURMAXID] = Bullet(CURMAXID, x + 2, y, 'down')
                elif self.dir == 'left':
                    bullets[CURMAXID] = Bullet(CURMAXID, x, y - 2, 'left')
                elif self.dir == 'right':
                    bullets[CURMAXID] = Bullet(CURMAXID, x, y + 2, 'right')
                CURMAXID += 1
            if commands['dir'] == 'pass':
                answer.set_move(self.dir, 0)
            else:
                if commands['dir'] == 'up':
                    if self.can_up(board):
                        self.x -= 1
                        answer.set_move(commands['dir'], 1)
                    else:
                        answer.set_move(commands['dir'], 0)
                elif commands['dir'] == 'down':
                    if self.can_down(board):
                        self.x += 1
                        answer.set_move(commands['dir'], 1)
                    else:
                        answer.set_move(commands['dir'], 0)
                elif commands['dir'] == 'left':
                    if self.can_left(board):
                        self.y -= 1
                        answer.set_move(commands['dir'], 1)
                    else:
                        answer.set_move(commands['dir'], 0)
                elif commands['dir'] == 'right':
                    if self.can_right(board):
                        self.y += 1
                        answer.set_move(commands['dir'], 1)
                    else:
                        answer.set_move(commands['dir'], 0)
            self.untouch = max(self.untouch - 1, 0)
            return answer
        else:
            answer = TankAns()
            answer.set_move(self.dir, 0)
            self.untouch = max(self.untouch - 1, 0)
            return answer


class Bullet:
    def __init__(self, id, x, y, dir):
        self.id = id
        self.x = x
        self.y = y
        self.dir = dir
    def do_tick(self, tick, command, board, tanks):
        if tick % BULLET_TICK == 0:
            answert = BulletAns()
            if self.dir == 'left':
                self.y -= 1
            elif self.dir == 'right':
                self.y += 1
            elif self.dir == 'up':
                self.x -= 1
            elif self.dir == 'down':
                self.x += 1
            answer.set_move(self.dir, 1)
            breakobj = []
            tag = None
            if board[self.x][self.y] != 0:
                tag = 'fill'
                if self.dir == 'left':
                    for x1 in range(self.x - 1, self.x + 1):
                        for y1 in range(self.y - 2, self.y + 3):
                            if board[x1][y1] == 2:
                                breakobj.append([x1, y1])
                elif self.dir == 'right':
                    for x1 in range(self.x, self.x + 2):
                        for y1 in range(self.y - 2, self.y + 3):
                            if board[x1][y1] == 2:
                                breakobj.append([x1, y1])
                elif self.dir == 'up':
                    for x1 in range(self.x - 2, self.x + 3):
                        for y1 in range(self.y - 1, self.y + 1):
                            if board[x1][y1] == 2:
                                breakobj.append([x1, y1])
                elif self.dir == 'down':
                    for x1 in range(self.x - 2, self.x + 3):
                        for y1 in range(self.y, self.y + 2):
                            if board[x1][y1] == 2:
                                breakobj.append([x1, y1])
            for tank in tanks:
                if abs(tank.x - self.x) <= 2 and abs(tank.y - self.y) <= 2:
                    tag = 'tank'
                    breakobj = tank.id
                    
            if tag == 'fill':
                answer.destroy_fill(breakobj)
            if tag == 'tank':
                answer.destroy_tank(breakobj)
            return answer
                
        else:
            answer = BulletAns()
            answer.set_move(self.dir, 0)
            return answer


#def do_tick(tick, board, tanks, bullets):
#    for i in range(2):
#        ans = tanks[i].do_tick()
        
'''
board = [[0 for i in range(20)] for j in range(20)]
tank = Tank(0, 10, 10, 'down')
commands = dict()
commands['dir'] = 'down'
commands['fire'] = False
do_tick(0, commands, board)
'''

class TanksGame:
    def __init__(self):
        self.board = [[0 for i in range(40)] for j in range(40)]
        self.tanks = []
        self.tanks.append(Tank(0, 10, 10, 'down'))
        self.tanks.append(Tank(0, 20, 20, 'down'))
        self.tick = 0
    def do_tick(self, commands):
        GAns = dict()
        GAns['tanks'] = []       
        for i in range(2):
            ans = self.tanks[i].do_tick(self.tick, commands[i], self.board).move
            GAns['tanks'].append(ans)
        self.tick += 1
        return GAns