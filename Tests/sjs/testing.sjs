@module testing
@version 0.6.1 (31-Jan-2008)
@target JavaScript

| The testing module implements a simple stateful test engine that allows to
| quickly setup and run tests.
|
| NOTE _________________________________________________________________________
| This engine is designed to be used mainly with the JavaScript backend, and was
| written so that it does not depend on the sugar runtime libraries.

# TODO: Add way to count assertion, or at least to refer to the line of the
# invocation.

@shared TestCount:Integer  = 0
@shared CaseCount:Integer  = 0
@shared CurrentTest:String = Undefined
@shared PredicateStack     = []
@shared Results:List       = []

@shared Callbacks = {
	OnCaseStart : Undefined
	OnCaseEnd   : Undefined
	OnTestStart : Undefined
	OnTestEnd   : Undefined
	OnFailure   : Undefined
	OnSuccess   : Undefined
	OnNote      : Undefined
	OnLog       : Undefined
}

@shared Options = {
	ExceptionOnFailure:False
}

# ------------------------------------------------------------------------------
# OPTION MANAGEMENT
# ------------------------------------------------------------------------------

@function option name, value
	Options[name] = value
	return testing
@end

@function enable option
	Options[option] = True
	return testing
@end

@function disable option
	Options[option] = False
	return testing
@end

# ------------------------------------------------------------------------------
# CREATING A NEW TEST CASE
# ------------------------------------------------------------------------------

@function testCase:Integer name
| Creates a new test case with the given name, and returns the identifier of the
| test case.
	var case_id = CaseCount
	if CaseCount > 0 -> endCase (case_id - 1)
	if Callbacks OnCaseStart -> Callbacks OnCaseStart (case_id, name)
	CurrentCase = name
	return testing
@end

@function endCase:Integer caseID
| Notifies the end of the give test case
	# TODO: Give name and time for case ending
	if Callbacks OnCaseEnd -> Callbacks OnCaseEnd (caseID)
	return testing
@end

# ------------------------------------------------------------------------------
# CREATING A NEW TEST
# ------------------------------------------------------------------------------

@function test:Integer name
| Notifies that a new test has begun. The given 'name' will be the
| test description. This returns an identifier (as an int) that will allow to
| access the test.
|
| If there is a previous test, and it was not ended, this will also end the
| previous test.
	var test_id = TestCount
	# We trigger the callbacks first so that we do not have problems with timing
	# by introduce the callback execution time
	if TestCount > 0 -> end(test_id - 1)
	if Callbacks OnTestStart -> Callbacks OnTestStart(test_id, name)
	CurrentTest = name
	Results push {
		tid    : test_id
		cid    : CaseCount
		status : "S"
		name   : name
		start  : (new Date() getTime())
		tests  : []
	}
	TestCount  += 1
	return testing
@end

@function currentTest
	return TestCount - 1
@end

# ------------------------------------------------------------------------------
# ENDING A TEST
# ------------------------------------------------------------------------------

@function end testID=Undefined
| Ends the test with the given 'testID' (or the last test if no ID was given).
| Note that a test can only be ended once.
	if testID is Undefined -> testID = TestCount - 1
	var test = Results[testID] 
	if test ended -> return True
	test end   = new Date() getTime()
	test run   = (test end) - (test start)
	test ended = True
	if Callbacks OnTestEnd -> Callbacks OnTestEnd(testID, test)
	return testing
@end

# ------------------------------------------------------------------------------
# FAILING THE CURRENT TEST
# ------------------------------------------------------------------------------

# FIXME: This should take an optional test id parameter

@function fail reason
| Fails the current test with the given reason
	# console log (" failure: " + reason)
	if PredicateStack length == 0
		var test_id = TestCount - 1
		Results[ test_id ] tests push {result:"F", reason:reason}
		Results[ test_id ] status = "F"
		# TODO: Remove callback execution time
		if Callbacks OnFailure -> Callbacks OnFailure(test_id, Results[test_id] tests length - 1, reason)
		if Options ExceptionOnFailure
			note ("Test interrupted by exception (see Options ExceptionOnFailure)")
			raise (reason)
		end
		return False
	else
		return reason
	end
@end

# ------------------------------------------------------------------------------
# SUCCEEDING THE CURRENT TEST
# ------------------------------------------------------------------------------

# FIXME: This should take an optional test id parameter

@function succeed
| Success the current test
	# console log (" success !")
	if PredicateStack length == 0
		var test_id = TestCount - 1
		Results[ test_id ] tests push {result:"S"}
		# TODO: Remove callback execution time
		if Callbacks OnSuccess -> Callbacks OnSuccess(test_id, Results[test_id] tests length - 1)
	end
	return True
@end

# ------------------------------------------------------------------------------
# FEEDBACK
# ------------------------------------------------------------------------------

@function note message
	if Callbacks OnNote -> Callbacks OnNote (message)
@end

@function log arguments...
	if Callbacks OnLog -> Callbacks OnLog (arguments join " ")
@end

# ------------------------------------------------------------------------------
# TRYING A FUNCTION
# ------------------------------------------------------------------------------

@function run callback
| Runs the given callback function in a 'try...' catch clause. Exceptions
| will be absorbed and not propagated back in the containing code.
|
| Ex: 'testing run { ... }'
	try
		callback()
	catch e
		fail ("Test failed with exception: " + e)
	end
	return testing
@end

@function expectException callback
| Expects an exception being raised when executing the given callback
|
| Ex: 'testing expectException { ... }'
	try
		callback ()
		fail     ()
	catch e
		succeed ()
	end
	return testing
@end

@function expectFailure callback, args...
	PredicateStack push (expectFailure)
	var result = callback apply (self, args)
	PredicateStack pop ()
	if result is True
		return fail "A failure was expected"
	else
		return succeed ()
	end
@end

# ------------------------------------------------------------------------------
# PREDICATES
# ------------------------------------------------------------------------------

@shared PREDICATES = {
	ensure:ensure
	asTrue:asTrue
	asFalse:asFalse
	asUndefined:asUndefined
	asDefined:asDefined
	asDefined:asDefined
	asUndefined:asUndefined
	unlike:unlike
	same:same
	value:value
}

@function ensure val
| Really just an alias for 'asTrue'
	return asTrue (val)
@end

@function asTrue val
| Alias for 'value(val, True)'
	return value (val, True)
@end

@function asFalse val
| Alias for 'value(val, False)'
	return value (val, False)
@end

@function asUndefined val
| Alias for 'value(val==Undefined, True)'
	return value (val is Undefined, True)
@end

@function asDefined val
| Alias for 'value(val==Undefined, False)'
	return value (val is Undefined, False)
@end

@function unlike value, other
| Unsures that the given 'value' is different from the 'other' value
	if value == other
		fail ("Values are expected to be different '" + value + "' vs '" + other + "'")
	else
		succeed()
	end
@end

@function same val, expected
| Same is a better version of 'value' that will introspect dictionaries and
| lists to check that the keys and items are the same.
	var result  = True
	PredicateStack push (same)
	if Extend isList (expected)
		if Extend isList (val)
			expected :: {v,i|
				# TODO: We should break
				if (i >= val length) or ( (same (val[i], v)) != True) -> result = False
			}
			if result != True
				result = "The lists are different"
			end
		else
			result = "A list is expected"
		end
	if Extend isMap (expected)
		if Extend isMap (val)
			expected :: {v,i|
				# TODO: We should break
				if (same (val[i], v) != True) -> result = False
			}
			if not result -> result = "The maps are different"
		else
			result =  "A map was expected"
		end
	else
		result = value(val, expected)
	end
	PredicateStack pop ()
	if result is True
		return succeed ()
	else
		return fail (result)
	end
@end

@function value value, expected
| Succeeds if the given value is non-null or if the given value equals the other
| expected value.
	if expected != Undefined
		if value != expected
			return fail ("Expected value to be '" + expected + "', got '" + value + "'")
		else
			return succeed()
		end
	else
		if value is expected
			return succeed ()
		if value is Undefined
			return fail "Value expected to be defined"
		if not value
			return fail "Value expected to be non-null"
		else
			return succeed()
		end
	end
@end

@function _getPredicateCaller level=2
	var called_function = getCaller
	while level > 0
		called_function = called_function caller
		level -= 1
	end
	return called_function
@end

@specific -NO_OOP

	# --------------------------------------------------------------------------
	#
	# Test Case
	#
	# --------------------------------------------------------------------------

	@class TestCase
	| A test case is a collection of tests units

		@property name
		@property tests = []

		@constructor name = (self getClass() getName())
		| Creates a test case with the given name (which is the class name by
		| default).
			self name = name
		@end

		@method add tests...
		| Adds the given tests to this test case tests list
			tests :: {t| self tests push (t)}
		@end

		@method run
		| Run all the tests registered in this test case.
			testCase (name)
			tests :: {t| t run() }
			endCase ()
		@end

	@end

	# --------------------------------------------------------------------------
	#
	# Test Unit
	#
	# --------------------------------------------------------------------------

	@class TestUnit
	| A test unit is a collection of individual tests exercising one or a
	| set of strongly related components.

		@shared   ensure = testing
		@property name

		@constructor name = (self getClass() getName())
			self name = name
		@end

		@method run
			self getClass() listMethods() :: {m,n|
				if n indexOf "test" == 0
					runTest (m,n)
				end
			}
		@end

		@method runTest testFunction, name
			test (name)
			testFunction()
			end ()
		@end

	@end

@end

@specific -NO_HTML_REPORTER

	# --------------------------------------------------------------------------
	#
	# Test Unit
	#
	# --------------------------------------------------------------------------

	@class HTMLReporter

		@property selector
		@property selector_table

		@property callbacks

		@constructor selector="#results"
			self selector = selector
			ensureUI ()
			callbacks = {
				OnCaseStart: onCaseStart
				OnCaseEnd:   onCaseEnd
				OnTestStart: onTestStart
				OnTestEnd:   onTestEnd
				OnSuccess:   onSuccess
				OnFailure:   onFailure
				OnNote:      onNote
				OnLog:       onLog
			}
		@end

		@operation Install
		| Installs a new 'HTMLReporter' in the testing module. This returns the
		| newly installed instance
			var new_reporter = new HTMLReporter()
			testing Callbacks = new_reporter callbacks
			return new_reporter
		@end

		@method ensureUI
		| Ensures that there is the proper HTML node in the document to add the
		| results, otherwise creates it.
			if $(selector) length == 0
				$("body") append "<div id='results'>  </div>"
			end
			selector = $(selector)
			if $("table", selector) length == 0
				$(selector) append ( html table () )
			end
			selector_table = $("table", selector)
			$(selector) addClass "TestResults"
			$(selector_table) attr { cellpadding:"0", cellspacing:"0" }
		@end

		@method onCaseStart
		@end

		@method onCaseEnd
		@end

		@method onNote message
			console log ("NOTE:" + message)
			var test_row = $("#test_" + currentTest())
			$(".notes", test_row) append (html li(message)) removeClass "empty"
		@end

		@method onLog message
			var test_row = $("#test_" + currentTest())
			var text = $(".log pre", test_row) text () + message + "\n"
			$(".log pre", test_row) text (text) removeClass "empty"
		@end

		@method onTestStart testID, testName
			var test_row = html tr (
				{
					id    : "test_" + testID
					class : "test test-running"
				}
				html td  ({class:"test-id"},"#" + testID )
				html td  (
					{class:"test-name"}
					"" + testName
					html div (
						html ul {class:"assertions empty"}
					)
					html div (
						html ul {class:"notes empty"}
					)
					html div ({class:"log empty"},html pre ())
				)
				html td({class:"test-time"}, "running...")
			)
			$(selector_table) append (test_row)
		@end

		@method onTestEnd testID, test
			var test_row = $("#test_" + testID)
			$ (test_row) removeClass "test-running"
			if test status == "S"
				$(test_row) addClass "test-succeeded"
			else
				$(test_row) addClass "test-failed"
			end
			$(".test-time", test_row) html ( test run + "ms" )
		@end

		@method onSuccess
		@end

		@method onFailure testID, num, reason
			$ ("#test_" + testID +" .assertions") removeClass "empty" 
			$ ("#test_" + testID +" .assertions") append (
				html li (
					{class:"assertion assertion-failed"}
					"Assertion #" + num + " failed: " + reason
				)
			)
		@end

	@end

@end

# EOF
