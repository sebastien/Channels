from railways import *
import pamela.web

class BurstChannelServer(Component):

	def init( self ):
		self.counter = 0

	@on(GET=["/","/index","/index.html"])
	def index( self, request ):
		return request.redirect("burst-channels.paml")
		
	@on(GET="count",POST="count")
	def hello( self, request ):
		res = str(self.counter)
		self.counter += 1
		return request.respond(res)

run(components=[pamela.web.getLocalFile(), BurstChannelServer()])
