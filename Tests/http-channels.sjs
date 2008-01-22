# Channels test case
@import UnitTest from insulin

@class ChannelsTest: UnitTest

	@method testSyncChannel
		var channel = new channels SyncChannel ()
		var future  = channel get ("http-channel.json")
		future onFail ( fail )
		# TODO: Handle success
	@end

@end

$ (document) ready {
	insulin ui = new insulin HtmlTestUI()
	new insulin TestRunner() runTests()
}

# EOF
