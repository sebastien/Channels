import os, sys
import railways
from railways.contrib.localfiles import LocalFiles
import pamela.web as pamelaweb

# -----------------------------------------------------------------------------
#
# Main component
#
# -----------------------------------------------------------------------------

class MainComponent(LocalFiles):

	def init( self, root=None ):
		LocalFiles.init(self, root)
		self._processors.update(pamelaweb.getProcessors())

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

