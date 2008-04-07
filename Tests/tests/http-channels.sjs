# Channels test case
@import channels
@import testing

@shared T = testing

@function channelGET c
	T test "HTTP GET request"
	var f = c get "/test/GET"
	f onSucceed {v|
		T same   (v, {hello:"world",method:"GET"})
		T succeed ()
	}
@end

@function channelPOST c
	T test "HTTP POST request"
	var f = c get "/test/GET"
	f onSucceed { T succeed() }
@end

@function channelJSON c
@end

@function channelHTML c
@end

@function channelEvalJSON c
@end

@function channelForceJSON c
@end

@function channelSucceed c
@end

@function channelFailure c
@end

@function channelExceptionPropagation c
	T test "Channel/Future exception callbacks"
	# FIXME: Fail if no exception
	c onException { T succeed() }
	var f = c get "/test/GET"
	f onSucceed {raise "Exception"}
@end

@function test c
	channelGET  (c)
	channelPOST (c)
	channelJSON (c)
	channelEvalJSON (c)
	channelForceJSON (c)
	channelSucceed (c)
	channelFailure (c)
	channelExceptionPropagation (c)
@end


@function testChannels
	var bc = new channels BurstChannel ()
	var sc = new channels SyncChannel  ()
	var ac = new channels AsyncChannel ()
	T test "Sync channels"
	test (sc)
	T test "Async channels"
	test (ac)
	T test "Burst channels"
	test (bc)
	T end ()
@end

$ (document) ready {
	print "TEST CHANNELS"
	testChannels ()
}

# EOF
