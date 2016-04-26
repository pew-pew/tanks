import sys, asyncio, websockets
import random

def pr(*args, **kwargs):
    print(*args, **kwargs)
    sys.stdout.flush()

class Client:
    def __init__(self, server, id=None, websocket=None):
        self.server = server
        self.id = id
        self.websocket = websocket
        
        self.lastMessage = None
    
    def __repr__(self):
        return "Client %s"%(self.id)
    
    def __str__(self):
        return "%s"%(self.id)
    
    def isConnected(self):
        return self.websocket and self.websocket.open
    
    @asyncio.coroutine
    def waitForConnectionCoro(self):
        while not self.isConnected():
            yield from asyncio.sleep(0, loop=self.server.loop)
    
    @asyncio.coroutine
    def waitForMessageCoro(self):
        while self.lastMessage == None:
            yield from asyncio.sleep(0, loop=self.server.loop)
    
    def send(self, data):
        self.server.loop.run_until_complete(self.waitForConnectionCoro())
        coro = self.websocket.send(data)
        self.server.loop.run_until_complete(coro)
        return True
    
    def recv(self):
        #self.server.loop.run_until_complete(self.waitForMessageCoro())
        #message = self.lastMessage
        return self.lastMessage

class WSServer:
    def __init__(self, host="localhost", port=13337, loop=None):
        self.loop = loop # make new if 'None'
        self.startServerCoro = websockets.serve(self.connectionHandler,
                                                host=host, port=port, loop=loop)
        
        
        self.clients = dict()
        self.connected = dict()
        #otherInits
    
    def start(self):
        pr("Starting...")
        self.loop.run_until_complete(self.startServerCoro)
        pr("Started!")
    
    def onClientConnect(self, websocket, clientID):
        if clientID in self.connected:
            return False
        elif clientID not in self.clients:
            client = Client(server=self, id=clientID,
                            websocket=websocket)
            self.clients[clientID] = client
            self.connected[clientID] = client
        else:
            self.clients[clientID].websocket = websocket
            self.connected[clientID] = self.clients[clientID]
        return True
        
    
    def onClientDisconnect(self, client):
        client.websocket.close()
        self.connected.pop(client.id)
    
    @asyncio.coroutine
    def connectionHandler(self, websocket, path):
        pr("Connected...", end=" ")
        #yield from websocket.send("Send your ID")
        clientID = random.randint(1, 13337)#yield from websocket.recv()
        pr("%s"%(clientID)) # HAHAHHAHAHAHAHHAHAHHWADAWdjahsdkshawhdg
        
        if not self.onClientConnect(websocket, clientID):
            pr("Alredy connected -> drop"%(clientID))
            yield from websocket.send("Alredy connected")
            return
        client = self.clients[clientID]
        
        try:
            while True and client.isConnected():
                data = yield from websocket.recv()
                client.lastMessage = data
        except Exception as e:
            pr("Exception:\n%s"%(e))
        finally:
            pr("Disconnected %s"%(clientID))
            self.onClientDisconnect(client)
            websocket.close()

if __name__ == "__main__":
    server = WSServer(loop=asyncio.new_event_loop())
    server.start()