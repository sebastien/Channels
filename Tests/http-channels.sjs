# Iciela - Channels test case

@function _testChannel channelClass, evalJS
	evalJS = evalJS and True or False
	var test_url = "test-channels.json"
	var channel  = new channelClass {evalJson:evalJS}
	Testing test ( channelClass getName() + "channel GET  (evalJS=" + evalJS + ")")
	channel get  (test_url) onSet {Testing succeed()} onFail {Testing fail("HTTP Request failed")}
	Testing test (channelClass getName() + " channel POST (evalJS=" + evalJS + ")")
	channel post (test_url) onSet {Testing succeed()} onFail {Testing fail("HTTP Request failed")}
@end

Testing testCase("Synchronous Channels")
_testChannel(Railways SyncChannel, True)
_testChannel(Railways SyncChannel, False)

Testing testCase("Asynchronous Channels")
_testChannel(Railways AsyncChannel, True)
_testChannel(Railways AsyncChannel, False)

Testing end()
# EOF
