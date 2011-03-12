== Channels
== Sync/Async Communication in JavaScript
-- Author: Sebastien Pierre <sebastien@ffctn.com>
-- Revision: 2010-08-11
-- Creation: 2007-11-12

The problem
===========

Web applications now require a lot of client <--> server interaction using HTTP
requests. These requests can be either _blocking_ (synchronous) or
_non-blocking_ (asynchronous). Doing synchronous HTTP requests is easy for a
developer, as the HTTP request can be executed as a regular method call:

>   var r = new XMLHttpRequest();
>   r.open("GET", "sampledata.json");
>   r.send(null);
>   var intermediate_result = doSomethinWithTheResponse(r.responseText)
>   var final_result = doSomethinElseWithTheResponse(intermediate_result)

However, doing asynchronous HTTP requests implies using callbacks, which impacts your programming style:

>   var r = new XMLHttpRequest();
>   r.open("GET", "sampledata.json");
>   r.onreadystatechange=function(){
>     if (r.readyState==4) {
>         var intermediate_result = doSomethinWithTheResponse(r.responseText)
>         var final_result = doSomethinElseWithTheResponse(intermediate_result)
>     }
>   }
>   r.send(null);

The Channels library aims at providing a _uniform API to do synchronous and
asynchronous requests_, as well as to offer constructs that will ease
asynchronous concurrent programming on the client-side.

Channels API
============

The Channels API is built on two main constructs:

  Futures::
    Futures are objects that wrap values, so that you can register callbacks that will be
    triggered when the value is set, or if there was a failure while setting the value.

  Channels::
    Channels are objects that abstract a connection between a client and a server. Channels
    produce futures to which you can attach callbacks.

Futures API
-----------

  Creating and operating on a future
  ----------------------------------

  'new Future()'::
    Creates a new future without a value. The future will be by default in the
    'WAITING' state until a value is set, a failure occurs or the future is
    cancelled.

  '<Future>.set(value:Any)'::
    Sets a value to this future. The future will be in the 'SET' state and the
    callbacks registered with 'onSet' will be triggered in their order of
    registration.

  '<Future>.setPartial(value:Any)'::
    Sets a value to this future. The future will stay in the 'WAITING' state
    until a value is bound using 'set', but the callbacks registered with
    'onPartial' will be triggered in their order of registration.

  '<Future>.get():Any'::
    Returns the value bound to this future, if any.

  '<Future>.fail(status:Any,reason:Any,context:Any)'::
    Makes this future fail. The future will be in the 'FAILED' state.

  '<Future>.cancel()'::
    Cancels this future. The future will be in the 'CANCELED' state.

  Registering callbacks
  ---------------------

  '<Future>.onSet(callback:(value:Any,future:Future)->Any):Future'::
    Registers a callback that will be called when a value is bound to
    the future (using the 'set' method).

  '<Future>.onFail(callback:(status:Int,reason:String,context:Any,future:Future)->Any):Future'::
    Registers a callback that will be called if the future fails. The given arguments
    are inspired from HTTP, with 'status' being the error code, 'reason' an optional
    string description, 'context' an optional data object (typically the XMLHttpRequest object
    if the future comes from an HTTP channel) a reference to this future.

  '<Future>.onPartial(callback:(value:Any,future:Future)->Any):Future'::
    Registers a callback that will be called when the future is partially set. This is useful
    for the implementation of multi-body or streaming HTTP requests.

  '<Future>.onException(callback:(e:Exception,future:Future)->Any):Future'::
    Registers a callback that will be called if there is an exception while executing
    a callback. If an exception happens without any exception callback registered, the
    exception will be printed on the console.

  '<Future>.onCancel(callback:(value:Any,future:Future)->Any):Future'::
    Registers a callback that will be called if the future is cancelled.

  '<Future>.onRefresh(callback:(future:Future)->Any):Future'::
    Registers a callback that will be called when the future is refreshed. The typical usage
    is to pass the future to a function that will set its value or make it fail.

  Querying a future:
  ------------------

  '<Future>.isSet()'::
    Returns 'true' if a value is bound to the future

  '<Future>.hasFailed()'::
    Returns 'true' if the future has failed

  '<Future>.hasSucceeded()'::
    Returns 'true' if the future has suceeded (same as 'isSet()')

  '<Future>.getFailureStatus():Any'::
    Retuens the failure status, when the future has failed

  '<Future>.getFailureReason():Any'::
    Retuens the failure reason, when the future has failed

  Retrying a future
  -----------------
  
  Futures may fail due to timeouts, connection or server errors. Some channels may set
  'refresh' callbacks, in which case you can either call the 'refresh' or 'retry' functions
  to try to update the future.
  
  '<Future>.refresh():Future'::
    Triggers the callbacks registerd with 'onRefresh'. These callback may or may not 
    change this future.

  '<Future>.retry(max:Int=5):Boolean'::
    Triggers a refresh an increases the number of retries. It returns 'true' if the
    number of retries for this future is below the given maximum. Typical usage of this is
    in the following case (in Sugar):
    |
    >   future onSet {
    >     # Do something
    >   } onFail {s,r,c,future|
    >     if not future retry (5)
    >       # We had 5 errors in a row, so we have to take action
    >       alert "The server is down, sorry !"
    >     end
    >   }


  Chain-processing the value
  --------------------------

  You might want to pre-process values bound to a future. For instance, HTTP channels may
  want to automatically convert the incoming data to JSON and make the future fail
  if the JSON is invalid. You can register _processors_ that convert the value into another
  or directly control the future.

  '<Future>.process(processor:(value:Any,future:Future)->Any)'::
    Registers a processor function that takes the bound value and the future as paramater
    and returns the transformed value.
    
  '<Future>.rawValue():Any'::
    Returns the raw value bound to the future, before being processed.
    
Channels API
------------

How-to
======

  Handle failures in HTTP channels
  --------------------------------

  While most of the request you'll do using the HTTP channels will succeed, some
  of them will fail for various reasons: there was a timeout, the server
  crashed, or you simply gave wrong arguments.

  As channels always return your futures, you'll simply use the channels
  'onFail' callback to register a function that will be invoked if the channel
  is not able to get the value to your future.
  
  Here is an example (in Sugar):

  >   var f = channel get "/some/url"
  >   f onFail { status, reason, context, future|
  >     ....
  >   }

  In the callback you gave, you will be given the following arguments:

  - 'status' with the HTTP response status code (404, 500, etc)
  - 'reason' with the body of the HTTP response, expected to be a human-readable
    string
  - 'context' with the reference to the request that failed, so you can still
    get extra information from the headers
  - 'future' referencing the future that failed, in case you have a shared error
    handler.

  Handle exceptions in channels and futures callbacks
  ---------------------------------------------------

  You may think at first that exceptions are a specific case of failures. In
  channels and futures, there is a major difference between failures and
  exceptions:

  - A failure indicates that the future won't have a value, which is something
    that can happen (eg. when using an HTTP channel, server can timeout, request
    can be invalid, etc).
  - An exception indicates that there was an unhandled error happening within
    the code, in this case the callbacks given to channels and futures.

  So if you implement *callbacks that raise exceptions*, you'll need to define
  callbacks to catch these exceptions, otherwise they will propagate to your
  program and your application will break.

  Here is an example of a callback that raises an exception:

  >   var f = new Future ()
  >   f onSet {v| if v < 3 -> throw "Expects 3 or more"}

  doing 'f(2)' will raise an exception, while 'f(3)' won't. To  catch the
  exception (and allow your code to continue after the 'f(2)' invocation), you
  can define a callback for exception:

  >   f onException {e,f| print ("Exception happened",e,"in future",f)}

  You can add multiple handlers for exception. They will stack up, and the last
  callback you added will be invoked first. If the callback returns 'False', the
  other callback won't be called (so you have a chance to stop propagation).

  >   f onException {return False}

  will simply absorb the exceptions without notifying you. You can also define
  exception handlers for channels (and every future created by the channel will
  make use of it):

  >   var c = new AsyncChannel ()
  >   c onException {e,f| print ("Exception happened",e,"in future",f) ; return False}

  If you want to know more about this have a look at 'Future.onException',
  'Channel.onException' and the 'channelExceptionPropagation' in the test
  suite.

Burst Channel Protocol
======================

  Burst channels is an easy way to do HTTP tunneling over HTTP. The idea is that
  when you have a lot of tiny requests to send to the server, it is may be
  better to group them as a larger request, so that you don't pay the overhead
  of multiplied latency.

  For instance, if you have to send 10 requests, and you have a 100ms latency to
  the server, you'll end up having 1000ms total latency, while when using burst
  channels, you could keep the 100ms latency.

  The burst channel protocol is designed for JSON-based communication between
  client and server. As opposed to plain tunneling of requests, where you'd
  expect requests and responses to be embedded "raw" in composite request and
  responses, the burst channel protocol specifies that only requests are
  embedded 'raw' (because server parse requests) while the responses are
  embedded as JSON maps (because clients should not spend time parsing
  requests).

  Request format
  --------------

  The Burst Channel protocol is modeled after the MIME RFC [RFC1341]]. The idea
  is that the client will simply embed each request as an individual body in a
  _composite request_. The only difference with RFC1341 is that we don't use the
  content-type header to identify boundary, but we use the 'X-Channel-Boundary'
  specific header (to make things easier for both client and server).

  >   +---------------------------------------------------------------+
  >   | GET         /url/supporting/burst/channel                     |
  >   +---------------------------------------------------------------+
  >   | X-Channel-Boundary: 8<-----BURST-CHANNEL-REQUEST------        |
  >   | X-Channel-Type: burst                                         |
  >   | X-Channel-Requests: 4                                         |
  >   +---------------------------------------------------------------+
  >   | HTTP REQUEST 1                                                |
  >   | ............................................................. |
  >   | 8<-----BURST-CHANNEL-REQUEST------                            |
  >   | ............................................................. |
  >   | HTTP REQUEST 2                                                |
  >   | ............................................................. |
  >   | 8<-----BURST-CHANNEL-REQUEST------                            |
  >   | ............................................................. |
  >   | HTTP REQUEST 4                                                |
  >   +---------------------------------------------------------------+

  Each HTTP request is given as-is, including request URI, headers and body. The
  only thing to watch for is to avoid conflicts between boundary and request
  content (but this is the problem of the client).

  Aside from that, it is a good idea to add an 'X-Channel-Type:burst' header to the
  requests headers, just to be more explicit (and give a chance to reverse
  proxies to direct the burst requests to the appropriate server) -- but severs
  should not require that field.

  The optional 'X-Channel-Requests' field can also be added to indicate how many
  requests are expected to be found in the request bodies. This is only useful
  for debugging purposes, as HTTP requests are expected to arrive completely.

  There is no other particular requirement for the URL either, it is more a matter of
  convention. It's generally OK to provide a single URL that processes burst
  channels requests. In some cases, you might prefer to partition your site and
  provide different URLs that can handle burst channels.

  It may be good to mention that in the HTTP spec, the request, headers and body
  must be separated by CR/LF ('\r\n'), so every request should look like:

  >   REQUEST
  >   \r\n
  >   HEADER\n
  >   HEADER\n
  >   \r\n
  >   BODY\n

  in case you don't have headers, it would look like

  >   REQUEST
  >   \r\n
  >   \r\n
  >   BODY\n

  Response format
  ---------------

  As for requests, responses are embedded in a composite response, the main
  difference being that responses are embedded as _json maps_ (as opposed to raw
  texT). The only additional constraint to respect here is to make sure the
  ordering of responses is the same as the ordering of requests.

  >   +---------------------------------------------------------------+
  >   | HTTP 200 OK                                                   |
  >   +---------------------------------------------------------------+
  >   | X-Channel-Boundary: 8<-----BURST-CHANNEL-RESPONSE------       |
  >   | X-Channel-Responses: 4                                        |
  >   +---------------------------------------------------------------+
  >   | HTTP RESPONSE 1                                               |
  >   | ............................................................. |
  >   | 8<-----BURST-CHANNEL-RESPONSE------                           |
  >   | ............................................................. |
  >   | HTTP RESPONSE 2                                               |
  >   | ............................................................. |
  >   | 8<-----BURST-CHANNEL-RESPONSE------                           |
  >   | ............................................................. |
  >   | HTTP RESPONSE 4                                               |
  >   +---------------------------------------------------------------+
  
  The optional 'X-Channel-Responses' plays the same role as 'X-Channel-Requests'
  and is only useful for debugging purposes.

  As we mentioned, the content of 'HTTP RESPONSE' is not the raw response : to save
  unnecessary parsing time on the client-side, the response is already given as
  JSON structure, with the following fields:

  - 'status' the HTTP status code, as an integer
  - 'reason', the HTTP reason, as a string
  - 'headers', the HTTP heads, as an array or '[name,value]'
  - 'body', the HTTP body, as a string

  An example response would be:

  >   {
  >     "status":200,
  >     "reason":"OK",
  >     "headers":[["Content-Type","application/json"]],
  >     "body":'["hello","world"]'
  >   }

  You're not required to specify all the headers in the 'headers' field, as the
  client is expected to first look in the embedded response headers, and if the
  header is not found, it will look in the parent response header (but
  generally, only 'Content-Type' will be useful).

  Expected client behaviour
  -------------------------

  The client can choose whether he wants to send the request all at once or if
  he will "stream" the bodies, meaning that there may be some delay between the
  sending of each body. However, this is unlikely to happen as web browsers do
  not support streaming of request bodies.

  Clients should take advantage of response streaming and start to process the
  responses even if all the responses have not been received.

  Expected server behaviour
  -------------------------

  Conversely, the server can choose between waiting for all the requests to be
  processed to before sending the response, or to send the responses as soon as
  they are available, provided the ordering is kept.

  The optimal behaviour would be to start processing the requests as soon as
  they are available, and to stream the responses as soon as they are available
  and in order.

  Possible extensions
  -------------------

  One of the obvious extensions to burst channels is to do simple HTTP
  streaming, where the client sends only one request, and that the server
  returns an infinite amount of responses.

Examples
========

# --

 [RFC1341] The Multipart content type
    [RFC section 7](http://www.w3.org/Protocols/rfc1341/7_2_Multipart.html)
 

# EOF vim: syn=kiwi ts=2 sw=2 et
