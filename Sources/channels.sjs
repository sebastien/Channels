# -----------------------------------------------------------------------------
# Project   : Channels
# -----------------------------------------------------------------------------
# Author    : Sebastien Pierre                               <sebastien@ivy.fr>
# License   : Revised BSD License
# -----------------------------------------------------------------------------
# Creation  : 10-Aug-2006
# Last mod  : 23-Jan-2008
# -----------------------------------------------------------------------------

@module  channels
@version 0.7.2 (22-Jan-2008)
@target  JavaScript
| The channels module defines objects that make JavaScript client-side HTTP
| communication easier by providing the 'Future' and 'Channel' abstractions
| well known from some concurrent programming languages and frameworks.

# TODO: Abstract Channels and Futures from HTTP
#
# -----------------------------------------------------------------------------
#
# Future Class
#
# -----------------------------------------------------------------------------

@class Future
| A Future represents the promise of a future value returned by an invocation
| that started an asynchronous process. In other words, a future is a value that
| ''wraps the future value'' that will be later returned by a process that is
| not able to give the value directly.
|
| The typical use of Futures is when you are doing networking, such as
| asynchronous HTTP GETs on a web client: you won't have the response directly
| (because the HTTP GET is synchronous) but you may want to do things in the
| meantime.
|
| Futures provide an interesting abstraction to deal with these situations.
| This implementation of Futures was inspired from the Oz programming language.

	@shared   STATES  = {WAITING:1,SET:2,FAILED:3}
	@shared   REASONS = {FAILURE:"failure",TIMEOUT:"timeout",EXCEPTION:"exception"}
	@property _value
	@property _errorReason
	@property _errorDetails
	@property _processors   = []
	@property _onSet:<[]>   = []
	@property _onFail:<[]>  = []
	@property _onRefresh:<Function>
	@property state

	@constructor
		state = STATES WAITING
	@end

	@method set value
	| Sets the value for this future. This function can be given as a callback
	| for an underlying asynchronous system (such as MochiKit Defered).
		_value = value
		state  = STATES SET
		_processors :: {p| _value = p(_value)}
		_onSet      :: {c| c(_value, self) }
		return self
	@end

	@method get
	| This is an alias for 'value'
		return value()
	@end

	@method value
	| Returns the value for this future. This will return 'Undefined' until the
	| value is set. If you want to know if the value is set you can query the
	| 'state' property of the future or invoke the 'isSet' method.
		return _value
	@end

	@method fail reason=(REASONS FAILURE), details=Undefined
	| Fails this future with the given (optional) 'reason' and 'details'. The
	| 'reason' should be a value from the 'REASONS' dictionary, and the context
	| an object (probably a dictionary) that gives more detailed information on
	| the failure.
	|
	| >   future fail ( "timeout", 2000 ) 
	|
	| Could mean to the application that the future failed because the timeout
	| value of 2000 was reached.
		state = STATES FAILED
		_errorReason  = reason
		_errorDetails = details
		_onFail :: {c| c(reason,details,self) }
		return self
	@end

	@method isSet
	| Tells if this future value was set or not.
		return (state is STATES SET)
	@end

	@method hasFailed
	| Tells if this future has failed or not
		return (state is STATES FAILED)
	@end

	@method hasSucceeded
	| Tells if this future has succeeded or not (this is an alias for 'isSet')
		return isSet()
	@end

	@method onSet callback
	| Registers the given callback to be invoked when this future value is set.
	| The callback will take the value as first argument and the future as
	| second argument.
	|
	| >    future onSet {v,f| print ("Received value", v, "from future", f)}
		#assert callback, "Callback is required"
		_onSet push (callback)
		if isSet() -> callback (_value, self)
		return self
	@end

	@method onSucceed callback
	| This is just an alias for 'onSet', as if you use 'onFail' often,
	| you'll be tempted to use 'onSucceed' as well.
		return onSet (callback)
	@end

	@method onFail callback
	| Registers the given callback to be invoked when this future fails.
	| The callback will take the error reason and error details as first two
	| arguments, and the future as third argument.
	|
	| >    future onFail {r,d,f| print ("Future", f, "failed: reason is ", r, ", ", d)}
		#assert callback, "Callback is required"
		_onFail push (callback)
		if isSet() -> callback (_value, self)
		return self
	@end

	@method getErrorReason
	| Returns the reason for the error. This is only set when the future has failed.
		return _errorReason
	@end

	@method getErrorDetails
	| Returns the details for the error. This is only set when the future has failed.
		return _errorDetails
	@end

	@group Extensions

		@method refresh
		| Refreshing a feature will basically invoke the 'refresh' callback set
		| with the 'onRefresh' function. Typical use of 'refresh' is to take an
		| existing future and to bind the function that created the value as
		| 'refresh', so that getting a "fresher" value can simply be done
		| by calling 'refresh'.
		|
		| Example:
		|
		| >    var i = 0
		| >    var f = new Future()
		| >    var p = { f set (i) ; i += 1 }
		| >    f onRefresh (p)
		| >    p()
		| >    print ("i =", f get())
		| >    f refresh()
		| >    print ("i =", f get())
		| >    f refresh()
		| >    print ("i =", f get())
		|
		| Will print
		|
		| >    i = 0
		| >    i = 1
		| >    i = 2
			state = STATED WAITING
			if _onRefresh -> _onRefresh (self)
			return self
		@end

		@method onRefresh callback
		| Sets the callback that will be invoked with this future as argument
		| when the 'refresh' method is invoked. There can be only one refresh
		| callback per future, which means that the previous refresh function
		| will be replaced by the newly given callback.
		|
		| See 'refresh' for an example.
			_onRefresh = callback
			return self
		@end

		@method process callback
		| Adds a callback that will process the value of this future, returning
		| the newly processed value. Processing callback will be chained, and
		| will work even if the future value is already set.
		| 
		| Processors are typically used to process the value obtained from a
		| future.
		|
		| >    var future = getFutureResult()
		| >    future process { v | v toLowerCase() }
		| >    future onSet   { v | print ("Lowercase value: " + v) }
		|
		| It is a good idea to use processors along with the 'refresh' option,
		| so that you can easily set up a chain of processing the future value.
			#assert callback
			_processors push (callback)
			if isSet() -> _value = callback(_value)
			return self
		@end

	@end

@end

# -----------------------------------------------------------------------------
#
# Channel Class
#
# -----------------------------------------------------------------------------

@class Channel
| Channels are specific objects that allow communication operations to happen
| in a shared context. The modus operandi is as follows:
|
| - You initialize a channel with specific properties (for HTTP, this would
|   be a prefix for the URLs, wether you want to evaluate the JSON that may
|   be contained in responses, etc).
| - You send something into the channel (typically an HTTP request)
| - You get a 'Future' as a promise for a future result.
| - When the result arrives, the future is set with the resulting value.
|
| Synchronous channels will typically set the result directly, while for
| asynchronous channels, the result will only be available later.
|
| NOTE: The current implementation of 'Channels' is very much HTTP-oriented. At
| a later point, the Channels class will be more generic, and will provide
| separate specific aspects for the HTTP protocol.

	@property options = {
		prefix    : ""
		evalJSON  : True
		forceJSON : True
	}

	@property transport = {
		get       : Undefined
		post      : Undefined
	}

	@property failureCallbacks = []

	@constructor options={}
		options :: {v,k| self options [k] = v }
	@end

	@method get url, body="", future=Undefined
	| Invokes a 'GET' to the given url (prefixed by the optional 'prefix' set in
	| this channel options) and returns a 'Future'.
	|
	| The future is already bound with a 'refresh' callback that will do the
	| request again.
		var get_url    = options prefix + url
		future         = transport get (get_url, body, future or _createFuture())
		future process ( _processHTTPResponse )
		future onRefresh {f| return get (url, f) }
		return future
	@end

	@method post url, body="", future=Undefined
	| Invokes a 'POST' to the give url (prefixed by the optional 'prefix' set in
	| this channel options), using the given 'body' as request body, and
	| returning a 'Future' instance.
	|
	| The future is already bound with a 'refresh' callback that will do the
	| request again.
		var post_url   = options prefix + url
		body           = _normalizeBody(body)
		future         = transport post (post_url, body, future or _createFuture()) process ( _processHTTPResponse )
		future onRefresh {f| return post (url, body, f) }
		return future
	@end

	@method onFail callback
	| Sets a callback that will be invoked when a future created in this channel
	| fails. The given 'callback' takes the _reason_, _details_ and _future_ as
	| argument, where reason and details are application-specific information
	| (for HTTP, reason is usually a number, detail is the response text)
		failureCallbacks push (callback)
	@end

	@group Futures
	| These methods are related to the creation and lifecycle of futures used in
	| this channel.

		@method _createFuture
		| Returns a new future, properly initialized for this channel
			var future = new Future ()
			future onFail ( _futureHasFailed )
			return future
		@end

		@method _futureHasFailed reason, details, future
		| Invoked when a future has failed. This invokes every callback registered
		| in the 'failureCallbacks' list (which were previously registered using the
		| 'onFail' method).
			failureCallbacks :: {c|c(reason,details,future)}
		@end

	@end

	@group HTTP
	| These are methods that are all specific to the HTTP protocol

		@method _normalizeBody body
		@as internal
			if ( typeof(body) != "string" )
				var new_body = ""
				body :: {v,k|
					new_body += k + "=" + _encodeURI (v) + "&"
				}
				body = new_body
			end
			return body or ''
		@end

		@method _responseIsJSON repsonse
			var content_type = response getResponseHeader "Content-Type"
			if content_type is "text/javascript" or content_type is "text/x-json" or content_type is "application/json"
				return True
			else
				return False
			end
		@end

		@method _parseJSON json
			return eval(json)
		@end

		@method _processHTTPResponse response
			if (options forceJSON and options evalJSON ) or (options evalJSON and _responseIsJSON(response))
				return _parseJSON ( "(" + response responseText + ")" )
			else
				return response responseText
			end
		@end

		@method _encodeURI value
			return encodeURIComponent(value)
		@end

	@end

@end

# -----------------------------------------------------------------------------
#
# Synchronous Channel Class
#
# -----------------------------------------------------------------------------

@class SyncChannel: Channel
| The SyncChannel will use the synchronous methods from the HTTP transport
| object to do the communication.
	@constructor options
		super (options)
		transport get  = HTTPTransport DEFAULT getMethod "syncGet"
		transport post = HTTPTransport DEFAULT getMethod "syncPost"
	@end
@end

# -----------------------------------------------------------------------------
#
# Asynchronous Channel Class
#
# -----------------------------------------------------------------------------

@class AsyncChannel: Channel
| The AsyncChannel will use the asynchronous methods from the HTTP transport
| object to do the communication.
	@constructor options
		super (options)
		transport get  = HTTPTransport DEFAULT getMethod "asyncGet"
		transport post = HTTPTransport DEFAULT getMethod "asyncPost"
	@end
@end

# -----------------------------------------------------------------------------
#
# HTTP Transport Class
#
# -----------------------------------------------------------------------------

@class HTTPTransport
| The 'HTTPTransport' is the low-level class used by channels to do HTTP
| communication. This class really acts as a wrapper for platform-specific HTTP
| communication implementations, taking care of returning 'Futures' instances to
| be used by the channels.
|
| All the futures returned by the HTTPTransport will give the HTTP request object
| as-is. Particularly, the 'Channels' 

	@shared DEFAULT

	@constructor
	@end

	@method syncGet url, body=None, future=(new Future())
		var request  = _createRequest ()
		var response = _processRequest (request,{
			method       : 'GET'
			body         : body
			url          : url
			asynchronous : False
			success      : {v| future set  (v) }
			failure      : {v| future fail (v status, v responseText) }
		})
		return future
	@end

	@method syncPost url, body=None, future=(new Future())
		var request  = _createRequest ()
		var response = _processRequest (request,{
			method       : 'POST'
			body         : body
			url          : url
			asynchronous : False
			success      : {v| future set  (v) }
			failure      : {v| future fail (v status, v responseText) }
		})
		return future
	@end

	@method asyncGet url, body=None, future=(new Future())
		var request  = _createRequest ()
		var response = _processRequest (request,{
			method       : 'GET'
			body         : body
			url          : url
			asynchronous : True
			success      : {v| future set  (v) }
			failure      : {v| future fail (v status, v responseText) }
		})
		return future
	@end

	@method asyncPost url, body="", future=(new Future())
		var request  = _createRequest ()
		var response = _processRequest (request,{
			method       : 'POST'
			body         : body
			url          : url
			asynchronous : True
			success      : {v| future set  (v) }
			failure      : {v| future fail (v status, v responseText) }
		})
		return future
	@end

	@method _createRequest
	@as internal
		@embed JavaScript
		|// If IE is used, create a wrapper for the XMLHttpRequest object
		|if ( typeof(XMLHttpRequest) == "undefined" )
		|{
		|	XMLHttpRequest = function(){return new ActiveXObject(
		|		navigator.userAgent.indexOf("MSIE 5") >= 0 ?
		|		"Microsoft.XMLHTTP" : "Msxml2.XMLHTTP"
		|	)}
		|}
		|return new XMLHttpRequest()
		@end
	@end

	@method _processRequest request, options
	@as internal
	| Processes the given HTTP request, taking into account the following
	|'options':
	|
	| - 'method', the HTTP method ('GET', 'POST', in uppercase)
	| - 'url', the requested url
	| - 'asynchronous' (default 'False'), to indicate wether the request should
	|    be made in synchronous or asynchronous mode
	| - 'body' (default is '""') the optional request body
	| - 'headers' is a dictionary of headers to add to the request
	| - 'success', the callback that will be invoked on success, with the
	|    request as argument
	| - 'failure', the callback that will be invoked on failure, with the
	|    request argument
	|
		var on_request_complete = {state|
			if request readyState == 4
				if request status >= 200 and request status < 300
					options success (request)
				else
					options failure (request)
				end
			end
		}
		request onreadystatechange = on_request_complete
		options headers :: {v,k| request setRequestHeader (k,v) }
		request open (options method or "GET", options url, options asynchronous or False)
		return request send (options body or '')
	@end

@end

# TODO: Rewrite when Sugar supports initialize
HTTPTransport DEFAULT = new HTTPTransport ()

# EOF
