== Channels 0.8
== Developer Manual
-- Author: Sebastien Pierre <sebastien@ivy.fr>
-- Revision: 12-Nov-2007


The problem
===========


Channels API
==========



  Futures API
  -----------

    
  Channels API
  ------------

How-to
======

  Handling failures in HTTP channels
  ----------------------------------

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
