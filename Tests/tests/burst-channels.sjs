@import testing
@shared T = testing

@function doRequests channel
	(0..100) :: {
		channel get  "count"
		channel post "count"
	}
@end

@function testBurstChannels
	T test "Basic burst channels"
	var r = []
	var c = new channels BurstChannel ()
	c get  "count"  onSet {v|r push(v)}
	c post "count" onSet  {v|r push(v)}
	var f = c get  "count"
	#var rdv = T rendezVous (1)
	f onSet {v| r push (v)}
	c onSet {
		rdv join ()
		T same (r length, 3)
		T same (r[0], 0)
		T same (r[1], 1)
		T same (r[1], 1)
	}
	#T waitFor (rdv, 1000)
@end

@function testBurstChannelPerformance
	var bc = new channels BurstChannel ()
	var sc = new channels SyncChannel  ()
	var ac = new channels AsyncChannel ()
	T test "Sync channels"
	doRequests (sc)
	T test "Async channels"
	doRequests (ac)
	T test "Burst channels"
	doRequests (bc)
	T end ()
@end

$ (document) ready {
	T HTMLReporter Install ()
	testBurstChannelPerformance ()
}
# EOF
