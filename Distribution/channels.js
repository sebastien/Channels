// 8< ---[channels.js]---
// The channels module defines objects that make JavaScript client-side HTTP
// communication easier by providing the 'Future' and 'Channel' abstractions
// well known from some concurrent programming languages and frameworks.
function _meta_(v,m){var ms=v['__meta__']||{};for(var k in m){ms[k]=m[k]};v['__meta__']=ms;return v}
var channels={}
var __this__=channels
channels._VERSION_='0.7.2';
channels.Future=Extend.Class({
	// A Future represents the promise of a future value returned by an invocation
	// that started an asynchronous process. In other words, a future is a value that
	// ''wraps the future value'' that will be later returned by a process that is
	// not able to give the value directly.
	// 
	// The typical use of Futures is when you are doing networking, such as
	// asynchronous HTTP GETs on a web client: you won't have the response directly
	// (because the HTTP GET is synchronous) but you may want to do things in the
	// meantime.
	// 
	// Futures provide an interesting abstraction to deal with these situations.
	// This implementation of Futures was inspired from the Oz programming language.
	name:'channels.Future', parent:undefined,
	shared:{
		STATES:{"WAITING":1, "SET":2, "FAILED":3},
		REASONS:{"FAILURE":"failure", "TIMEOUT":"timeout", "EXCEPTION":"exception"}
	},
	properties:{
		_value:undefined,
		_errorReason:undefined,
		_errorDetails:undefined,
		_processors:[],
		_onSet:[],
		_onFail:[],
		_onRefresh:undefined,
		state:undefined
	},
	initialize:_meta_(function(){
		var __this__=this
		__this__._processors = []
		__this__._onSet = []
		__this__._onFail = []
		__this__.state = __this__.getClass().STATES.WAITING;
	},	{
			arity:0,
			arguments:[]
		}),
	methods:{
		// Sets the value for this future. This function can be given as a callback
		// for an underlying asynchronous system (such as MochiKit Defered).
		set:_meta_(function(value){
			var __this__=this
			__this__._value = value;
			__this__.state = __this__.getClass().STATES.SET;
			Extend.iterate(__this__._processors, _meta_(function(p){
				__this__._value = p(__this__._value);
			},	{
					arity:1,
					arguments:[{'name': 'p'}]
				}), __this__)
			Extend.iterate(__this__._onSet, _meta_(function(c){
				c(__this__._value, __this__)
			},	{
					arity:1,
					arguments:[{'name': 'c'}]
				}), __this__)
			return __this__
		},	{
				arity:1,
				arguments:[{'name': 'value'}]
			}),
		// This is an alias for 'value'
		get:_meta_(function(){
			var __this__=this
			return __this__.value()
		},	{
				arity:0,
				arguments:[]
			}),
		// Returns the value for this future. This will return 'Undefined' until the
		// value is set. If you want to know if the value is set you can query the
		// 'state' property of the future or invoke the 'isSet' method.
		value:_meta_(function(){
			var __this__=this
			return __this__._value
		},	{
				arity:0,
				arguments:[]
			}),
		// Fails this future with the given (optional) 'reason' and 'details'. The
		// 'reason' should be a value from the 'REASONS' dictionary, and the context
		// an object (probably a dictionary) that gives more detailed information on
		// the failure.
		// 
		// >   future fail ( "timeout", 2000 ) 
		// 
		// Could mean to the application that the future failed because the timeout
		// value of 2000 was reached.
		fail:_meta_(function(reason, details){
			var __this__=this
			reason = reason === undefined ? __this__.getClass().REASONS.FAILURE : reason
			details = details === undefined ? undefined : details
			__this__.state = __this__.getClass().STATES.FAILED;
			__this__._errorReason = reason;
			__this__._errorDetails = details;
			Extend.iterate(__this__._onFail, _meta_(function(c){
				c(reason, details, __this__)
			},	{
					arity:1,
					arguments:[{'name': 'c'}]
				}), __this__)
			return __this__
		},	{
				arity:2,
				arguments:[{'flags': '=', 'name': 'reason'}, {'flags': '=', 'name': 'details'}]
			}),
		// Tells if this future value was set or not.
		isSet:_meta_(function(){
			var __this__=this
			return (__this__.state === __this__.getClass().STATES.SET)
		},	{
				arity:0,
				arguments:[]
			}),
		// Tells if this future has failed or not
		hasFailed:_meta_(function(){
			var __this__=this
			return (__this__.state === __this__.getClass().STATES.FAILED)
		},	{
				arity:0,
				arguments:[]
			}),
		// Tells if this future has succeeded or not (this is an alias for 'isSet')
		hasSucceeded:_meta_(function(){
			var __this__=this
			return __this__.isSet()
		},	{
				arity:0,
				arguments:[]
			}),
		// Registers the given callback to be invoked when this future value is set.
		// The callback will take the value as first argument and the future as
		// second argument.
		// 
		// >    future onSet {v,f| print ("Received value", v, "from future", f)}
		onSet:_meta_(function(callback){
			var __this__=this
			__this__.onSet.push(callback)
			if ( __this__.isSet() )
			{callback(__this__._value, __this__)}
			return __this__
		},	{
				arity:1,
				arguments:[{'name': 'callback'}]
			}),
		// Registers the given callback to be invoked when this future fails.
		// The callback will take the error reason and error details as first two
		// arguments, and the future as third argument.
		// 
		// >    future onFail {r,d,f| print ("Future", f, "failed: reason is ", r, ", ", d)}
		onFail:_meta_(function(callback){
			var __this__=this
			__this__._onFail.push(callback)
			if ( __this__.isSet() )
			{callback(__this__._value, __this__)}
			return __this__
		},	{
				arity:1,
				arguments:[{'name': 'callback'}]
			}),
		// Returns the reason for the error. This is only set when the future has failed.
		getErrorReason:_meta_(function(){
			var __this__=this
			return __this__._errorReason
		},	{
				arity:0,
				arguments:[]
			}),
		// Returns the details for the error. This is only set when the future has failed.
		getErrorDetails:_meta_(function(){
			var __this__=this
			return __this__._errorDetails
		},	{
				arity:0,
				arguments:[]
			}),
		// Refreshing a feature will basically invoke the 'refresh' callback set
		// with the 'onRefresh' function. Typical use of 'refresh' is to take an
		// existing future and to bind the function that created the value as
		// 'refresh', so that getting a "fresher" value can simply be done
		// by calling 'refresh'.
		// 
		// Example:
		// 
		// >    var i = 0
		// >    var f = new Future()
		// >    var p = { f set (i) ; i += 1 }
		// >    f onRefresh (p)
		// >    p()
		// >    print ("i =", f get())
		// >    f refresh()
		// >    print ("i =", f get())
		// >    f refresh()
		// >    print ("i =", f get())
		// 
		// Will print
		// 
		// >    i = 0
		// >    i = 1
		// >    i = 2
		refresh:_meta_(function(){
			var __this__=this
			__this__.state = STATED.WAITING;
			if ( __this__._onRefresh )
			{__this__._onRefresh(__this__)}
			return __this__
		},	{
				arity:0,
				arguments:[]
			}),
		// Sets the callback that will be invoked with this future as argument
		// when the 'refresh' method is invoked. There can be only one refresh
		// callback per future, which means that the previous refresh function
		// will be replaced by the newly given callback.
		// 
		// See 'refresh' for an example.
		onRefresh:_meta_(function(callback){
			var __this__=this
			__this__._onRefresh = callback;
			return __this__
		},	{
				arity:1,
				arguments:[{'name': 'callback'}]
			}),
		// Adds a callback that will process the value of this future, returning
		// the newly processed value. Processing callback will be chained, and
		// will work even if the future value is already set.
		// 
		// Processors are typically used to process the value obtained from a
		// future.
		// 
		// >    var future = getFutureResult()
		// >    future process { v | v toLowerCase() }
		// >    future onSet   { v | print ("Lowercase value: " + v) }
		// 
		// It is a good idea to use processors along with the 'refresh' option,
		// so that you can easily set up a chain of processing the future value.
		process:_meta_(function(callback){
			var __this__=this
			__this__._processors.push(callback)
			if ( __this__.isSet() )
			{__this__._value = callback(__this__._value);}
			return __this__
		},	{
				arity:1,
				arguments:[{'name': 'callback'}]
			})
	}
})
channels.Channel=Extend.Class({
	// Channels are specific objects that allow communication operations to happen
	// in a shared context. The modus operandi is as follows:
	// 
	// - You initialize a channel with specific properties (for HTTP, this would
	// be a prefix for the URLs, wether you want to evaluate the JSON that may
	// be contained in responses, etc).
	// - You send something into the channel (typically an HTTP request)
	// - You get a 'Future' as a promise for a future result.
	// - When the result arrives, the future is set with the resulting value.
	// 
	// Synchronous channels will typically set the result directly, while for
	// asynchronous channels, the result will only be available later.
	// 
	// NOTE: The current implementation of 'Channels' is very much HTTP-oriented. At
	// a later point, the Channels class will be more generic, and will provide
	// separate specific aspects for the HTTP protocol.
	name:'channels.Channel', parent:undefined,
	properties:{
		options:{"prefix":"", "evalJSON":true, "forceJSON":true},
		transport:{"get":undefined, "post":undefined},
		failureCallbacks:[]
	},
	initialize:_meta_(function(options){
		var __this__=this
		options = options === undefined ? {} : options
		__this__.options = {"prefix":"", "evalJSON":true, "forceJSON":true}
		__this__.transport = {"get":undefined, "post":undefined}
		__this__.failureCallbacks = []
		Extend.iterate(options, _meta_(function(v, k){
			__this__.options[k] = v;
		},	{
				arity:2,
				arguments:[{'name': 'v'}, {'name': 'k'}]
			}), __this__)
	},	{
			arity:1,
			arguments:[{'flags': '=', 'name': 'options'}]
		}),
	methods:{
		// Invokes a 'GET' to the given url (prefixed by the optional 'prefix' set in
		// this channel options) and returns a 'Future'.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		get:_meta_(function(url, body, future){
			var __this__=this
			body = body === undefined ? "" : body
			future = future === undefined ? undefined : future
			var get_url=(__this__.options.prefix + url);
			future = __this__.transport.get(get_url, body, (future || __this__._createFuture()));
			future.process(__this__.getMethod('_processHTTPResponse') )
			future.onRefresh(_meta_(function(f){
				return __this__.get(url, f)
			},	{
					arity:1,
					arguments:[{'name': 'f'}]
				}))
			return future
		},	{
				arity:3,
				arguments:[{'name': 'url'}, {'flags': '=', 'name': 'body'}, {'flags': '=', 'name': 'future'}]
			}),
		// Invokes a 'POST' to the give url (prefixed by the optional 'prefix' set in
		// this channel options), using the given 'body' as request body, and
		// returning a 'Future' instance.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		post:_meta_(function(url, body, future){
			var __this__=this
			body = body === undefined ? "" : body
			future = future === undefined ? undefined : future
			var post_url=(__this__.options.prefix + url);
			body = __this__._normalizeBody(body);
			future = __this__.transport.post(post_url, body, (future || __this__._createFuture())).process(__this__.getMethod('_processHTTPResponse') );
			future.onRefresh(_meta_(function(f){
				return __this__.post(url, body, f)
			},	{
					arity:1,
					arguments:[{'name': 'f'}]
				}))
			return future
		},	{
				arity:3,
				arguments:[{'name': 'url'}, {'flags': '=', 'name': 'body'}, {'flags': '=', 'name': 'future'}]
			}),
		// Sets a callback that will be invoked when a future created in this channel
		// fails. The given 'callback' takes the _reason_, _details_ and _future_ as
		// argument, where reason and details are application-specific information
		// (for HTTP, reason is usually a number, detail is the response text)
		onFail:_meta_(function(callback){
			var __this__=this
			__this__.failureCallbacks.push(callback)
		},	{
				arity:1,
				arguments:[{'name': 'callback'}]
			}),
		// Returns a new future, properly initialized for this channel
		_createFuture:_meta_(function(){
			var __this__=this
			var future=new channels.Future();
			future.onFail(__this__.getMethod('_futureHasFailed') )
			return future
		},	{
				arity:0,
				arguments:[]
			}),
		// Invoked when a future has failed. This invokes every callback registered
		// in the 'failureCallbacks' list (which were previously registered using the
		// 'onFail' method).
		_futureHasFailed:_meta_(function(reason, details, future){
			var __this__=this
			Extend.iterate(__this__.failureCallbacks, _meta_(function(c){
				c(reason, details, future)
			},	{
					arity:1,
					arguments:[{'name': 'c'}]
				}), __this__)
		},	{
				arity:3,
				arguments:[{'name': 'reason'}, {'name': 'details'}, {'name': 'future'}]
			}),
		_normalizeBody:_meta_(function(body){
			var __this__=this
			if ( (typeof(body) != "string") )
			{
				var new_body="";
				Extend.iterate(body, _meta_(function(v, k){
					new_body = (new_body + (((k + "=") + __this__._encodeURI(v)) + "&"));
				},	{
						arity:2,
						arguments:[{'name': 'v'}, {'name': 'k'}]
					}), __this__)
				body = new_body;
			}
			return (body || "")
		},	{
				arity:1,
				arguments:[{'name': 'body'}]
			}),
		_responseIsJSON:_meta_(function(repsonse){
			var __this__=this
			var content_type=response.getResponseHeader("Content-Type");
			if ( (((content_type === "text/javascript") || (content_type === "text/x-json")) || (content_type === "application/json")) )
			{
				return true
			}
			else if ( true )
			{
				return false
			}
		},	{
				arity:1,
				arguments:[{'name': 'repsonse'}]
			}),
		_parseJSON:_meta_(function(json){
			var __this__=this
			return eval(json)
		},	{
				arity:1,
				arguments:[{'name': 'json'}]
			}),
		_processHTTPResponse:_meta_(function(response){
			var __this__=this
			if ( ((__this__.options.forceJSON && __this__.options.evalJSON) || (__this__.options.evalJSON && __this__._responseIsJSON(response))) )
			{
				return __this__._parseJSON((("(" + response.responseText) + ")"))
			}
			else if ( true )
			{
				return response.responseText
			}
		},	{
				arity:1,
				arguments:[{'name': 'response'}]
			}),
		_encodeURI:_meta_(function(value){
			var __this__=this
			return encodeURIComponent(value)
		},	{
				arity:1,
				arguments:[{'name': 'value'}]
			})
	}
})
channels.SyncChannel=Extend.Class({
	// The SyncChannel will use the synchronous methods from the HTTP transport
	// object to do the communication.
	name:'channels.SyncChannel', parent:channels.Channel,
	initialize:_meta_(function(options){
		var __this__=this
		__this__.getSuper(channels.SyncChannel.getParent())(options)
		__this__.transport.get = channels.HTTPTransport.DEFAULT.getMethod("syncGet");
		__this__.transport.post = channels.HTTPTransport.DEFAULT.getMethod("syncPost");
	},	{
			arity:1,
			arguments:[{'name': 'options'}]
		})
})
channels.AsyncChannel=Extend.Class({
	// The AsyncChannel will use the asynchronous methods from the HTTP transport
	// object to do the communication.
	name:'channels.AsyncChannel', parent:channels.Channel,
	initialize:_meta_(function(options){
		var __this__=this
		__this__.getSuper(channels.AsyncChannel.getParent())(options)
		__this__.transport.get = channels.HTTPTransport.DEFAULT.getMethod("asyncGet");
		__this__.transport.post = channels.HTTPTransport.DEFAULT.getMethod("asyncPost");
	},	{
			arity:1,
			arguments:[{'name': 'options'}]
		})
})
channels.HTTPTransport=Extend.Class({
	// The 'HTTPTransport' is the low-level class used by channels to do HTTP
	// communication. This class really acts as a wrapper for platform-specific HTTP
	// communication implementations, taking care of returning 'Futures' instances to
	// be used by the channels.
	// 
	// All the futures returned by the HTTPTransport will give the HTTP request object
	// as-is. Particularly, the 'Channels' 
	name:'channels.HTTPTransport', parent:undefined,
	shared:{
		DEFAULT:undefined
	},
	initialize:_meta_(function(){
		var __this__=this
	},	{
			arity:0,
			arguments:[]
		}),
	methods:{
		syncGet:_meta_(function(url, body, future){
			var __this__=this
			body = body === undefined ? null : body
			future = future === undefined ? new channels.Future() : future
			var request=__this__._createRequest();
			Extend.print("SYNCHRONOUS GET")
			var response=__this__._processRequest(request, {"method":"GET", "body":body, "url":url, "asynchronous":false, "success":_meta_(function(v){
				future.set(v)
			},	{
					arity:1,
					arguments:[{'name': 'v'}]
				}), "failure":_meta_(function(v){
				future.fail(v.status, v.responseText)
			},	{
					arity:1,
					arguments:[{'name': 'v'}]
				})});
			return future
		},	{
				arity:3,
				arguments:[{'name': 'url'}, {'flags': '=', 'name': 'body'}, {'flags': '=', 'name': 'future'}]
			}),
		syncPost:_meta_(function(url, body, future){
			var __this__=this
			body = body === undefined ? null : body
			future = future === undefined ? new channels.Future() : future
			var request=__this__._createRequest();
			var response=__this__._processRequest(request, {"method":"POST", "body":body, "url":url, "asynchronous":false, "success":_meta_(function(v){
				future.set(v)
			},	{
					arity:1,
					arguments:[{'name': 'v'}]
				}), "failure":_meta_(function(v){
				future.fail(v.status, v.responseText)
			},	{
					arity:1,
					arguments:[{'name': 'v'}]
				})});
			return future
		},	{
				arity:3,
				arguments:[{'name': 'url'}, {'flags': '=', 'name': 'body'}, {'flags': '=', 'name': 'future'}]
			}),
		asyncGet:_meta_(function(url, future){
			var __this__=this
			future = future === undefined ? new channels.Future() : future
			var request=__this__._createRequest();
			var response=__this__._processRequest(request, {"method":"GET", "url":url, "asynchronous":true, "success":_meta_(function(v){
				future.set(v)
			},	{
					arity:1,
					arguments:[{'name': 'v'}]
				}), "failure":_meta_(function(v){
				future.fail(v.status, v.responseText)
			},	{
					arity:1,
					arguments:[{'name': 'v'}]
				})});
			return future
		},	{
				arity:2,
				arguments:[{'name': 'url'}, {'flags': '=', 'name': 'future'}]
			}),
		asyncPost:_meta_(function(url, body, future){
			var __this__=this
			body = body === undefined ? "" : body
			future = future === undefined ? new channels.Future() : future
			var request=__this__._createRequest();
			var response=__this__._processRequest(request, {"method":"POST", "body":body, "url":url, "asynchronous":true, "success":_meta_(function(v){
				future.set(v)
			},	{
					arity:1,
					arguments:[{'name': 'v'}]
				}), "failure":_meta_(function(v){
				future.fail(v.status, v.responseText)
			},	{
					arity:1,
					arguments:[{'name': 'v'}]
				})});
			return future
		},	{
				arity:3,
				arguments:[{'name': 'url'}, {'flags': '=', 'name': 'body'}, {'flags': '=', 'name': 'future'}]
			}),
		_createRequest:_meta_(function(){
			var __this__=this
			// If IE is used, create a wrapper for the XMLHttpRequest object
			if ( typeof(XMLHttpRequest) == "undefined" )
			{
				XMLHttpRequest = function(){return new ActiveXObject(
					navigator.userAgent.indexOf("MSIE 5") >= 0 ?
					"Microsoft.XMLHTTP" : "Msxml2.XMLHTTP"
				)}
			}
			return new XMLHttpRequest()
			
		},	{
				arity:0,
				arguments:[]
			}),
		// Processes the given HTTP request, taking into account the following
		// 'options':
		// 
		// - 'method', the HTTP method ('GET', 'POST', in uppercase)
		// - 'url', the requested url
		// - 'asynchronous' (default 'False'), to indicate wether the request should
		// be made in synchronous or asynchronous mode
		// - 'body' (default is '""') the optional request body
		// - 'headers' is a dictionary of headers to add to the request
		// - 'success', the callback that will be invoked on success, with the
		// request as argument
		// - 'failure', the callback that will be invoked on failure, with the
		// request argument
		// 
		_processRequest:_meta_(function(request, options){
			var __this__=this
			var on_request_complete=_meta_(function(state){
				Extend.print("REQUEST STATE", state, request.readyState)
				if ( (request.readyState == 4) )
				{
					if ( ((request.status >= 200) && (request.status < 300)) )
					{
						options.success(request)
					}
					else if ( true )
					{
						options.failure(request)
					}
				}
			},	{
					arity:1,
					arguments:[{'name': 'state'}]
				});
			request.onreadystatechange = on_request_complete;
			Extend.iterate(options.headers, _meta_(function(v, k){
				request.setRequestHeader(k, v)
			},	{
					arity:2,
					arguments:[{'name': 'v'}, {'name': 'k'}]
				}), __this__)
			request.open((options.method || "GET"), options.url, (options.asynchronous || false))
			return request.send((options.body || ""))
		},	{
				arity:2,
				arguments:[{'name': 'request'}, {'name': 'options'}]
			})
	}
})
channels.init=	_meta_(function(){
		var __this__=channels;
		channels.HTTPTransport.DEFAULT = new channels.HTTPTransport();
	},	{
			arity:0,
			arguments:[]
		})
channels.init()
