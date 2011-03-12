// 8< ---[channels.js]---
// The channels module defines objects that make JavaScript client-side HTTP
// communication easier by providing the 'Future' and 'Channel' abstractions
// well known from some concurrent programming languages and frameworks.

var channels=channels||{}
var self=channels
channels.__VERSION__='0.9.5';
channels.IS_IE=(navigator.userAgent.indexOf('MSIE') >= 0)
channels.RendezVous=extend.Class({
	// A rendez-vous allows to set a callback that will be invoked when an
	// expected number of participant is reached. This is similar to the Semaphore
	// construct, excepted that it is "inversed".
	name:'channels.RendezVous', parent:undefined,
	properties:{
		expected:undefined,
		participants:undefined,
		meetCallbacks:undefined
	},
	// Creates a new rendez-vous with the 'expected' number of participants
	initialize:function(expected){
		var self=this
		expected = expected === undefined ? 0 : expected
		if (typeof(self.expected)=='undefined') {self.expected = 0};
		if (typeof(self.participants)=='undefined') {self.participants = []};
		if (typeof(self.meetCallbacks)=='undefined') {self.meetCallbacks = []};
		self.expected = expected;
	},
	methods:{
		// Set the expected 'value'. This will trigger the callbacks registered with the
		// 'onMeet' method.
		setExpected:function(value){
			var self=this
			self.expected = value;
			self.trigger()
		},
		increaseExpected:function(){
			var self=this
			self.setExpected((self.expected + 1))
		},
		// Called by a particpant when it joins the rendez-vous. The given 'participant'
		// value will be added to the list of participants.
		join:function(participant){
			var self=this
			participant = participant === undefined ? null : participant
			self.participants.push(participant)
			self.trigger()
		},
		// Registers a callback that will be invoked with this rendez-vous when it
		// is met. If the rendez-vous is already met, the callback will be invoked
		// directly.
		onMeet:function(callback){
			var self=this
			if ( callback )
			{self.meetCallbacks.push(callback)}
			self.trigger()
			return this
		},
		// Invokes the 'onMeet' callbacks when the number of participants is greater
		// or equal to the expected number of partipiants.
		trigger:function(){
			var self=this
			if ( (self.participants.length >= self.expected) )
			{extend.iterate(self.meetCallbacks, function(c){
				c(self)
			}, self)}
		},
		count:function(){
			var self=this
			return self.participants.length
		}
	}
})
channels.Future=extend.Class({
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
		STATES:{'WAITING':1, 'SET':2, 'FAILED':3, 'CANCELLED':4},
		FAILURES:{'GENERAL':'FAILURE', 'TIMEOUT':'TIMEOUT', 'EXCEPTION':'EXCEPTION'}
	},
	properties:{
		retries:undefined,
		_value:undefined,
		_rawValue:undefined,
		_failureStatus:undefined,
		_failureReason:undefined,
		_failureContext:undefined,
		_processors:undefined,
		_onSet:undefined,
		_onPartial:undefined,
		_onFail:undefined,
		_onException:undefined,
		_onCancel:undefined,
		_onRefresh:undefined,
		_origin:undefined,
		state:undefined
	},
	initialize:function(){
		var self=this
		if (typeof(self.retries)=='undefined') {self.retries = 0};
		if (typeof(self._processors)=='undefined') {self._processors = []};
		if (typeof(self._onSet)=='undefined') {self._onSet = []};
		if (typeof(self._onPartial)=='undefined') {self._onPartial = []};
		if (typeof(self._onFail)=='undefined') {self._onFail = []};
		if (typeof(self._onException)=='undefined') {self._onException = []};
		if (typeof(self._onCancel)=='undefined') {self._onCancel = []};
		self.state = self.getClass().STATES.WAITING;
	},
	methods:{
		// Sets the value for this future. This function can be given as a callback
		// for an underlying asynchronous system (such as MochiKit Defered).
		set:function(value){
			var self=this
			self._rawValue = value;
			self._value = value;
			self.state = self.getClass().STATES.SET;
			extend.iterate(self._processors, function(p){
				if ( (self.state == self.getClass().STATES.SET) )
				{
					try {
						self._value = p(self._value, self);
					}
					catch(e){
						self._handleException(e)
					}
				}
			}, self)
			if ( (self.state == self.getClass().STATES.SET) )
			{
				extend.iterate(self._onSet, function(c){
					try {
						c(self._value, self)
					}
					catch(e){
						self._handleException(e)
					}
				}, self)
			}
			return self
		},
		// Some future values may be updated sequentially, this happens when you do a
		// request to a streaming HTTP service (also known as Comet).
		setPartial:function(){
			var self=this
			extend.iterate(self._onPartial, function(c){
				try {
					c(self._value, self)
				}
				catch(e){
					self._handleException(e)
				}
			}, self)
			return self
		},
		// This is an alias for 'value'
		get:function(){
			var self=this
			return self.value()
		},
		// Cancels the retrieval of the value. This will invoke the onCancel callbacks, only
		// if the Future state is WAITING.
		cancel:function(){
			var self=this
			if ( (self.state == self.getClass().STATES.WAITING) )
			{
				self.state = self.getClass().STATES.CANCELLED;
				extend.iterate(self._onCancel, function(c){
					try {
						c(self._value, self)
					}
					catch(e){
						self._handleException(e)
					}
				}, self)
			}
		},
		// Returns the value for this future. This will return 'Undefined' until the
		// value is set. If you want to know if the value is set you can query the
		// 'state' property of the future or invoke the 'isSet' method.
		value:function(){
			var self=this
			return self._value
		},
		// Returns the raw (unprocessed) value, which might be the same as value
		// in case the value was unprocessed.
		rawValue:function(){
			var self=this
			return self._rawValue
		},
		// Fails this future with the given (optional) 'status' (machine-readbale
		// code), 'reason' (human-readable string) and context (the value that
		// originated the failure). 
		// 
		// >   future fail ( f FAILURES TIMEOUT,  "Timeout of 2000ms exceeded")
		// 
		// Could mean to the application that the future failed because the timeout
		// value of 2000 was reached.
		fail:function(status, reason, context){
			var self=this
			status = status === undefined ? self.getClass().FAILURES.GENERAL : status
			reason = reason === undefined ? undefined : reason
			context = context === undefined ? undefined : context
			self.state = self.getClass().STATES.FAILED;
			self._failureStatus = status;
			self._failureReason = reason;
			self._failureContext = context;
			extend.iterate(self._onFail, function(c){
				try {
					c(status, reason, context, self)
				}
				catch(e){
					self._handleException(e)
				}
			}, self)
			return self
		},
		// Tells if this future value was set or not.
		isSet:function(){
			var self=this
			return (self.state === self.getClass().STATES.SET)
		},
		// Tells if this future has failed or not
		hasFailed:function(){
			var self=this
			return (self.state === self.getClass().STATES.FAILED)
		},
		// Tells if this future has succeeded or not (this is an alias for 'isSet')
		hasSucceeded:function(){
			var self=this
			return self.isSet()
		},
		// Registers the given callback to be invoked when this future value is set.
		// The callback will take the value as first argument and the future as
		// second argument.
		// 
		// >    future onSet {v,f| print ("Received value", v, "from future", f)}
		onSet:function(callback){
			var self=this
			self._onSet.push(callback)
			if ( self.hasSucceeded() )
			{
				try {
					callback(self._value, self)
				}
				catch(e){
					self._handleException(e)
				}
			}
			return self
		},
		// Registers the given callback to be invoked when this future value is
		// partially set. Some values (especially those coming from streaming sources)
		// may be received in success "packets". Callbacks will be invoked with the
		// partial value and this future as argument.
		// 
		// Note that the value will not be processed, as it is partial.
		onPartial:function(callback){
			var self=this
			self._onPartial.push(callback)
			return self
		},
		// This is just an alias for 'onSet', as if you use 'onFail' often,
		// you'll be tempted to use 'onSucceed' as well.
		onSucceed:function(callback){
			var self=this
			return self.onSet(callback)
		},
		// Registers the given callback to be invoked when this future fails.
		// The callback takes the following arguments:
		// 
		// - the 'status' for the failure (ie. machine-readable description of the error)
		// - the 'reason' for the failure (ie. human-readable description of the error)
		// - the 'context' for the exception, so that clients have the opportunity
		// - the 'future' in which the failure happened
		// 
		// Example:
		// 
		// >    # s = status, r = reason, c = context, f = future
		// >    future onFail {s,r,c,f| print ("Future", f, "failed: with code", s, " reason is ", r, "in context", c)}
		// 
		// 
		// NOTE: failures and exceptions are different things, a failure means that the
		// future won't have its value set (because something happened in the pipe), while
		// an exception means that the code broke at some point.
		onFail:function(callback){
			var self=this
			self._onFail.push(callback)
			if ( self.hasFailed() )
			{
				try {
					callback(self._value, self)
				}
				catch(e){
					self._handleException(e)
				}
			}
			return self
		},
		// Registers a callback to handle exceptions that may happen when executing the
		// onFail or onSucceed callbacks. Exception callbacks are added LIFO and are chained:
		// each callback takes the exception 'e' and the future 'f' as parameters, and will
		// block propagation to the next by returning 'False'.
		onException:function(callback){
			var self=this
			self._onException.splice(0, 0, callback)
		},
		// Registers the given callback to be executed when the future is cancelled. Usually, it is the
		// process that creates the Future that will register an 'onCancel' callback first. For instance,
		// an Future returned by an HTTP Request would have an onCancel callback that would just close the
		// associated HTTP request.
		onCancel:function(callback){
			var self=this
			self._onCancel.splice(0, 0, callback)
		},
		// Returns the status for the error. The status is a machine-readable code.
		getFailureStatus:function(){
			var self=this
			return self._failureStatus
		},
		// Returns the reason for the error. The reason is a human-readable string.
		getFailureReason:function(){
			var self=this
			return self._failureReason
		},
		// Returns the context in which the failure happened. For HTTP channels, this
		// will be the reference to the HTTP request that failed.
		getFailureContext:function(){
			var self=this
			return self._failureContext
		},
		// Invoked when a future had and exception. This invokes every callback registered
		// in the 'onException' list (which were previously registered using the
		// 'onFail' method).
		_handleException:function(e){
			var self=this
			var i=0;
			var r=true;
			while ((i < self._onException.length))
			{
				if ( (self._onException[i](e, this) == false) )
				{
					i = (exceptionCallbacks.length + 1);
					r = false;
				}
				i = (i + 1);
			}
			if ( (i == 0) )
			{
				extend.print(('channels.Future._handleException: ' + e))
			}
			return r
		},
		// Refreshing a future will basically invoke the 'refresh' callback set
		// with the 'onRefresh' function. Typical use of 'refresh' is to take an
		// existing future and to bind the function that created the value as
		// 'refresh', so that getting a "fresher" value can simply be done
		// by calling 'refresh'.
		// 
		// Example:
		// 
		// >    var c = new channels SyncChannel ()
		// >    var f = c get "this/url"
		// >
		// >    # We bind a refresh function
		// >    f onRefresh {c get ("this/url", f)}
		// >    
		// >    # We bind success callbacks
		// >    f onSucceed {d|print ("Received:",d}
		// >    
		// >    # We should see that the data was received
		// >    # and if we refresh, we should see the
		// >    # 'Reveived:...' text again
		// >    f refresh ()
		// >    
		// >    # And we can call refresh multiple times
		// >    f refresh ()
		// 
		// It's particularly useful to use 'refresh' along with 'process',
		// especially when you're querying URLs frequently.
		refresh:function(){
			var self=this
			self.state = self.getClass().STATES.WAITING;
			if ( self._onRefresh )
			{self._onRefresh(self)}
			return self
		},
		// Refreshes the Future (which means that you should set an
		// 'onRefresh' callback). If the number of 'retries' for this
		// future is less than 'maxRetry', then the refresh will be made
		// and 'True' will be returned. Otherwise 'False' is returned.
		retry:function(maxRetry){
			var self=this
			maxRetry = maxRetry === undefined ? 5 : maxRetry
			if ( (self.retries < maxRetry) )
			{
				self.retries = (self.retries + 1);
				self.refresh()
				return true
			}
			else if ( true )
			{
				return false
			}
		},
		// Sets the callback that will be invoked with this future as argument
		// when the 'refresh' method is invoked. There can be only one refresh
		// callback per future, which means that the previous refresh function
		// will be replaced by the newly given callback.
		// 
		// See 'refresh' for an example.
		onRefresh:function(callback){
			var self=this
			self._onRefresh = callback;
			return self
		},
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
		process:function(callback){
			var self=this
			self._processors.push(callback)
			if ( self.isSet() )
			{self._value = callback(self._value);}
			return self
		}
	}
})
channels.Channel=extend.Class({
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
		options:undefined,
		transport:undefined,
		failureCallbacks:undefined,
		exceptionCallbacks:undefined
	},
	initialize:function(options){
		var self=this
		options = options === undefined ? {} : options
		if (typeof(self.options)=='undefined') {self.options = {'prefix':'', 'evalJSON':true, 'forceJSON':false}};
		if (typeof(self.transport)=='undefined') {self.transport = channels.HTTPTransport.DEFAULT};
		if (typeof(self.failureCallbacks)=='undefined') {self.failureCallbacks = []};
		if (typeof(self.exceptionCallbacks)=='undefined') {self.exceptionCallbacks = []};
		if ( extend.isString(options) )
		{
			self.options.prefix = options;
		}
		else if ( true )
		{
			extend.iterate(options, function(v, k){
				self.options[k] = v;
			}, self)
		}
	},
	methods:{
		isAsynchronous:function(){
			var self=this
			return undefined
		},
		isSynchronous:function(){
			var self=this
			return undefined
		},
		// Invokes a 'GET' to the given url (prefixed by the optional 'prefix' set in
		// this channel options) and returns a 'Future'.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		// 
		// GET means retrieve whatever data is identified by the URI, so where the
		// URI refers to a data-producing process, or a script which can be run by
		// such a process, it is this data which will be returned, and not the source
		// text of the script or process. Also used for searches .
		get:function(url, body, headers, future){
			var self=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? undefined : future
			return self.request('GET', url, body, headers, future)
		},
		head:function(url, body, headers, future){
			var self=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? undefined : future
			return self.request('HEAD', url, body, headers, future)
		},
		// Invokes a 'POST' to the give url (prefixed by the optional 'prefix' set in
		// this channel options), using the given 'body' as request body, and
		// returning a 'Future' instance.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		// 
		// POST xreates a new object linked to the specified object. The message-id
		// field of the new object may be set by the client or else will be given by
		// the server. A URL will be allocated by the server and returned to the
		// client. The new document is the data part of the request. It is considered
		// to be subordinate to the specified object, in the way that a file is
		// subordinate to a directory containing it, or a news article is subordinate
		// to a newsgroup to which it is posted. 
		post:function(url, body, headers, future){
			var self=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? undefined : future
			return self.request('POST', url, body, headers, future)
		},
		// Specifies that the data in the body section is to be stored under the
		// supplied URL. The URL must already exist. The new contenst of the document
		// are the data part of the request. POST and REPLY should be used for
		// creating new documents.
		put:function(url, body, headers, future){
			var self=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? undefined : future
			return self.request('PUT', url, body, headers, future)
		},
		_RW_delete:function(url, body, headers, future){
			var self=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? undefined : future
			return self.request('DELETE', url, body, headers, future)
		},
		trace:function(url, body, headers, future){
			var self=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? undefined : future
			return self.request('TRACE', url, body, headers, future)
		},
		// Generic function to create an HTTP request with the given parameters
		request:function(method, url, body, headers, future){
			var self=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? undefined : future
			var request_url=(self.options.prefix + url);
			var request_body=null;
			if ( (method.toUpperCase() == 'GET') )
			{
				if ( body )
				{
					request_url = self.getClass().AddParameters(request_url, body);
				}
			}
			else if ( true )
			{
				if ( body )
				{
					request_body = self.getClass().NormalizeBody(body);
					if ( (body != request_body) )
					{
						headers.push(['Content-Type', 'application/x-www-form-urlencoded'], ['Content-Length', request_body.length])
					}
				}
			}
			future = self.transport.request(self.isAsynchronous(), method, request_url, request_body, headers, (future || self._createFuture()), self.options);
			future.onRefresh(function(f){
				return self.post(url, request_body, headers, f)
			})
			return future
		},
		// Sets a callback that will be invoked when a future created in this channel
		// fails. The given 'callback' takes the _reason_, _details_ and _future_ as
		// argument, where reason and details are application-specific information
		// (for HTTP, reason is usually a number, detail is the response text)
		onFail:function(callback){
			var self=this
			self.failureCallbacks.push(callback)
		},
		// Sets a callback that will be invoked when a future created in this channel
		// raises an exception. The given 'callback' takes the _exceptoin_ and _future_ as
		// arguments. Callbacks are inserted in LIFO style, if a callback returns 'False',
		// propagation of the exception will stop.
		onException:function(callback){
			var self=this
			self.exceptionCallbacks.splice(0, 0, callback)
		},
		// Returns a new future, properly initialized for this channel
		_createFuture:function(){
			var self=this
			var future=new channels.Future();
			future.onFail(self.getMethod('_futureHasFailed') )
			future.onException(self.getMethod('_futureHadException') )
			future.process(self.getMethod('_processHTTPResponse') )
			future.getException = function(){
				return eval((('(' + future.getFailureContext().getResponseHeader('X-Exception')) + ')'))
			};
			return future
		},
		// Invoked when a future has failed. This invokes every callback registered
		// in the 'failureCallbacks' list (which were previously registered using the
		// 'onFail' method).
		_futureHasFailed:function(reason, details, future){
			var self=this
			extend.iterate(self.failureCallbacks, function(c){
				c(reason, details, future)
			}, self)
		},
		// Invoked when a future had and exception. This invokes every callback registered
		// in the 'exceptionCallbacks' list (which were previously registered using the
		// 'onFail' method).
		_futureHadException:function(e, future){
			var self=this
			var i=0;
			var r=true;
			while ((i < self.exceptionCallbacks.length))
			{
				if ( (self.exceptionCallbacks[i](e, future) == false) )
				{
					i = (self.exceptionCallbacks.length + 1);
					r = false;
				}
				i = (i + 1);
			}
			if ( (i == 0) )
			{
				extend.print(('channels.Future exception: ' + e))
			}
			return r
		},
		_processHTTPResponse:function(response){
			var self=this
			if ( ((self.options.forceJSON && self.options.evalJSON) || (self.options.evalJSON && channels.Channel.ResponseIsJSON(response))) )
			{
				return channels.Channel.ParseJSON(response.responseText)
			}
			else if ( true )
			{
				return response.responseText
			}
		}
	},
	operations:{
		AddParameters:function(url, parameters){
			var self = this;
			var query_index=url.indexOf('?');
			var has_params=(query_index != -1);
			if ( (! extend.isString(parameters)) )
			{
				var p=[];
				extend.iterate(parameters, function(v, k){
					p.push(((k + '=') + self.EncodeURI(v)))
				}, self)
				parameters = p.join('&');
			}
			if ( has_params )
			{
				if ( (query_index == (url.length - 1)) )
				{
					return (url + parameters)
				}
				else if ( true )
				{
					return ((url + '&') + parameters)
				}
			}
			else if ( true )
			{
				if ( parameters )
				{
					return ((url + '?') + parameters)
				}
				else if ( true )
				{
					return url
				}
			}
		},
		ParseJSON:function(json){
			var self = this;
			return function(){
				return eval((('(' + json) + ')'))
			}()
		},
		NormalizeBody:function(body){
			var self = this;
			if ( (typeof(body) != 'string') )
			{
				var new_body='';
				var values=[];
				extend.iterate(body, function(v, k){
					values.push(((k + '=') + self.EncodeURI(v)))
				}, self)
				body = values.join('&');
			}
			return (body || '')
		},
		ToFormData:function(value, prefix, result){
			var self = this;
			prefix = prefix === undefined ? '' : prefix
			result = result === undefined ? undefined : result
			if ( (! extend.isDefined(result)) )
			{
				return self.ToFormData(value, '', []).join('&\n')
			}
			else if ( true )
			{
				var sep=(((prefix.length > 0) && '.') || '');
				if ( extend.isMap(value) )
				{
					extend.iterate(value, function(v, k){
						self.ToFormData(v, ((prefix + sep) + k), result)
					}, self)
				}
				else if ( extend.isList(value) )
				{
					extend.iterate(value, function(v, i){
						self.ToFormData(v, ((prefix + sep) + i), result)
					}, self)
				}
				else if ( true )
				{
					result.push((((prefix || 'value') + '=') + encodeURIComponent(value)))
				}
				return result
			}
		},
		ResponseIsJSON:function(response){
			var self = this;
			var content_type=response.getResponseHeader('Content-Type').split(';')[0];
			if ( (((content_type === 'text/javascript') || (content_type === 'text/x-json')) || (content_type === 'application/json')) )
			{
				return true
			}
			else if ( true )
			{
				return false
			}
		},
		EncodeURI:function(value){
			var self = this;
			return encodeURIComponent(value)
		}
	}
})
channels.SyncChannel=extend.Class({
	// The SyncChannel will use the synchronous methods from the HTTP transport
	// object to do the communication.
	name:'channels.SyncChannel', parent:channels.Channel,
	initialize:function(options){
		var self=this
		self.getSuper(channels.SyncChannel.getParent())(options)
	},
	methods:{
		isAsynchronous:function(){
			var self=this
			return false
		},
		isSynchronous:function(){
			var self=this
			return true
		}
	},
	operations:{
		AddParameters:function(url, parameters){
			return channels.Channel.AddParameters.apply(channels.SyncChannel, arguments);
		},
		ParseJSON:function(json){
			return channels.Channel.ParseJSON.apply(channels.SyncChannel, arguments);
		},
		NormalizeBody:function(body){
			return channels.Channel.NormalizeBody.apply(channels.SyncChannel, arguments);
		},
		ToFormData:function(value, prefix, result){
			return channels.Channel.ToFormData.apply(channels.SyncChannel, arguments);
		},
		ResponseIsJSON:function(response){
			return channels.Channel.ResponseIsJSON.apply(channels.SyncChannel, arguments);
		},
		EncodeURI:function(value){
			return channels.Channel.EncodeURI.apply(channels.SyncChannel, arguments);
		}
	}
})
channels.AsyncChannel=extend.Class({
	// The AsyncChannel will use the asynchronous methods from the HTTP transport
	// object to do the communication.
	name:'channels.AsyncChannel', parent:channels.Channel,
	initialize:function(options){
		var self=this
		self.getSuper(channels.AsyncChannel.getParent())(options)
	},
	methods:{
		isAsynchronous:function(){
			var self=this
			return true
		},
		isSynchronous:function(){
			var self=this
			return false
		}
	},
	operations:{
		AddParameters:function(url, parameters){
			return channels.Channel.AddParameters.apply(channels.AsyncChannel, arguments);
		},
		ParseJSON:function(json){
			return channels.Channel.ParseJSON.apply(channels.AsyncChannel, arguments);
		},
		NormalizeBody:function(body){
			return channels.Channel.NormalizeBody.apply(channels.AsyncChannel, arguments);
		},
		ToFormData:function(value, prefix, result){
			return channels.Channel.ToFormData.apply(channels.AsyncChannel, arguments);
		},
		ResponseIsJSON:function(response){
			return channels.Channel.ResponseIsJSON.apply(channels.AsyncChannel, arguments);
		},
		EncodeURI:function(value){
			return channels.Channel.EncodeURI.apply(channels.AsyncChannel, arguments);
		}
	}
})
channels.BurstChannel=extend.Class({
	// The BurstChannel is a specific type of AsyncChannel that is capable of
	// tunneling HTTP requests in HTTP.
	name:'channels.BurstChannel', parent:channels.AsyncChannel,
	properties:{
		channelURL:undefined,
		onPushCallbacks:undefined,
		requestsQueue:undefined
	},
	initialize:function(url, options){
		var self=this
		if (typeof(self.channelURL)=='undefined') {self.channelURL = undefined};
		if (typeof(self.onPushCallbacks)=='undefined') {self.onPushCallbacks = []};
		if (typeof(self.requestsQueue)=='undefined') {self.requestsQueue = []};
		self.getSuper(channels.BurstChannel.getParent())(options)
		self.channelURL = (url || '/channels:burst');
	},
	methods:{
		// Registers a callback that will be called when something is 'pushed' into
		// the channel (a GET, POST, etc). The callback can query the channel status
		// and decide to explicitly flush the 'requestsQueue', or just do nothing.
		// 
		// FIXME: WHAT ARGUMENTS ?
		onPush:function(callback){
			var self=this
			self.onPushCallbacks.push(callback)
		},
		_pushRequest:function(request){
			var self=this
			self.requestsQueue.push(request)
		},
		_sendRequests:function(requests){
			var self=this
			var boundary='8<-----BURST-CHANNEL-REQUEST-------';
			var headers=[['X-Channel-Boundary', boundary], ['X-Channel-Type', 'burst'], ['X-Channel-Requests', ('' + requests.length)]];
			var request_as_text=[];
			var futures=[];
			extend.iterate(requests, function(r){
				var t=(((r.method + ' ') + r.url) + '\r\n');
				extend.iterate(r.headers, function(h){
					t = (t + (((h[0] + ': ') + h[1]) + '\n'));
				}, self)
				t = (t + '\r\n');
				t = (t + r.body);
				request_as_text.push(t)
				futures.push(r.future)
			}, self)
			var body=request_as_text.join((boundary + '\n'));
			var f=self.transport.request(true, 'POST', self.channelURL, body, headers);
			f.onSet(function(v){
				self._processResponses(v, futures)
			})
			f.onFail(function(s, r, c, f){
				extend.iterate(futures, function(f){
					f.fail(s, r, c)
				}, self)
			})
		},
		// This is the callback attached to composite methods
		_processResponses:function(response, futures){
			var self=this
			var text=response.responseText;
			var boundary=response.getResponseHeader('X-Channel-Boundary');
			if ( (! boundary) )
			{
				extend.iterate(futures, function(f){
					f.fail('Server did not provide X-Channel-Boundary header')
				}, self)
			}
			else if ( true )
			{
				var i=0;
				extend.iterate(text.split(boundary), function(r){
					r = function(){
						return eval((('(' + r) + ')'))
					}();
					r.responseText = r.body;
					r.getHeader = function(h){
						h = h.toLowerCase();
						result = undefined;
						extend.iterate(r.headers, function(header){
							if ( (header[0].toLowerCase() == h) )
							{
								result = header[1];
							}
						}, self)
						return result
					};
					r.getResponseHeader = function(h){
						return (r.getHeader(h) || response.getResponseHeader(h))
					};
					futures[i].set(r)
					i = (i + 1);
				}, self)
			}
		},
		// Flushes the 'requestsQueue', using the given 'filter' function. For every request in
		// 'requestsQueue', if 'filter(r)' is 'True', then the request is sent to the server
		// in a composite request.
		flush:function(filter){
			var self=this
			filter = filter === undefined ? function(){
				return true
			} : filter
			var remaining=[];
			var flushed=[];
			extend.iterate(self.requestsQueue, function(r){
				if ( filter(r) )
				{
					flushed.push(r)
				}
				else if ( true )
				{
					remaining.push(r)
				}
			}, self)
			self.requestsQueue = remaining;
			self._sendRequests(flushed)
		},
		// Invokes a 'GET' to the given url (prefixed by the optional 'prefix' set in
		// this channel options) and returns a 'Future'.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		get:function(url, body, future){
			var self=this
			body = body === undefined ? null : body
			future = future === undefined ? undefined : future
			var request={'method':'GET', 'url':url, 'body':body, 'future':(future || self._createFuture())};
			self._pushRequest(request)
			return request.future
		},
		// Invokes a 'POST' to the give url (prefixed by the optional 'prefix' set in
		// this channel options), using the given 'body' as request body, and
		// returning a 'Future' instance.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		post:function(url, body, future){
			var self=this
			body = body === undefined ? null : body
			future = future === undefined ? undefined : future
			var request={'method':'POST', 'url':url, 'body':body, 'future':(future || self._createFuture())};
			self._pushRequest(request)
			return request.future
		}
	},
	operations:{
		AddParameters:function(url, parameters){
			return channels.Channel.AddParameters.apply(channels.BurstChannel, arguments);
		},
		ParseJSON:function(json){
			return channels.Channel.ParseJSON.apply(channels.BurstChannel, arguments);
		},
		NormalizeBody:function(body){
			return channels.Channel.NormalizeBody.apply(channels.BurstChannel, arguments);
		},
		ToFormData:function(value, prefix, result){
			return channels.Channel.ToFormData.apply(channels.BurstChannel, arguments);
		},
		ResponseIsJSON:function(response){
			return channels.Channel.ResponseIsJSON.apply(channels.BurstChannel, arguments);
		},
		EncodeURI:function(value){
			return channels.Channel.EncodeURI.apply(channels.BurstChannel, arguments);
		}
	}
})
channels.HTTPTransport=extend.Class({
	// The 'HTTPTransport' is the low-level class used by channels to do HTTP
	// communication. This class really acts as a wrapper for platform-specific HTTP
	// communication implementations, taking care of returning 'Futures' instances to
	// be used by the channels.
	// 
	// All the futures returned by the HTTPTransport will give the HTTP request object
	// as-is. Particularly, the 'Channels' 
	// 
	// In case the transports fails to complete the request, the future 'fail' method
	// will be invoked with the follwing arguments:
	// 
	// - 'request status' as status for the failure (ie.
	// machine-readable description of the error)
	// - 'request responseText' as the reason for the failure (ie.
	// human-readable description of the error)
	// - 'request' as the context for the exception, so that clients have the opportunity
	// to get more information from the reques itself, like headers.
	name:'channels.HTTPTransport', parent:undefined,
	shared:{
		DEFAULT:undefined
	},
	initialize:function(){
		var self=this
	},
	methods:{
		request:function(async, method, url, body, headers, future, options){
			var self=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? new channels.Future() : future
			options = options === undefined ? {} : options
			var request=self._createRequest();
			future.onCancel(function(){
				request.abort()
			})
			var response=self._processRequest(request, {'method':method, 'body':body, 'url':url, 'headers':headers, 'asynchronous':async, 'timestamp':options.timestamp, 'success':function(v){
				future.set(v)
			}, 'failure':function(v){
				future.fail(v.status, v.responseText, v)
			}});
			return future
		},
		_createRequest:function(){
			var self=this
			// If IE is used, create a wrapper for the XMLHttpRequest object
			if ( typeof(XMLHttpRequest) == "undefined" )
			{
				XMLHttpRequest = function(){return new ActiveXObject(
					navigator.userAgent.indexOf("MSIE 5") >= 0 ?
					"Microsoft.XMLHTTP" : "Msxml2.XMLHTTP"
				)}
			}
			return new XMLHttpRequest()
			
		},
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
		// - 'loading', the callback that will be invoked when the request is 
		// loading, with the request as argument.
		// - 'failure', the callback that will be invoked on failure, with the
		// request as argument.
		// - 'timestamp', if 'True' will add an additional 'timestamp' parameter to
		// the request, with the current time. This can prevent some browsers
		// (notably IE) to cache a response that you don't want to cache (even if you
		// specify no-cache, or things like this in the response).
		_processRequest:function(request, options){
			var self=this
			var callback_was_executed=false;
			var on_request_complete=function(state){
				callback_was_executed = true;
				if ( ((request.readyState == 3) && options.loading) )
				{
					options.loading(request)
				}
				else if ( (request.readyState == 4) )
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
			};
			var asynchronous=(options.asynchronous || false);
			if ( (((options.method == 'GET') || (options.method == 'HEAD')) && (options.timestamp || channels.IS_IE)) )
			{
				if ( (options.url.indexOf('?') == -1) )
				{
					options.url = (options.url + ('?t' + new Date().getTime()));
				}
				else if ( true )
				{
					options.url = (options.url + ('&t' + new Date().getTime()));
				}
			}
			if ( asynchronous )
			{
				request.onreadystatechange = on_request_complete;
			}
			request.open((options.method || 'GET'), options.url, (options.asynchronous || false))
			extend.iterate(options.headers, function(v, k){
				if ( extend.isMap(options.headers) )
				{
					request.setRequestHeader(k, v)
				}
				else if ( true )
				{
					request.setRequestHeader(v[0], v[1])
				}
			}, self)
			request.send((options.body || ''))
			if ( ((! callback_was_executed) && (! asynchronous)) )
			{
				on_request_complete()
			}
		}
	}
})
channels.parameterize=	function(data){
		var self=channels;
		extend.assert(extend.isMap(data), 'channels.parameterize expects a map')
		var result=undefined;
		extend.iterate(data, function(value, key){
			var r=((encodeURIComponent(value) + '=') + encodeURIComponent(value));
			if ( (result === undefined) )
			{
				result = r;
			}
			else if ( true )
			{
				result = (result + ('&' + r));
			}
		}, self)
		return result
	}
channels.init=	function(){
		var self=channels;
		channels.HTTPTransport.DEFAULT = new channels.HTTPTransport();
	}
if (typeof(channels.init)!="undefined") {channels.init();}

