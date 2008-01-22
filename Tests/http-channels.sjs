# Channels test case
@import UnitTest from insulin
@import SyncChannel from channels

# TODO: Test Futures
# TODO: Test JSON evaluation
#
@class SynchronousChannels: UnitTest

	@method testSynchronousGet
		var c = new SyncChannel ()
		var f = c get "test/GET"
		# Synchronous channels result future must already have a value
		ensure isTrue   (f hasSucceeded ())
		ensure sameDict (f get(), {hello:"world",method:"GET"})
	@end

	@method testSynchronousPost
		var c = new SyncChannel ()
		var f = c post "test/POST"
		# Synchronous channels result future must already have a value
		ensure isTrue   (f hasSucceeded ())
		ensure sameDict (f get(), {hello:"world",method:"POST"})
	@end

	@method testRequestsAtomicity
		var c = new SyncChannel ()
		var results = []
		0..5 :: {
			var f = c get "test/GET+latency"
			ensure isTrue    (f hasSucceeded ())
			ensure isDefined (f get ())
		}
	@end

	@method testFutureFailureInformation
		var c = new SyncChannel ()
		var f = c get "test/404"
		ensure isFalse (f hasSucceeded ())
		ensure isTrue  (f hasFailed ())
		ensure  same   (f getErrorReason(),  404)
		ensure  same   (f getErrorDetails(), "Take that in your face !!")
		var f = c get "test/500"
		ensure isFalse (f hasSucceeded ())
		ensure isTrue  (f hasFailed ())
		ensure  same   (f getErrorReason(),  500)
		ensure  same   (f getErrorDetails(), "Let's pretend this is a crash")
	@end

	@method testChannelFailurePropagation
		var counter = 0
		var c       = new SyncChannel ()
		c onFail {
			print "I failed"
			counter += 1
		}
		var f = c get "test/404"
		ensure isTrue  (f hasFailed ())
		ensure same  (counter, 1)
		var f = c get "test/500"
		ensure isTrue  (f hasFailed ())
		ensure same  (counter, 2)
	@end

@end

$ (document) ready {
	insulin ui = new insulin HtmlTestUI()
	new insulin TestRunner() runTests()
}

# EOF
