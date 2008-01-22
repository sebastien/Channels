# Channels test case
@import UnitTest from insulin

@class SynchronousChannels: UnitTest

	@method testSynchronousGet
		
	@end

	@method testSynchronousPost
		
	@end

	@method testRequestsAtomicity
		
	@end

@end

$ (document) ready {
	insulin ui = new insulin HtmlTestUI()
	new insulin TestRunner() runTests()
}

# EOF
