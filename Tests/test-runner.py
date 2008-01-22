import os, sys, time, random
import railways
from railways.contrib.localfiles import LocalFiles
import pamela.web as pamelaweb

on = railways.on

# -----------------------------------------------------------------------------
#
# Main component
#
# -----------------------------------------------------------------------------

class MainComponent(LocalFiles):

	def init( self, root=None ):
		LocalFiles.init(self, root)
		self._processors.update(pamelaweb.getProcessors())

	@on(GET="/test/GET")
	def testGet( self, request ):
		return request.returns({"hello":"world","method":"GET"})

	@on(GET="/test/GET+latency")
	def testGetWithLatency( self, request ):
		time.sleep(random.random())
		return request.returns({"hello":"world","method":"GET", "time":time.time()})

	@on(POST="/test/POST")
	def testPost( self, request ):
		return request.returns({"hello":"world","method":"POST"})

	@on(GET_POST="/test/404")
	def test404( self, request ):
		return request.respond(status="404", content="Take that in your face !!")

	@on(GET_POST="/test/500")
	def test500( self, request ):
		return request.respond(status="500", content="Let's pretend this is a crash")

# -----------------------------------------------------------------------------
#
# Main
#
# -----------------------------------------------------------------------------

def run( arguments ):
	ROOT   = os.path.dirname(os.path.abspath(__file__))
	os.environ["SUGARPATH"] = os.path.join(ROOT, "sjs")
	app    = railways.Application(components=(MainComponent(),))
	railways.command (arguments, app=app,sessions=False)

if __name__ == "__main__":
	run(sys.argv[1:])

# EOF

