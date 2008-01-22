// 8< ---[httpchannels.js]---
var httpchannels={}
httpchannels.ChannelsTest=Extend.Class({
	name:'httpchannels.ChannelsTest', parent:insulin.UnitTest,
	methods:{
		testSyncChannel:function(){
			var __this__=this
			var channel=new channels.SyncChannel();
			var future=channel.get("http-channel.json");
			future.onFail(__this__.fail)
		}
	}
})
httpchannels.init=	function(){
		var __this__=httpchannels;
		$(document).ready(function(){
			insulin.ui = new insulin.HtmlTestUI();
			new insulin.TestRunner().runTests()
		})
	}
httpchannels.init()
