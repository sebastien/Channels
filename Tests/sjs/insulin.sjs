@module insulin
@version 0.8.0 (12-Nov-2007)
@target JavaScript
# -----------------------------------------------------------------------------
# Project           :   Insulin - A testing framework for Sugar
# -----------------------------------------------------------------------------
# Authors           :   Benoit Domingue                      <benoit@akoha.org>
#                       Simon Law                             <simon@akoha.org>
#                       Sebastien Pierre                  <sebastien@akoha.org>
# -----------------------------------------------------------------------------
# Creation date     :   29-Aug-2007
# Last modification :   14-Nov-2007
# -----------------------------------------------------------------------------

# TODO:  Setup semantics should be global setup once, not every call
# TODO:  Get rid of JSUnit crap code
# TODO:  Move style from "assertXXX" to "ensure same(xxx,xxx)"
# TODO:  Move style from "assertXXX" to "ensure isTrue(xxx,xxx)"
# TODO:  Make the code less fatty
# TODO:  Get rid of JavaScript-specific code (we want Insulin to work with
#        any Sugar back-end)

# FIXME: This is bad ! Should be UI, with a reasonable default
@shared ui

# ------------------------------------------------------------------------------
# PREDICATES
# ------------------------------------------------------------------------------
# NOTE: I added this because I'd like Insulin to have the OOP layer as an option
# so I can use it easily to test Extend
# ------------------------------------------------------------------------------

@function isTrue val
| Alias for 'value(val, True)'
	return same (val, True)
@end

@function isFalse val
| Alias for 'value(val, False)'
	return same (val, False)
@end

@function isUndefined val
| Alias for 'value(val==Undefined, True)'
	return same (val == Undefined, True)
@end

@function isDefined val
| Alias for 'value(val==Undefined, False)'
	return same (val == Undefined, False)
@end

@function notNull val
| Alias for 'different(val,Null)'
	return different (val, null)
@end

@function different value, otherValue
	if value != otherValue
		return succeed()
	else
		return fail ("Value is expected to be different than '" + otherValue + "', got '" + value + "'")
	end
@end

@function sameType value, otherValue
	if not same(typeof(value), typeof(otherValue))
		return False
	else
		if typeof(value) == "object"
			return  value constructor == otherValue constructor
		else
			return True
		end
	end
@end

@function same value, expected
| Succeeds if the given value is non-null or if the given value equals the other
| expected value.
	if not ( typeof(value) == typeof(expected) and value == expected )
		return fail ("Expected value to be '" + expected + "', got '" + value + "'")
	else
		return succeed()
	end
@end

@function sameKeys value, expected
| Succeeds if both dicts/objects have the same keys
	if value length == expected length
		var result = True
		value :: {v,k| if expected [k] != v -> result = False }
		return result
	else
		return False
	end
@end

@function fail reason
| Fails the current test with the given reason
	e = new Error(reason)
	e failedAssertion = True
	throw (e)
@end

@function succeed
| Success the current test
	return True
@end

# -----------------------------------------------------------------------------
#
#  Test Case
#
# -----------------------------------------------------------------------------

@class TestCase
	|The tests in the case
	@property tests = new Array()

	@property name

	@constructor ui, _name
		insulin ui = ui
		name = _name
	@end

	@method addTest test
		tests push( test )
	@end

	@method run
		var passed = 0
		var failed = 0
		
		tests :: { test |
			if test run()
				passed += 1
			else
				failed += 1
			end
		}
		
		ui onTestCaseEnd( name, passed, failed )
	@end

@end

# -----------------------------------------------------------------------------
#
#  Unit Test
#
# -----------------------------------------------------------------------------

@class UnitTest
| Base class for unit tests
| test functions should be prefixed by "test"

	# NOTE: This is more or less a hack to allow "ensure same", "ensure isNull".
	# We cannot use "assert" because it's likely to be reserved.
	# FIXME: Making this a '@shared' makes the example fail
	@property ensure = insulin

	| The name of the test case
	@property name
	| Number of tests that passed
	@property passed = 0
	| Numer of tests that failed
	@property failed = 0

	@constructor name
		self name= name
		if name is Undefined
			self name = self getClass() getName()
		end
	@end

	@method setup
	| General setup function that is executed before running all the tests in this unit test
	@end

	@method cleanup
	| General cleanup function that is executed after running all the tests in this unit test
	@end

	@method setupEach
	| General setup function that is executed before running each of the tests in this unit test
	@end

	@method cleanupEach
	| General cleanup function that is executed after running each of the tests in this unit test
	@end

	@method getTests
	| Returns an array of '{name:...,methodName:...}' representing the test methods
	| found by introspecting this class. Only method which name start with 'test' will be
	| taken into account.
	|
	| For a method named 'testFoo', the returned dictioary will be '{name:"Foo",methodName:"testFoo"}'
		var unit_tests = []
		self getClass() listMethods() :: { method, name |
			if name indexOf "test" == 0 -> unit_tests push( { name: name substring(4, name length), methodName:name } )
		}
		return unit_tests
	@end

	@method run
	| runs all the tests in the unit test
		var unit_tests = getTests()
		passed = 0
		failed = 0
		
		ui onUnitTestStart( name )
		try
			# setup for all unit tests
			setup()
			# To make sure we run the test in the right order
			0 .. (unit_tests length) :: { index |
				var test = unit_tests[ index ]
				runMethod( test name )
			}
			#cleanup for all unit tests
			cleanup()
		catch e
			var reason = handleException(e)
			ui error ( reason )
			failed += 1
		end

		ui onUnitTestEnd( name, passed, failed )
		
		return ( failed == 0 )
	@end

	@method runMethod name
	| Runs the test unit, checking for contextual setup and cleanup
	| This method is responsible for catching any exceptions that could be thrown by a test

		ui onTestStart( name )

		try
			#Check if there's a particular setup for this test
			setupEach()
			var setup_method = getTestSetup( name )
			if setup_method != null -> setup_method( )
			#runs the test
			var method     = self getMethod( "test" + name )
			#to compute delay
			var time_start = new Date() getMilliseconds()
			method()
			var time_end   = new Date() getMilliseconds()
			var time_run   = time_end - time_start

			ui onTestEnd( name, true, time_run )
			passed += 1
		catch e
			var reason = handleException(e)
			ui onTestEnd( name, false, reason )
			failed += 1
		finally
			#check if there's a particular cleanup for this test
			var cleanup_method = getTestCleanup( name )
			if cleanup_method != null -> cleanup_method()
			cleanupEach()
		end

	@end

	@method getTestSetup name
	| if there is a method prefixed with "setup", it will be called before running the associated test
		var setup_name = "setup" + name

		if ( self getClass() listMethods()[ setup_name ] != null )
			return self getMethod(setup_name)
		else
			return null
		end

	@end

	@method getTestCleanup name
	| if there is a method prefixed with "cleanup", it will be called after running the associated test
		var cleanup_name = "cleanup" + name

		if (self getClass() listMethods()[ cleanup_name ])
			return self getMethod( cleanup_name )
		else
			return null
		end
	@end
	
	@method handleException e
		if ui formatException
			return ui formatException (e)
		else
			return e
		end
	@end

	@group Assertions
	| Defining assertions

		@method assertEquals a, b
			return ensure same (a, b)
		@end

		@method assertNotNull a
			return ensure notNull (a)
		@end

		@method assertUndefined a
			return ensure isUndefined (a)
		@end

		@method assertTrue a
			return ensure isTrue (a)
		@end

		@method assertFalse a
			return ensure isFalse (a)
		@end

	@end

@end

# -----------------------------------------------------------------------------
#
#  StringUI
#
# -----------------------------------------------------------------------------

@class StringUI

	@property indent = ""
	@property indentation = "  "

	@method format prefix, indent, message
		iprefix = ""
		0 .. (prefix length) :: {
			iprefix += " "
		}
		result = ""
		first = true
		message split( "\n" ) :: { line |
			if line
				if first
					result += prefix
					first = false
				else
					result += "\n" + iprefix
				end
				result += indent + line
			end
		}
		return result
	@end

	@method display message
	| prints a message
		return format( "", indent, message )
	@end

	@method info message
	| prints an informational message
	| You should use this for messages that shouldn't be ignored.
		return format( "I: ", indent, message )
	@end

	@method warn message
	| prints a warning message
	| Use this for when a test must be skipped, but where this doesn't
	| count as a failure.
		return format( "W: ", indent, message )
	@end

	@method error message
	| prints an error message
	| Use this for fatal errors.
		return format( "E: ", indent, message )
	@end

	@method onTestStart name
		var result = info( "Test: " + name )
		indent += indentation
		return result
	@end

	@method onTestEnd name, success, reason
		var result
		if success
			result = info( "PASS [" + reason + "ms]"  )
		else
			result = error( "FAIL: " + reason )
		end
		indent = indent replace( indentation, "" )
		return result
	@end

	@method onUnitTestStart name
		var result = info( "Unit test: " + name )
		indent += indentation
		return result
	@end

	@method onUnitTestEnd name, passed, failed
		var message = "Unit test: " + name + ": " + passed + " passed, " + failed + " failed"
		var result
		if failed
			result = error( message )
		else
			result = info( message )
		end
		indent = indent replace( indentation, "" )
		return result
	@end

	@method onTestCaseStart name
		var result = info( "Test case: " + name )
		indent += indentation
		return result
	@end

	@method onTestCaseEnd name, passed, failed
		var message = "Test case: " + name + ": " + passed + " passed " + failed + " failed"
		var result
		if failed
			result = error( message )
		else
			result = info( message )
		end
		indent = indent replace( indentation, "" )
		return result
	@end
@end

# -----------------------------------------------------------------------------
#
#  TestUI
# 
# -----------------------------------------------------------------------------

@class TestUI
| Default UI for Testing
| This defaults to Sugar's print method, which chooses either the system's
| or browser's console.

	@property string

	@constructor
		self string = new StringUI()
	@end

	@method display message
	| prints a message
		print( string display( message ))
	@end

	@method info message
	| prints an informational message
	| You should use this for messages that shouldn't be ignored.
		print( string info( message ))
	@end

	@method warn message
	| prints a warning message
	| Use this for when a test must be skipped, but where this doesn't
	| count as a failure.
		print( string warn( message ) )
	@end

	@method error message
	| prints an error message
	| Use this for fatal errors.
		print( string error( message ) )
	@end

	@method onTestStart name
		print( string onTestStart( name ) )
	@end

	@method onTestEnd name, success, reason
		print( string onTestEnd( name, success, reason ) )
	@end

	@method onUnitTestStart name
		print( string onUnitTestStart( name ) )
	@end

	@method onUnitTestEnd name, passed, failed
		print( string onUnitTestEnd( name, passed, failed ) )
	@end

	@method onTestCaseStart name
		print( string onTestCaseStart( name ) )
	@end

	@method onTestCaseEnd name, passed, failed
		print( string onTestCaseEnd( name, passed, failed ) )
	@end

	@method formatException e
		var reason = ""
		reason += e message + "\n"
		if not e failedAssertion
			reason += "Stack trace: \n"
			if e stack != Undefined
				e stack split ( "\n" ) :: { frame |
					if frame
						reason += (self indentation or "") + "  " + frame + "\n"
					end
				}
			end
		end
		return reason
	@end

@end


@function getTestUI testID
	if typeof(window) != "undefined" and "console" in window and "trace" in console
		if testID != "undefined" and testID
			return new LoggedFirebugTestUI( testID )
		else
			return new HtmlTestUI()
		end
	else
		return new TestUI()
	end
@end

# -----------------------------------------------------------------------------
#
#  FirebugTestUI
# 
# -----------------------------------------------------------------------------

@class FirebugTestUI: TestUI
| overrides TestUI to send messages to the Firebug console
| Use this UI when Firebug is installed.
	
	@method info message
		console info ( message )
	@end

	@method warn message
		console warn ( message )
	@end

	@method error message
		console error ( message )
	@end

	@method onTestStart name
		console group ( "Test: " + name )
	@end

	@method onTestEnd name, success, reason
		if success
			console info( "PASS [" + reason + "ms]"  )
		else
			console error( "FAIL: " + reason )
		end
		console groupEnd ()
	@end

	@method onUnitTestStart name
		console group ( "Unit test: " + name )
	@end

	@method onUnitTestEnd name, passed, failed
		var message = "Unit test: " + name + ": " + passed + " passed, " + failed + " failed"
		if failed
			console error( message )
		else
			console info( message )
		end
		console groupEnd ()
	@end

	@method onTestCaseStart name
		console group ( "Test case: " + name )
	@end

	@method onTestCaseEnd name, passed, failed
		var message  = "Test case: " + name + ": " + passed + " passed " + failed + " failed"
		if failed
			console error( message )
			$("#TestResult") css({
				background : "red"
				color : "white"
			}) html(
				message
			)	
		else
			console info( message )
			$("#TestResult") css({
				background : "green"
				color : "white"
			}) html(
				message
			)
		end
		console groupEnd ()

	@end
@end

# -----------------------------------------------------------------------------
#
#  LoggedFirebugTestUI
# 
# -----------------------------------------------------------------------------

@class LoggedFirebugTestUI: FirebugTestUI
	
	@property testID

	@constructor testID
		self testID = testID
		self string = new StringUI()
	@end
	
	@method log message
		var output = {}
		output output = message + "\n"
		$ ajax({
			type : "POST"
			url : "/tests/results/" + testID + "/log"
			data : output
			async : false
		})
	@end

	@method info message
		super info( message )
		log( string info( message ) )
	@end

	@method warn message
		super warn( message )
		log( string warn( message ) )
	@end

	@method error message
		super error( message )
		log( string error( message ) )
	@end

	@method onTestStart name
		super onTestStart( name )
		log( string onTestStart( name ) )
	@end

	@method onTestEnd name, success, reason
		super onTestEnd( name, success, reason )
		log( string onTestEnd( name, success, reason ) )
	@end

	@method onUnitTestStart name
		super onUnitTestStart( name )
		log( string onUnitTestStart( name ) )
	@end

	@method onUnitTestEnd name, passed, failed
		super onUnitTestEnd( name, passed, failed )
		log( string onUnitTestEnd( name, passed, failed ) )
	@end

	@method onTestCaseStart name
		super onTestCaseStart( name )
		log( string onTestCaseStart ( name ) )
	@end

	@method onTestCaseEnd name, passed, failed
		super onTestCaseEnd( name, passed, failed )
		log( string onTestCaseEnd( name, passed, failed ) )
		$ ajax({
			type : "POST"
			url : "/tests/results/" + testID + "/stopped"
			data : {}
			async : false
		})
	@end
	
@end

# -----------------------------------------------------------------------------
#
#  HtmlTestUI
# 
# -----------------------------------------------------------------------------

@class HtmlTestUI: TestUI
| overrides TestUI display messages in a webpage

	@property selector
	@property stackLimit      = 5
	@property currentTestCase = 0
	@property currentTestUnit = 0
	@property currentTest     = 0

	@constructor selector=".TestResults"
		super()
		self selector = selector
	@end

	@method _append node
		$(selector) append (node)
	@end

	@method info message
		var test_row = html tr (
			html td ({class:"test-unit-summary", colspan:3}, html div({class:"insulin-info"}, message) )
		)
		_append( test_row )
	@end

	@method warn message
		var test_row = html tr (
			html td ({class:"test-unit-summary", colspan:3}, html div({class:"insulin-warning"}, message) )
		)
		_append( test_row )
	@end

	@method error message
		var test_row = html tr (
			html td ({class:"test-unit-summary", colspan:3}, html div({class:"insulin-error"}, message) )
		)
		_append( test_row )
	@end

	@method separator
	@end

	@method onTestStart name
		var test_id   = currentTest
		var test_name = name
		var test_row  = html tr (
			{
				id    : "test_" + test_id
				class : "test test-running"
			}
			html td  ({class:"test-id"},"#" + test_id )
			html td  (
				{class:"test-name"}
				"" + test_name
				html div (
					html ul {class:"assertions empty"}
				)
			)
			html td({class:"test-time"}, "running...")
		)
		_append (test_row)
	@end

	@method onTestEnd name, success, reason
		var test_row = $("#test_" + currentTest)
		$ (test_row) removeClass "test-running"
		if success
			$(test_row) addClass "test-succeeded"
			$(".test-time", test_row) html ( reason + "ms" )
		else
			$(test_row) addClass "test-failed"
			$(".test-time", test_row) html ( html pre (reason) )
		end
		_append ( test_row )
		currentTest += 1
	@end

	@method onUnitTestStart name
		var test_row = html tr (
			html td ({class:"test-unit", colspan:3}, name)
		)
		_append( test_row )
	@end

	@method onUnitTestEnd name, passed, failed
		var message  = "Unit test: " + name + ": " + passed + " passed " + failed + " failed"
		var test_row = html tr (
			html td ({class:"test-unit-summary", colspan:3}, message)
		)
		_append( test_row )
		
		
		
	@end

	@method onTestCaseStart name
		var test_row = html tr (
			html td ({class:"test-case", colspan:3}, name)
		)
		_append( test_row )
	@end

	@method onTestCaseEnd name, passed, failed
		var message  = "Test case: " + name + ": " + passed + " passed " + failed + " failed"
		var test_row = html tr (
			html td ({class:"test-case-summary", colspan:3}, message)
		)
		_append( test_row )
		
		
		if failed
			console error( message )
			$("#TestResult") css({
				background : "red"
				color : "white"
			}) html(
				message
			)	
		else
			console info( message )
			$("#TestResult") css({
				background : "green"
				color : "white"
			}) html(
				message
			)
		end
	@end

	@method formatException e
			var stack_trace    = html table ( {class:"exception-stack  "})
			if e stack != Undefined
				e stack split ( "\n" ) :: { frame, i |
					if frame and i <= stackLimit
						var at_separator    = frame lastIndexOf "@"
						var colon_separator = frame lastIndexOf ":"
						var exception       = frame substr(0,at_separator )
						var file            = frame substr(at_separator + 1 , colon_separator - at_separator - 1 )
						var line            = frame substr(colon_separator + 1 , frame length - at_separator - 2 )
						stack_trace appendChild (html tr (
							html td ({class:"exception-message"}, exception)
							html td ({class:"exception-file"},    file)
							html td ({class:"exception-line"},    line)
						))
					end
				}
			end
			var html_message   = html div ( {class:"exception-message"}, e message )
			var html_exception = html div ( {class:"exception"}
				html_message
				stack_trace
			)
			$(html_message) click { $(stack_trace) toggle() }
			return html_exception
	@end

@end

# -----------------------------------------------------------------------------
#
#  TestRunner
# 
# -----------------------------------------------------------------------------

@class TestRunner

	@property testID
	@property testCase

	@constructor testID, testCaseName
		self testID = testID
		var test_ui = getTestUI( self testID )
		testCase = new TestCase( test_ui, testCaseName )
		findTests()
		return self
	@end
	
	@method addTest newTest
		testCase addTest( newTest )
	@end
	
	@method findTests
		Extend getChildrenOf( UnitTest ) :: { test |
			testCase addTest( new test() )
		}
	@end
	
	@method runTests
		testCase run()
		test_ui 
	@end

@end

# EOF
