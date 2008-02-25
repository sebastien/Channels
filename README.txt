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

Burst Channel Protocol
======================

  Burst channels is an easy way to do HTTP tunneling over HTTP. The idea is that
  when you have a lot of tiny requests to send to the server, it is may be
  better to group them as a larger request, so that you don't pay the overhead
  of multiplied latency.

  For instance, if you have to send 10 requests, and you have a 100ms latency to
  the server, you'll end up having 1000ms total latency, while when using burst
  channels, you could keep the 100ms latency.

  Request format
  --------------

  The Burst Channel protocol is modeled after the MIME RFC [RFC1341]]. The idea
  is that the client will simply embed each request as an individual body in a
  _composite request_.

  >   +---------------------------------------------------------------+
  >   | GET         /url/supporting/burst/channel                     |
  >   +---------------------------------------------------------------+
  >   | Content-Type: multipart/mixed;boundary=BURST-q0M2Yt08jU534c0p |
  >   | X-Channel-Type: burst                                         |
  >   | X-Channel-Requests: 4                                         |
  >   +---------------------------------------------------------------+
  >   | HTTP REQUEST 1                                                |
  >   | ............................................................. |
  >   | boundary=BURST-q0M2Yt08jU534c0p                               |
  >   | ............................................................. |
  >   | HTTP REQUEST 2                                                |
  >   | ............................................................. |
  >   | boundary=BURST-q0M2Yt08jU534c0p                               |
  >   | ............................................................. |
  >   | HTTP REQUEST 4                                                |
  >   +---------------------------------------------------------------+

  Each HTTP request is given as-is, including request URI, headers and body. The
  only thing to watch for is to avoid conflicts in boundaries, which is why the
  separator should start with 'BURST-' (which makes it easier to disambiguate).

  Aside from that, it is a good idea to add an 'X-Channel-Type:burst' header to the
  requests headers, just to be more explicit (and give a chance to reverse
  proxies to direct the burst requests to the appropriate server) -- but it
  should not be required by servers.

  The optional 'X-Channel-Requests' field can also be added to indicate how many
  requests are expected to be found in the request bodies. This is only useful
  for debugging purposes, as HTTP requests are expected to arrive completely.

  There is no other particular requirement for the URL either, it is more a matter of
  convention. It's generally OK to provide a single URL that processes burst
  channels requests. In some cases, you might prefer to partition your site and
  provide different URLs that can handle burst channels.

  Response format
  ---------------

  Symetrically to the request, the response will contain embedded HTTP responses
  to the embedded HTTP requests. The only constraint to respect here is to make
  sure the ordering of responses is the same as the ordering of requests.

  >   +---------------------------------------------------------------+
  >   | HTTP 200 OK                                                   |
  >   +---------------------------------------------------------------+
  >   | Content-Type: multipart/mixed;boundary=BURST-q0M2Yt08jU534c0p |
  >   | X-Channel-Responses: 4                                        |
  >   +---------------------------------------------------------------+
  >   | HTTP RESPONSE 1                                               |
  >   | ............................................................. |
  >   | boundary=BURST-q0M2Yt08jU534c0p                               |
  >   | ............................................................. |
  >   | HTTP RESPONSE 2                                               |
  >   | ............................................................. |
  >   | boundary=BURST-q0M2Yt08jU534c0p                               |
  >   | ............................................................. |
  >   | HTTP RESPONSE 4                                               |
  >   +---------------------------------------------------------------+
  
  The optional 'X-Channel-Responses' plays the same role as 'X-Channel-Requests'
  and is only useful for debugging purposes.

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
