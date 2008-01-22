// 8< ---[httpchannels.js]---
function _meta_(v,m){var ms=v['__meta__']||{};for(var k in m){ms[k]=m[k]};v['__meta__']=ms;return v}
var httpchannels={}
var __this__=httpchannels
httpchannels.ChannelsTest=Extend.Class({
	name:'httpchannels.ChannelsTest', parent:insulin.UnitTest,
	methods:{
		testSyncChannel:_meta_(function(){
			var __this__=this
			var channel=new channels.SyncChannel();
			var future=channel.get("http-channel.json");
			future.onFail(__this__.fail)
		},	{
				arity:0,
				arguments:[]
			})
	}
})
httpchannels.init=	_meta_(function(){
		var __this__=httpchannels;
		$(document).ready(_meta_(function(){
			insulin.ui = new insulin.HtmlTestUI();
			new insulin.TestRunner().runTests()
		},	{
				arity:0,
				arguments:[]
			}))
	},	{
			arity:0,
			arguments:[]
		})
httpchannels.init()
