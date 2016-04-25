import asyncio, json, sys
import tanks
from server import WSServer, Client


HOST = "localhost"
PORT = 13337
PLAYERS = 2

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

loop = asyncio.new_event_loop()
server = WSServer(host=HOST, port=PORT, loop=loop)
asyncio.set_event_loop(loop)
server.start()

pr("Waiting for %s players..."%(PLAYERS))
clients = loop.run_until_complete(waitForQ(PLAYERS))
pr("Starting game...")


tanksGame = tanks.TanksGame()

while True:
    inputs = []
    for client in clients:
        data = validatePlayerInput(client.recv())
        while data == None:
            data = validatePlayerInput(client.recv())
        inputs.append(data)
    pr(inputs)
    changes = tanksGame.do_tick(inputs)
    changesS = json.dumps(changes)
    pr(changesS)
    for client in clients:
        client.send(changesS)