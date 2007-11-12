// 8< ---[httpchannels.js]---
var httpchannels={}
httpchannels._testChannel=	function(channelClass, evalJS){
		var __this__=httpchannels;
		evalJS = ((evalJS && true) || false);
		var test_url="test-channels.json";
		var channel=new channelClass({"evalJson":evalJS});
		Testing.test((((channelClass.getName() + "channel GET  (evalJS=") + evalJS) + ")"))
		channel.get(test_url).onSet(function(){
			Testing.succeed()
		}).onFail(function(){
			Testing.fail("HTTP Request failed")
		})
		Testing.test((((channelClass.getName() + " channel POST (evalJS=") + evalJS) + ")"))
		channel.post(test_url).onSet(function(){
			Testing.succeed()
		}).onFail(function(){
			Testing.fail("HTTP Request failed")
		})
	}
httpchannels.init=	function(){
		var __this__=httpchannels;
		Testing.testCase("Synchronous Channels")
		httpchannels._testChannel(Railways.SyncChannel, true)
		httpchannels._testChannel(Railways.SyncChannel, false)
		Testing.testCase("Asynchronous Channels")
		httpchannels._testChannel(Railways.AsyncChannel, true)
		httpchannels._testChannel(Railways.AsyncChannel, false)
		Testing.end()
	}
httpchannels.init()
