== Channels Test Suite

This test suite requires some other projects to be installed to run properly.
Here is what you'll need, aside from Python itself:

 - [Railways](http://www.ivy.fr/railways), the web framework used to implement
   the test server.

 - [Pamela](http://www.ivy.fr/pamela), the HTML/XML dialect used to implement
   the HTML pages for the test.

 - [Sugar](http://www.ivy.fr/sugar), the programming language in which Channels
   and the tests are written.

 - [LambdaFactory](http://www.ivy.fr/lambdafactory), the main library used by
   Sugar

 - [D-Parser](http://dparser.sf.net), the parser used by Sugar (it's already
   included in Sugar distribution)

This is a lot of dependencies, so the test suite is really only for developers
who have the whole toolchain -- but be reassured, we do test our software before
releasing it !

Once you have all that installed, you can simply do (from the Channels
directory):

>	cd Tests
>	python test-runner.py

And you should see something like that:

>	Dispatcher: @on  GET /
>	Dispatcher: @on POST  GET /
>	Dispatcher: @on  GET /{path:any}
>	Dispatcher: @on POST  GET /{path:any}
>	Dispatcher: @on POST /rw:requests
>	Dispatcher: @on  GET /test/404
>	Dispatcher: @on POST  GET /test/404
>	Dispatcher: @on  GET /test/500
>	Dispatcher: @on POST  GET /test/500
>	Dispatcher: @on  GET /test/GET
>	Dispatcher: @on  GET /test/GET+latency
>	Dispatcher: @on POST /test/POST
>	Railways embedded server listening on 0.0.0.0:8000

# EOF
