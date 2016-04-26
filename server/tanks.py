from fractions import gcd
import copy

def lcd(a, b):
    return a * b // gcd(a, b)
def tank_lose(i):
    ya_hochu_spat = True
class Consts:
    def __init__(self, coords):
        self.TANK_SPEED = 10
        self.BULLET_SPEED = 20
        self.TICK_RATE = lcd(self.TANK_SPEED, self.BULLET_SPEED)
        self.BULLET_COOLDOWN = self.time_to_tick(2.5)
        self.DEATH_TIME = self.time_to_tick(1)
        self.UNTOUCH_TIME = self.time_to_tick(1)
        self.CURMAXID = 1
        self.SPAWN_POINTS = coords
        #self.SPAWN_POINTS = [{'dir': 'right', 'x': 10, 'y': 10}, {'dir': 'left', 'x': 20, 'y': 10}]
    def time_to_tick(self, time): #convert from time to amount of ticks
        eps = 0.0001
        return int(time * self.TICK_RATE + eps)    


class TankAns:
    def __init__(self):
        self.dye = False
        self.move = dict()
        self.spawn = None
        self.new_bullet = None
    def set_move(self, dir, move):
        self.move['action'] = 'move'
        self.move['dir'] = dir
        self.move['move'] = move
    def fnew_bullet(self, dir, x, y):
        self.new_bullet = dict()
        
        self.new_bullet['action'] = 'spawn'
        self.new_bullet['dir'] = dir
        self.new_bullet['x'] = x
        self.new_bullet['y'] = y
    def fspawn(self, id, dir, x, y):
        self.spawn = dict()
        self.spawn['action'] = 'spawn'
        self.spawn['id'] = id
        self.spawn['dir'] = dir
        self.spawn['x'] = x
        self.spawn['y'] = y
class BulletAns:
    def __init__(self):
        self.dye = False
        self.move = dict()
        self.destroy = dict()
        self.destroy['tank'] = None
        self.destroy['fill'] = None
    def set_move(self, dir, move):
        self.move['action'] = 'move'
        self.move['dir'] = dir
        self.move['move'] = move
    def destroy_tank(self, id):
        self.dye = True
        self.destroy['tank'] = id
    def destroy_fill(self, kl):
        self.dye = True
        self.destroy['fill'] = []
        for elem in kl:
            d = dict()
            d['x'] = elem[0]
            d['y'] = elem[1]
            d['id'] = 0
            self.destroy['fill'].append(d)

class Tank:
    def __init__(self, id, consts):
        self.consts = consts
        self.id = id
        self.untouch = self.consts.UNTOUCH_TIME
        self.x = consts.SPAWN_POINTS[id]['x']
        self.y = consts.SPAWN_POINTS[id]['y']
        self.dir = consts.SPAWN_POINTS[id]['dir']
        self.cooldown = 0
        self.death = self.consts.DEATH_TIME * 0
    def destroy(self):
        self.death = self.consts.DEATH_TIME
    def can_right(self, board, tanks):
        flag = True
        for y1 in range(self.y - 2, self.y + 3):
            if (board[self.x + 3][y1] != 0):
                flag = False
        for tank in tanks:
            for y1 in range(self.y - 5, self.y + 6):
                if tank.x == self.x + 5 and tank.y == y1:
                    flag = False        
        return flag
    def can_left(self, board, tanks):
        flag = True
        for y1 in range(self.y - 2, self.y + 3):
            if (board[self.x - 3][y1] != 0):
                flag = False
        for tank in tanks:
            for y1 in range(self.y - 5, self.y + 6):
                if tank.x == self.x - 5 and tank.y == y1:
                    flag = False
        return flag
    def can_up(self, board, tanks):
        flag = True
        for x1 in range(self.x - 2, self.x + 3):
            if (board[x1][self.y - 3] != 0):
                flag = False
        for tank in tanks:
            for x1 in range(self.x - 5, self.x + 6):
                if tank.x == x1 and tank.y == self.y - 5:
                    flag = False
        return flag
    def can_down(self, board, tanks):
        flag = True
        for x1 in range(self.x - 2, self.x + 3):
            if (board[x1][self.y + 3] != 0):
                flag = False
        for tank in tanks:
            for x1 in range(self.x - 5, self.x + 6):
                if tank.x == x1 and tank.y == self.y + 5:
                    flag = False
        return flag
    def do_tick(self, tick, commands, board, tanks, bullets, curmaxid):
        if self.death > 0:
            self.death -= 1
            answer = TankAns()
            answer.dye = True
            return answer
        elif self.death == 0:
            self.death -= 1
            answer = TankAns()
            answer.dye = False
            answer.fspawn(self.id, self.consts.SPAWN_POINTS[self.id]['dir'], self.consts.SPAWN_POINTS[self.id]['x'], self.consts.SPAWN_POINTS[self.id]['y'])
            self.x = self.consts.SPAWN_POINTS[self.id]['x']
            self.dir = self.consts.SPAWN_POINTS[self.id]['dir']
            self.y = self.consts.SPAWN_POINTS[self.id]['y']
            self.untouch = self.consts.UNTOUCH_TIME
            return answer
        elif tick % (self.consts.TICK_RATE // self.consts.TANK_SPEED) == 0:
            answer = TankAns()
            if self.cooldown == 0 and commands['fire'] == True:
                self.cooldown = self.consts.BULLET_COOLDOWN
                if self.dir == 'up':
                    bullets[curmaxid] = Bullet(curmaxid, self.x, self.y - 3, 'up', self.consts)
                    answer.fnew_bullet('up', self.x, self.y - 3)
                elif self.dir == 'down':
                    bullets[curmaxid] = Bullet(curmaxid, self.x, self.y + 3, 'down', self.consts)
                    answer.fnew_bullet('down', self.x, self.y + 3)
                elif self.dir == 'left':
                    bullets[curmaxid] = Bullet(curmaxid, self.x - 3, self.y, 'left', self.consts)
                    answer.fnew_bullet('left', self.x - 3, self.y)
                elif self.dir == 'right':
                    bullets[curmaxid] = Bullet(curmaxid, self.x + 3, self.y, 'right', self.consts)
                    answer.fnew_bullet('right', self.x + 3, self.y)
            if commands['dir'] == 'pass':
                answer.set_move(self.dir, 0)
            else:
                if commands['dir'] == 'up':
                    #self.dir = 'up'
                    if self.can_up(board, tanks):
                        #self.x -= 1
                        answer.set_move(commands['dir'], 1)
                    else:
                        answer.set_move(commands['dir'], 0)
                elif commands['dir'] == 'down':
                    #self.dir = 'down'
                    if self.can_down(board, tanks):
                        #self.x += 1
                        answer.set_move(commands['dir'], 1)
                    else:
                        answer.set_move(commands['dir'], 0)
                elif commands['dir'] == 'left':
                    #self.dir = 'left'
                    if self.can_left(board, tanks):
                        #self.y -= 1
                        answer.set_move(commands['dir'], 1)
                    else:
                        answer.set_move(commands['dir'], 0)
                elif commands['dir'] == 'right':
                    #self.dir = 'right'
                    if self.can_right(board, tanks):
                        #self.y += 1
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
    def __init__(self, id, x, y, dir, consts):
        self.consts = consts
        self.id = id
        self.x = x
        self.y = y
        self.dir = dir
    def do_tick(self, tick, command, board, tanks):
        if tick % (self.consts.TICK_RATE // self.consts.BULLET_SPEED) == 0:
            answer = BulletAns()
         #   if self.dir == 'left':
         #       self.x -= 1
         #   elif self.dir == 'right':
         #       self.x += 1
         #   elif self.dir == 'up':
         #       self.y -= 1
         #   elif self.dir == 'down':
         #       self.y += 1
            answer.set_move(self.dir, 1)
            breakobj = []
            tag = None
            if board[self.x][self.y] != 0:
                tag = 'fill'
                if board[self.x][self.y] == 2:
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
    def __init__(self, players = 2, field = 'test_board.txt', coords = [{'x': 7, 'y': 7, 'dir': 'right'}, {'x': 27, 'y': 27, 'dir': 'left'}]):
        file = open(field, 'r')
        cpvls = file.readlines()
        self.board = []
        self.players = players
        for i in range(len(cpvls)):
            self.board.append([])
            for j in range(len(cpvls[i].rstrip())):
                self.board[-1].append(int(cpvls[i][j]))
        self.lives = [3 for i in range(self.players)]
        self.tanks = [Tank(i, Consts(coords)) for i in range(2)]
        self.bullets = dict()
        self.curmaxid = 1
        self.tick = 0
        self.coords = coords
    def do_tick(self, commands):
        GAns = dict()
        GAns['tanks'] = [] 
        GAns['bullets'] = dict()
        GAns['field'] = []
        if self.tick == 0:
            GAns['field'] = copy.deepcopy(self.board)
            GAns['coords'] = self.coords
        for i in range(self.players):
            lans = self.tanks[i].do_tick(self.tick, commands[i], self.board, self.tanks, self.bullets, self.curmaxid)
            if lans.dye == True:
                if self.tanks[i].death == Consts(self.coords).DEATH_TIME:
                    self.lives[i] -= 1
                    if self.lives[i] == 0:
                        tank_lose(i)
                GAns['tanks'].append({'action': 'dye'})
                self.tanks[i].dye = True
            elif lans.spawn != None:
                ans = lans.spawn
                ans.pop('id')
                GAns['tanks'].append(ans)
                self.tanks[i].dye = True
                self.tanks[i].x = self.tanks[i].consts.SPAWN_POINTS[i]['x']
                self.tanks[i].y = self.tanks[i].consts.SPAWN_POINTS[i]['y']
                self.tanks[i].untouch = self.tanks[i].consts.UNTOUCH_TIME
            else:
                ans = lans.move
                mv = ans['move']
                if ans['dir'] == 'right':
                    self.tanks[i].x += mv
                    self.tanks[i].dir = 'right'
                if ans['dir'] == 'left':
                    self.tanks[i].x -= mv
                    self.tanks[i].dir = 'left'
                if ans['dir'] == 'up':
                    self.tanks[i].y -= mv
                    self.tanks[i].dir = 'up'
                if ans['dir'] == 'down':
                    self.tanks[i].y += mv
                    self.tanks[i].dir = 'down'
               # print(i, self.tanks[i].x, self.tanks[i].y, ans['dir'], ans['move'])
                GAns['tanks'].append(ans)
                ans = lans.new_bullet
                if ans != None:
                    GAns['bullets'][self.curmaxid] = ans
                    self.bullets[self.curmaxid] = Bullet(self.curmaxid, ans['x'], ans['y'], ans['dir'], Consts(self.coords))
                    self.curmaxid += 1
        localcopy = copy.deepcopy(self.bullets)
        for elem in localcopy.items():
            ans = dict()
            ans['dir'] = self.bullets[elem[1].id].dir
            ans['action'] = 'move'
            if self.tick % (Consts(self.coords).TICK_RATE // Consts(self.coords).BULLET_SPEED) == 0:
                ans['move'] = 1
            else:
                ans['move'] = 0
            GAns['bullets'][elem[1].id] = ans
            if ans['dir'] == 'left':
                self.bullets[elem[1].id].x -= ans['move']
            if ans['dir'] == 'right':
                self.bullets[elem[1].id].x += ans['move']
            if ans['dir'] == 'up':
                self.bullets[elem[1].id].y -= ans['move']
            if ans['dir'] == 'down':
                self.bullets[elem[1].id].y += ans['move']
           # for elem in self.bullets.items():
           #     print(elem[1].id, elem[1].x, elem[1].y, elem[1].dir)                
            lans = elem[1].do_tick(self.tick, commands, self.board, self.tanks)
            if lans.dye == True:
                ans = lans.destroy
               # print(ans)
                if ans['fill'] != None:
                    GAns['field'] = ans['fill']
                    for elem2 in ans['fill']:
                        self.board[elem2['x']][elem2['y']] = elem2['id']
                elif ans['tank'] != None:
                    id = ans['tank']
                    self.tanks[id].death = Consts(self.coords).DEATH_TIME
                self.bullets.pop(elem[1].id)
                GAns['bullets'][elem[1].id] = {'action' : 'dye'}
        self.tick += 1
        return GAns
#c = [{'dir': 'down', 'fire': False}, {'dir': 'up', 'fire': False}]
#c = [{'dir': 'pass', 'fire': True}, {'dir': 'pass', 'fire': False}]