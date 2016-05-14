import asyncio, json, sys, getopt
from server.server import WSServer, Client
from server.games.baseGame import Game
from server.communication import GameInput


HOST = "0.0.0.0"
DEFAULT_PORT = 13337
DEFAULT_PLAYERS = 1
DEFAULT_FIELD = 'mega_battlefield.txt'

def pr(*args, **kwargs):
    print(*args, **kwargs)
    sys.stdout.flush()

def validatePlayerInput(string):
    try:
        data = json.loads(string)
        if "dir" not in data or "fire" not in data: return None
        if data["dir"] not in ["up", "down", "left", "right", "pass"]: return None
        if data["fire"] not in [True, False]: return None
        return data
    except:
        return None

@asyncio.coroutine
def waitForQ(q):
    while len(server.connected) < q:
        yield from asyncio.sleep(0, loop=loop)
    clients = list(server.connected.values())[:q]
    return clients


PORT = None
PLAYERS = None
FIELD = None

try:
    flags = getopt.getopt(sys.argv[1:],"hp:n:f:",["help", "port=","players=","field="])
except getopt.GetoptError:
    flags = [[('-h', '')]]
for flag, value in flags[0]:
    if flag in ("-h", "--help"):
        pr("Usage:")
        pr("    -p, --port: port used for hosting")
        pr("    -n, --players: player number")
        pr("    -f, --field: field file address")
        sys.exit(0)
    elif flag in ("-p", "--port"):
        PORT = int(value)
        pr("Detected port %s"%value)
    elif flag in ("-n", "--players"):
        PLAYERS = int(value)
        pr("Detected player amount %s"%value)
    elif flag in ("-f", "--field"):
        FIELD = value
        pr("Detected field %s"%value)

if PORT == None:
    print("No port found, defaulting to {}".format(DEFAULT_PORT))
    PORT = DEFAULT_PORT
if PLAYERS == None:
    print("No player amount found, defaulting to {}".format(DEFAULT_PLAYERS))
    PLAYERS = DEFAULT_PLAYERS
if FIELD == None:
    print("No field found, defaulting to {}".format(DEFAULT_FIELD))
    FIELD = DEFAULT_FIELD

loop = asyncio.new_event_loop()
server = WSServer(host=HOST, port=PORT, loop=loop)
asyncio.set_event_loop(loop)
server.start()

pr("Waiting for %s players..."%(PLAYERS))
clients = loop.run_until_complete(waitForQ(PLAYERS))
pr("Starting game...")


game = Game()

while True:
    inputs = {}
    for client in clients:
        if client.lastMessage == None:
            data = GameInput('\00')
        else:
            data = GameInput(client.lastMessage)
        inputs[client] = data
    pr(inputs)
    changes = game.do_tick(inputs)
    #pr(changesS)
    for client in clients:
        client.send(changes[client])
    
    
    loop.run_until_complete(asyncio.sleep(1 / game.TICK_RATE, loop=loop))
    
