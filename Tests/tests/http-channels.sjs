# Channels test case
@import channels
@import testing

# TODO: Test Futures
# TODO: Test JSON evaluation
#
$ (document) ready {
	insulin ui = new insulin HtmlTestUI()
	new insulin TestRunner() runTests()
}

# EOF
