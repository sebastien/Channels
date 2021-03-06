# -----------------------------------------------------------------------------
# Project   : Channels
# -----------------------------------------------------------------------------
# Author    : Sebastien Pierre                            <sebastien@ffctn.com>
# License   : Revised BSD License
# -----------------------------------------------------------------------------
# Creation  : 10-Aug-2006
# Last mod  : 05-Jul-2012
# -----------------------------------------------------------------------------

@module  channels
@version 1.1.1
@target  JavaScript
| The channels module defines objects that make JavaScript client-side HTTP
| communication easier by providing the 'Future' and 'Channel' abstractions
| well known from some concurrent programming languages and frameworks.

@shared IS_IE = (navigator userAgent indexOf "MSIE" >= 0)
@shared ExceptionHandler = {e|print ("channels.ExceptionHandler: " + e);raise (e)}

# TODO: Abstract Channels and Futures from HTTP
# TODO: Refactor _failureStatus and _failureReason into something more useful
#
# -----------------------------------------------------------------------------
#
# RENDEZ-VOUS CLASS
#
# -----------------------------------------------------------------------------

@class RendezVous
| A rendez-vous allows to set a callback that will be invoked when an
| expected number of participant is reached. This is similar to the Semaphore
| construct, excepted that it is "inversed".

	@property expected      = 0
	@property participants  = []
	@property meetCallbacks = []
	
	@constructor expected=0
	| Creates a new rendez-vous with the 'expected' number of participants
		self expected = expected
	@end

	@method register futures...
		futures :: {_|
			increaseExpected ()
			_ onSucceed {join(_)}
		}
		return self
	@end

	@method setExpected value
	| Set the expected 'value'. This will trigger the callbacks registered with the
	| 'onMeet' method.
		self expected = value
		trigger ()
	@end

	@method increaseExpected
		setExpected (expected + 1)
	@end

	@method join participant=None
	| Called by a participant when it joins the rendez-vous. The given 'participant'
	| value will be added to the list of participants.
		participants push (participant)
		trigger ()
	@end
	
	@method bind callback
	| An alias to 'onMeet' added for 'eventbus.EventSource' compatibility
		return onMeet (callback)
	@end

	@method onMeet callback
	| Registers a callback that will be invoked with this rendez-vous when it
	| is met. If the rendez-vous is already met, the callback will be invoked
	| directly.
		if callback
			meetCallbacks push (callback)
			if isMet ()
				callback (self)
			end
		end
		return this
	@end

	@method trigger
	| Invokes the 'onMeet' callbacks when the number of participants is greater
	| or equal to the expected number of partipiants.
		if isMet () -> meetCallbacks :: {c|c(self)}
	@end

	@method isMet
	| Tells if the rendez-vous has been met or not
		return participants length >= expected 
	@end

	@method count
		return participants length
	@end

@end

# -----------------------------------------------------------------------------
#
# Future Class
#
# -----------------------------------------------------------------------------

# TODO: Separate future
# TODO: Add cancel
# TODO: Add Lock, Mutex, Semaphore and 
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

	@shared   STATES   = {WAITING:1,SET:2,FAILED:3,CANCELLED:4}
	@shared   FAILURES = {GENERAL:"FAILURE",TIMEOUT:"TIMEOUT",EXCEPTION:"EXCEPTION"}
	@property retries = 0
	| Counts the number of retries since last success. This is only incremented when
	| 'retry' is invoked.
	@property _value
	@property _rawValue
	| The raw value is the unprocessed value. In case Future have no processors, '_rawValue' is '_value'
	@property _failureStatus
	@property _failureReason
	@property _failureContext
	# FIXME: Lazily create these
	@property _processors        = []
	@property _onSet:<[]>        = []
	@property _onPartial:<[]>    = []
	@property _onFail:<[]>       = []
	@property _onException:<[]>  = []
	@property _onCancel:<[]>     = []
	@property _onRefresh:<Function>
	@property _origin
	| The Future origin allows to reference an object that is responsible for
	| setting the value of the future.
	| For instance, HTTP channels will set the future _origin to be the resulting
	| HTTP response, so that the headers can be extracted from the response.
	@property state

	@constructor
		state = STATES WAITING
	@end

	@method set value
	| Sets the value for this future. This function can be given as a callback
	| for an underlying asynchronous system (such as MochiKit Defered).
		_rawValue = value
		_value    = value
		state     = STATES SET
		_processors :: {p|
			if state == STATES SET
				try
					_value = p(_value, self)
				catch e
					_handleException (e)
				end
			end
		}
		# Processors may alter the state
		if state == STATES SET
			_onSet      :: {c|
				try
					c(_value, self)
				catch e
					_handleException (e)
				end
			}
		end
		return self
	@end

	@method setPartial value
	| Some future values may be updated sequentially, this happens when you do a
	| request to a streaming HTTP service (also known as Comet).
		_value = value
		_onPartial      :: {c|
			try
				c(_value, self)
			catch e
				_handleException (e)
			end
		}
		return self
	@end

	@method get
	| This is an alias for 'value'
		return value()
	@end

	@method cancel
	| Cancels the retrieval of the value. This will invoke the onCancel callbacks, only
	| if the Future state is WAITING.
		if state == STATES WAITING
			state = STATES CANCELLED
			_onCancel :: {c|
				try
					c(_value,self)
				catch e
					_handleException (e)
				end
			}
		end
	@end

	@method value
	| Returns the value for this future. This will return 'Undefined' until the
	| value is set. If you want to know if the value is set you can query the
	| 'state' property of the future or invoke the 'isSet' method.
		return _value
	@end

	@method rawValue
	| Returns the raw (unprocessed) value, which might be the same as value
	| in case the value was unprocessed.
		return _rawValue
	@end

	@method fail status=(FAILURES GENERAL), reason=Undefined, context=Undefined
	| Fails this future with the given (optional) 'status' (machine-readbale
	| code), 'reason' (human-readable string) and context (the value that
	| originated the failure). 
	|
	| >   future fail ( f FAILURES TIMEOUT,  "Timeout of 2000ms exceeded")
	|
	| Could mean to the application that the future failed because the timeout
	| value of 2000 was reached.
		state = STATES FAILED
		_failureStatus  = status
		_failureReason  = reason
		_failureContext = context
		_onFail :: {c|
			try
				c(status,reason,context,self)
			catch e
				_handleException (e)
			end
		}
		return self
	@end

	@method isSet
	| Tells if this future value was set or not.
		return (state == STATES SET)
	@end

	@method isCancelled
	| Tells if this future value was cancelled
		return (state == STATES CANCELLED)
	@end

	@method hasFailed
	| Tells if this future has failed or not
		return (state == STATES FAILED)
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
		if hasSucceeded ()
			try
				callback (_value, self)
			catch e
				_handleException(e)
			end
		end
		return self
	@end
	
	@method onPartial callback
	| Registers the given callback to be invoked when this future value is
	| partially set. Some values (especially those coming from streaming sources)
	| may be received in success "packets". Callbacks will be invoked with the
	| partial value and this future as argument.
	| 
	| Note that the value will not be processed, as it is partial.
		_onPartial push (callback)
		return self
	@end

	@method onSucceed callback
	| This is just an alias for 'onSet', as if you use 'onFail' often,
	| you'll be tempted to use 'onSucceed' as well.
		return onSet (callback)
	@end

	@method onFail callback
	| Registers the given callback to be invoked when this future fails.
	| The callback takes the following arguments:
	|
	| - the 'status' for the failure (ie. machine-readable description of the error)
	| - the 'reason' for the failure (ie. human-readable description of the error)
	| - the 'context' for the exception, so that clients have the opportunity
	| - the 'future' in which the failure happened
	|
	| Example:
	|
	| >    # s = status, r = reason, c = context, f = future
	| >    future onFail {s,r,c,f| print ("Future", f, "failed: with code", s, " reason is ", r, "in context", c)}
	|
	|
	| NOTE: failures and exceptions are different things, a failure means that the
	| future won't have its value set (because something happened in the pipe), while
	| an exception means that the code broke at some point.
		#assert callback, "Callback is required"
		_onFail push (callback)
		if hasFailed ()
			try
				callback (_value, self)
			catch e
				_handleException(e)
			end
		end
		return self
	@end

	@method onException callback
	| Registers a callback to handle exceptions that may happen when executing the
	| onFail or onSucceed callbacks. Exception callbacks are added LIFO and are chained:
	| each callback takes the exception 'e' and the future 'f' as parameters, and will
	| block propagation to the next by returning 'False'.
		_onException splice (0,0,callback)
		return self
	@end

	@method onCancel callback
	| Registers the given callback to be executed when the future is cancelled. Usually, it is the
	| process that creates the Future that will register an 'onCancel' callback first. For instance,
	| an Future returned by an HTTP Request would have an onCancel callback that would just close the
	| associated HTTP request.
		_onCancel splice (0,0,callback)
		return self
	@end

	@method getFailureStatus
	| Returns the status for the error. The status is a machine-readable code.
		return _failureStatus
	@end

	@method getFailureReason
	| Returns the reason for the error. The reason is a human-readable string.
		return _failureReason
	@end

	@method getFailureContext
	| Returns the context in which the failure happened. For HTTP channels, this
	| will be the reference to the HTTP request that failed.
		return _failureContext
	@end

	@method setOrigin origin
	| Sets the object that originate this future. HTTP channels will set the
	| XMLHttpRequest object as the origin of the future.
		_origin = origin
		return self
	@end

	@method getOrigin
		return self _origin
	@end

	@method _handleException e
	| Invoked when a future had and exception. This invokes every callback registered
	| in the 'onException' list (which were previously registered using the
	| 'onFail' method).
		var i = 0
		var r = True
		while i < _onException length
			if _onException [i](e,this) == False
				i = exceptionCallbacks length + 1
				r = False
			end
			i += 1
		end
		# If there is no callback, we print the exception
		if i == 0
			ExceptionHandler (e)
		end
		return r
	@end

	@group Extensions

		@method refresh
		| Refreshing a future will basically invoke the 'refresh' callback set
		| with the 'onRefresh' function. Typical use of 'refresh' is to take an
		| existing future and to bind the function that created the value as
		| 'refresh', so that getting a "fresher" value can simply be done
		| by calling 'refresh'.
		|
		| Example:
		|
		| >    var c = new channels SyncChannel ()
		| >    var f = c get "this/url"
		| >
		| >    # We bind a refresh function
		| >    f onRefresh {c get ("this/url", f)}
		| >    
		| >    # We bind success callbacks
		| >    f onSucceed {d|print ("Received:",d}
		| >    
		| >    # We should see that the data was received
		| >    # and if we refresh, we should see the
		| >    # 'Reveived:...' text again
		| >    f refresh ()
		| >    
		| >    # And we can call refresh multiple times
		| >    f refresh ()
		|
		| It's particularly useful to use 'refresh' along with 'process',
		| especially when you're querying URLs frequently.
			state = STATES WAITING
			if _onRefresh -> _onRefresh (self)
			return self
		@end

		@method retry maxRetry=5
		| Refreshes the Future (which means that you should set an
		| 'onRefresh' callback). If the number of 'retries' for this
		| future is less than 'maxRetry', then the refresh will be made
		| and 'True' will be returned. Otherwise 'False' is returned.
			if retries < maxRetry
				retries += 1
				refresh ()
				return True
			else
				return False
			end
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
			if isSet() -> callback(_value)
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
		forceJSON : False
	}

	@property transport = HTTPTransport DEFAULT

	@property failureCallbacks   = []
	@property exceptionCallbacks = []

	@constructor options={}
		if isString(options)
			self options prefix = options
		else
			options :: {v,k| self options [k] = v }
		end
	@end

	@method isAsynchronous
		return undefined
	@end

	@method isSynchronous
		return undefined
	@end

	@method get url, body=None, headers=[], future=Undefined
	| Invokes a 'GET' to the given url (prefixed by the optional 'prefix' set in
	| this channel options) and returns a 'Future'.
	|
	| The future is already bound with a 'refresh' callback that will do the
	| request again.
	|
	| GET means retrieve whatever data is identified by the URI, so where the
	| URI refers to a data-producing process, or a script which can be run by
	| such a process, it is this data which will be returned, and not the source
	| text of the script or process. Also used for searches .
		return request ("GET", url, body, headers, future)
	@end

	@method head url, body=None, headers=[], future=Undefined
		return request ("HEAD", url, body, headers, future)
	@end

	@method post url, body=None, headers=[], future=Undefined
	| Invokes a 'POST' to the give url (prefixed by the optional 'prefix' set in
	| this channel options), using the given 'body' as request body, and
	| returning a 'Future' instance.
	|
	| The future is already bound with a 'refresh' callback that will do the
	| request again.
	|
	| POST xreates a new object linked to the specified object. The message-id
	| field of the new object may be set by the client or else will be given by
	| the server. A URL will be allocated by the server and returned to the
	| client. The new document is the data part of the request. It is considered
	| to be subordinate to the specified object, in the way that a file is
	| subordinate to a directory containing it, or a news article is subordinate
	| to a newsgroup to which it is posted. 
		return request ("POST", url, body, headers, future)
	@end

	@method put url, body=None, headers=[], future=Undefined
	| Specifies that the data in the body section is to be stored under the
	| supplied URL. The URL must already exist. The new contenst of the document
	| are the data part of the request. POST and REPLY should be used for
	| creating new documents.
		return request ("PUT", url, body, headers, future)
	@end

	@method update url, body=None, headers=[], future=Undefined
		return request ("UPDATE", url, body, headers, future)
	@end

	@method delete url, body=None, headers=[], future=Undefined
		return request ("DELETE", url, body, headers, future)
	@end

	@method trace url, body=None, headers=[], future=Undefined
		return request ("TRACE", url, body, headers, future)
	@end

	@method request method, url, body=None, headers=[], future=Undefined
	| Generic function to create an HTTP request with the given parameters
		var request_url   = options prefix + url
		var request_body  = None
		
		if method toUpperCase() == "GET"
			if body
				request_url = AddParameters(request_url, body)
			end
		else
			if body
				request_body = NormalizeBody(body)
				# If the body is different, it means we've form-encoded the body, and we have
				# to add the appropriate headers
				if body != request_body
					headers push (
						["Content-Type",   "application/x-www-form-urlencoded"]
						["Content-Length", request_body length]
					)
				end
			end
		end
		future         = transport request (isAsynchronous(), method, request_url, request_body, headers, future or _createFuture(), self options)
		future onRefresh {f| return request (method, url, request_body, headers, f) }
		return future
	@end

	@method onFail callback
	| Sets a callback that will be invoked when a future created in this channel
	| fails. The given 'callback' takes the _reason_, _details_ and _future_ as
	| argument, where reason and details are application-specific information
	| (for HTTP, reason is usually a number, detail is the response text)
		failureCallbacks push (callback)
	@end

	@method onException callback
	| Sets a callback that will be invoked when a future created in this channel
	| raises an exception. The given 'callback' takes the _exceptoin_ and _future_ as
	| arguments. Callbacks are inserted in LIFO style, if a callback returns 'False',
	| propagation of the exception will stop.
		exceptionCallbacks splice (0,0,callback)
	@end

	@group Futures
	| These methods are related to the creation and lifecycle of futures used in
	| this channel.

		@method _createFuture
		| Returns a new future, properly initialized for this channel
			var future = new Future ()
			future onFail      ( _futureHasFailed )
			future onException ( _futureHadException )
			future process     ( _processHTTPResponse )
			future getException = {return eval ("(" + future getFailureContext () getResponseHeader "X-Exception" + ")")}
			return future
		@end

		@method _futureHasFailed reason, details, future
		| Invoked when a future has failed. This invokes every callback registered
		| in the 'failureCallbacks' list (which were previously registered using the
		| 'onFail' method).
			failureCallbacks :: {c|c(reason,details,future)}
		@end

		@method _futureHadException e, future
		| Invoked when a future had and exception. This invokes every callback registered
		| in the 'exceptionCallbacks' list (which were previously registered using the
		| 'onFail' method).
			# FIXME: What's the difference with handleException?
			var i = 0
			var r = True
			while i < exceptionCallbacks length
				if exceptionCallbacks[i](e,future) == False
					i = exceptionCallbacks length + 1
					r = False
				end
				i += 1
			end
			# If there is no callback, we print the exception
			if i == 0
				ExceptionHandler (e)
			end
			return r
		@end

	@end

	@group HTTP
	| These are methods that are all specific to the HTTP protocol

		@operation ToFormData value, prefix="", result=Undefined
		| Encodes the given value as form data, following the Rails/Grails convention
			if not isDefined(result)
				return ToFormData(value, "", []) join "&\n"
			else
				var sep = (prefix length > 0 and ".") or ""
				if extend isMap  (value)
					value :: {v,k|ToFormData(v, prefix + sep + k, result)}
				if extend isList (value)
					value :: {v,i|ToFormData(v, prefix + sep + i, result)}
				else
					result push ((prefix or "value") + "=" + encodeURIComponent(value))
				end
				return result
			end
		@end


		@operation ResponseIsJSON response
			var content_type = response getResponseHeader "Content-Type" split ";" [0]
			if content_type is "text/javascript" or content_type is "text/x-json" or content_type is "application/json"
				return True
			else
				return False
			end
		@end

		@operation ParseJSON json
			# NOTE: In Safari, we cannot evalute from the window namespace, so we have
			# to do it from a closure
			return {return eval( "(" + json + ")")}()
		@end

		@operation AddParameters url, parameters
			var query_index = url indexOf "?"
			var has_params  = query_index != -1
			if not isString(parameters)
				var p = []
				parameters :: {v,k|p push (k + "=" + EncodeURI(v))}
				parameters = p join "&"
			end
			if has_params
				if query_index == (url length - 1)
					return url + parameters
				else
					return url + "&" + parameters
				end
			else
				if parameters
					return url + "?" + parameters
				else
					return url
				end
			end
		@end

		@operation NormalizeBody body
		@as internal
			if isString(body)
				return body
			if extend isNumber(body)
				return "" + body
			if extend isObject(body) or extend isList(body)
				if extend isDefined(FormData) and (body constructor == FormData)
					return body
				else
					var new_body = ""
					var values   = []
					body :: {v,k|values push (k + "=" + EncodeURI (v))}
					body = values join "&"
					return body
				end
			else
				return (body or '') + ""
			end
		@end

		@operation EncodeURI value
			return encodeURIComponent(value)
		@end

		@method _processHTTPResponse response
			if (options forceJSON and options evalJSON ) or (options evalJSON and Channel ResponseIsJSON(response))
				return Channel ParseJSON ( response responseText )
			else
				return response responseText
			end
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
	@end
	@method isAsynchronous
		return False
	@end
	@method isSynchronous
		return True
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
	@end
	@method isAsynchronous
		return True
	@end
	@method isSynchronous
		return False
	@end
@end

# -----------------------------------------------------------------------------
#
# Burst Channel Class
#
# -----------------------------------------------------------------------------

@class BurstChannel: AsyncChannel
| The BurstChannel is a specific type of AsyncChannel that is capable of
| tunneling HTTP requests in HTTP.

	@property channelURL      = Undefined
	@property onPushCallbacks = []
	@property requestsQueue   = []

	@constructor url, options
		super (options)
		channelURL = url or "/channels:burst"
	@end

	@method onPush callback
	| Registers a callback that will be called when something is 'pushed' into
	| the channel (a GET, POST, etc). The callback can query the channel status
	| and decide to explicitly flush the 'requestsQueue', or just do nothing.
	|
	| FIXME: WHAT ARGUMENTS ?
		onPushCallbacks push (callback)
	@end

	@method _pushRequest request
		requestsQueue push (request)
	@end

	@method _sendRequests requests
		var boundary = "8<-----BURST-CHANNEL-REQUEST-------"
		var headers = [
			["X-Channel-Boundary",      boundary]
			["X-Channel-Type",          "burst"]
			["X-Channel-Requests",      "" + (requests length)]
		]
		var request_as_text = []
		var futures = []
		for r in requests
			var t = r method + " " + r url + "\r\n"
			r headers :: {h| t += h[0] + ": " + h[1] + "\n"}
			t    += "\r\n"
			t    += r body
			request_as_text push (t)
			futures push (r future)
		end
		var body = request_as_text join (boundary + "\n")
		var f    = transport request ( True, "POST", channelURL, body, headers )
		f onSet  {v| _processResponses(v,futures) }
		f onFail {s,r,c,f| futures :: {f|f fail(s,r,c)}}
	@end

	@method _processResponses response, futures
	| This is the callback attached to composite methods
		var text = response responseText
		var boundary = response getResponseHeader ("X-Channel-Boundary")
		if not boundary
			futures :: {f|f fail "Server did not provide X-Channel-Boundary header"}
		else
			var i = 0
			for r in text split (boundary)
				r = {return eval("(" + r + ")")} ()
				r responseText = r body
				r getHeader = {h|
					h = h toLowerCase ()
					result = Undefined
					for header in r headers
						if header[0] toLowerCase() == h
							result = header[1]
						end
					end
					return result
				}
				r getResponseHeader = {h|return r getHeader(h) or response getResponseHeader(h)}
				futures [i] set (r)
				i += 1
			end
		end
	@end

	@method flush filter={return True}
	| Flushes the 'requestsQueue', using the given 'filter' function. For every request in
	| 'requestsQueue', if 'filter(r)' is 'True', then the request is sent to the server
	| in a composite request.
		var remaining = []
		var flushed   = []
		requestsQueue :: {r|
			if filter (r)

				flushed push (r)
			else
				remaining push (r)
			end
		}
		requestsQueue = remaining
		_sendRequests (flushed)
	@end

	@method get url, body=None, future=Undefined
	| Invokes a 'GET' to the given url (prefixed by the optional 'prefix' set in
	| this channel options) and returns a 'Future'.
	|
	| The future is already bound with a 'refresh' callback that will do the
	| request again.
		var request = {method:"GET",url:url, body:body,future:(future or _createFuture())}
		_pushRequest(request)
		return request future
	@end

	@method post url, body=None, future=Undefined
	| Invokes a 'POST' to the give url (prefixed by the optional 'prefix' set in
	| this channel options), using the given 'body' as request body, and
	| returning a 'Future' instance.
	|
	| The future is already bound with a 'refresh' callback that will do the
	| request again.
		var request = {method:"POST",url:url,body:body,future:(future or _createFuture())}
		_pushRequest(request)
		return request future
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
|
| In case the transports fails to complete the request, the future 'fail' method
| will be invoked with the follwing arguments:
|
| - 'request status' as status for the failure (ie.
|    machine-readable description of the error)
| - 'request responseText' as the reason for the failure (ie.
|    human-readable description of the error)
| - 'request' as the context for the exception, so that clients have the opportunity
|    to get more information from the reques itself, like headers.

	@shared DEFAULT

	@constructor
	@end

	@method request async, method, url, body=None, headers=[], future=(new Future()), options={}
		var request  = _createRequest ()
		future setOrigin (request)
		future onCancel {request abort ()}
		var response = _processRequest (request,{
			method       : method
			body         : body
			url          : url
			headers      : headers
			asynchronous : async
			timestamp    : options timestamp
			success      : {v| future set  (v) }
			failure      : {v| future fail (v status, v responseText, v) }
			loading      : {v|
				var response = ""
				# In somer versions of IE, this might generate an exception
				try
					response = v responseText
				catch e
					response = ""
				end
				future setPartial (response)
			}
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
	| - 'loading', the callback that will be invoked when the request is 
	|    loading, with the request as argument.
	| - 'failure', the callback that will be invoked on failure, with the
	|    request as argument.
	| - 'timestamp', if 'True' will add an additional 'timestamp' parameter to
	|   the request, with the current time. This can prevent some browsers
	|   (notably IE) to cache a response that you don't want to cache (even if you
	|   specify no-cache, or things like this in the response).
		var callback_was_executed = False
		var on_request_loading    = {state|
			if options loading
				options loading (request)
			end
		}
		var on_request_complete   = {state|
			callback_was_executed = True
			if request readyState == 3 and options loading
				options loading (request)
			if request readyState == 4
				if request status >= 200 and request status < 300
					options success (request)
				else
					options failure (request)
				end
			end
		}
		var asynchronous = (options asynchronous or False)
		# Timestamp allows to bypass client-side caching by making each request
		# a single URL (by adding the timestamp parameter". For now we only do
		# this for GET methods.
		# The '\v' == 'v' trick is to detect if we're using IE.
		# See <http://ur1.ca/52cs>
		if (options method == "GET" or options method == "HEAD" ) and (options timestamp or IS_IE)
			if options url indexOf "?" == -1
				options url += "?t" + ( new Date () getTime () )
			else
				options url += "&t" + ( new Date () getTime () )
			end
		end
		# We only want to ask the browser to use HTTP
		# 'onreadystatechange' in asynchronous mode, so that
		# we can catch any exceptions that options failure()
		# will throw.
		if asynchronous
			request onreadystatechange = on_request_complete
		end
		if extend isDefined (request upload)
			request upload addEventListener ("progress", on_request_loading, False)
		end
		request open (options method or "GET", options url, options asynchronous or False)
		# On FireFox, headers must be set after request is opened.
		# <http://developer.mozilla.org/en/docs/XMLHttpRequest>
		options headers :: {v,k|
			if isMap (options headers)
				request setRequestHeader (k, v)
			else
				request setRequestHeader (v[0],v[1]) 
			end
		}
		try
			request send (options body or '')
		catch e
			options failure (request, e)
		end
		# On FireFox, a synchronous request HTTP 'onreadystatechange' callback is
		# not executed, which means that we have to take care of it manually.
		# NOTE: When FireBug is enabled, this doesn't happen.. go figure !
		if (not callback_was_executed) and (not asynchronous)
			on_request_complete ()
		end
	@end

@end

@function parameterize data:Map
	assert (isMap (data), "channels.parameterize expects a map")
	var result = Undefined
	data :: {value,key|
		var r = encodeURIComponent(key) + "=" + encodeURIComponent(value)
		if result is Undefined
			result = r
		else
			result += "&" + r
		end
	}
	return result
@end
# TODO: Rewrite when Sugar supports initialize
HTTPTransport DEFAULT = new HTTPTransport ()

# EOF
