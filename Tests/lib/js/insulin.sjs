@module insulin
@version 0.8.0 (12-Nov-2007)
@target JavaScript
# -----------------------------------------------------------------------------
# Project           :   Insulin - A testing framework for Sugar
# -----------------------------------------------------------------------------
# Authors           :   Benoit Domingue                      <benoit@akoha.org>
#                       Simon Law                             <simon@akoha.org>
#                       Sébastien Pierre                  <sebastien@akoha.org>
# -----------------------------------------------------------------------------
# Creation date     :   2007-08-29
# Last modification :   2007-11-12
# -----------------------------------------------------------------------------

@shared ui

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

	| The name of the test case
	@property name
	| Number of tests that passed
	@property passed = 0
	| Numer of tests that failed
	@property failed = 0
	| Proper undefined value in all environments
	@property JSUNIT_UNDEFINED_VALUE

	# @property assertArrayEquals = assertObjectEquals

	@constructor _name
		name= _name
		
		if name is Undefined
			name = self getClass() getName()
		end
		
		JSUNIT_UNDEFINED_VALUE = JSUNIT_UNDEFINED_VALUE
		self assertArrayEquals = self assertObjectEquals
	@end

	@method setup
	| General setup function that is executed before running all the tests in this unit test
	@end

	@method cleanup
	| General cleanup function that is executed after running all the tests in this unit test
	@end

	@method setupAll
	| General setup function that is executed before running each of the tests in this unit test
	@end

	@method cleanupAll
	| General cleanup function that is executed after running each of the tests in this unit test
	@end

	@method getTests
	| By default this method introspects the class methods and find out about the ones who are prefixed by "test"
	| It will return the name of all test functions
		var unit_tests = new Array()

		self getClass() listMethods() :: { method, name |
			#only keep the ones prefixed with "test"
			var name_regex = new RegExp("^test.*")
			if name_regex test( name )
				#get rid of "test"  -- it's faster to look for setup and cleanup functions when we only keep the name
				var test_name = name replace("test", "")
				var unit_test= {}
				unit_test name = test_name
				unit_tests push( unit_test )
			end
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
			ui error ("FAIL: " + reason)
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
			setupAll()
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
			cleanupAll()
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
		var reason = ""
		if not e isJsUnitException
			e jsUnitMessage = e message
			e stackTrace = e stack
		end
		reason += e jsUnitMessage + "\n"
		reason += "Stack trace: \n"
		if e stackTrace != Undefined
			e stackTrace split ( "\n" ) :: { frame |
				if frame
					reason += ui indentation + frame + "\n"
				end
			}
		end
		return reason
	@end

	@group Assertions
	| Defining assertions
	|
	| We ported these directly from Hieatt's jsUnit 2.2, which is
	| available under the GPL.

		@method _trueTypeOf something
		| A more functional typeof
		| @param Object o
		| @return String
			@embed JavaScript
			|var result = typeof something;
			|try {
			|    switch (result) {
			|        case 'string':
			|        case 'boolean':
			|        case 'number':
			|            break;
			|        case 'object':
			|        case 'function':
			|            switch (something.constructor)
			|                    {
			|                case String:
			|                    result = 'String';
			|                    break;
			|                case Boolean:
			|                    result = 'Boolean';
			|                    break;
			|                case Number:
			|                    result = 'Number';
			|                    break;
			|                case Array:
			|                    result = 'Array';
			|                    break;
			|                case RegExp:
			|                    result = 'RegExp';
			|                    break;
			|                case Function:
			|                    result = 'Function';
			|                    break;
			|                default:
			|                    var m = something.constructor.toString().match(/function\s*([^( ]+)\(/);
			|                    if (m)
			|                        result = m[1];
			|                    else
			|                        break;
			|            }
			|            break;
			|    }
			|}
			|finally {
			|    result = result.substr(0, 1).toUpperCase() + result.substr(1);
			|    return result;
			|}
			@end
		@end

		@method _displayStringForValue aVar
			@embed JavaScript
			|var result = '<' + aVar + '>';
			|if (!(aVar === null || aVar === __this__.@method)) {
			|    result += ' (' + __this__._trueTypeOf(aVar) + ')';
			|}
			|return result;
			@end
		@end

		@method fail failureMessage
			raise new JsUnitException("Call to fail()", failureMessage)
		@end

		@method error errorMessage
			raise new JsUnitException("Call to error()", errorMessage)
			#UGLY below
			# @embed JavaScript
			# |var errorObject = new Object();
			# |errorObject.description = errorMessage;
			# |errorObject.stackTrace = __this__.getStackTrace();
			# |throw errorObject;
			# @end
		@end

		@method argumentsIncludeComments expectedNumberOfNonCommentArgs, args
			@embed JavaScript
			|return args.length == expectedNumberOfNonCommentArgs + 1;
			@end
		@end

		@method commentArg expectedNumberOfNonCommentArgs, args
			@embed JavaScript
			|if (__this__.argumentsIncludeComments(expectedNumberOfNonCommentArgs, args))
			|    return args[0];
			|
			|return null;
			@end
		@end

		@method nonCommentArg desiredNonCommentArgIndex, expectedNumberOfNonCommentArgs, args
			@embed JavaScript
			|return __this__.argumentsIncludeComments(expectedNumberOfNonCommentArgs, args) ?
			|       args[desiredNonCommentArgIndex] :
			|       args[desiredNonCommentArgIndex - 1];
			@end
		@end

		@method _validateArguments expectedNumberOfNonCommentArgs, args
			@embed JavaScript
			|if (!( args.length == expectedNumberOfNonCommentArgs ||
			|       (args.length == expectedNumberOfNonCommentArgs + 1 && typeof(args[0]) == 'string') ))
			|    error('Incorrect arguments passed to assert function');
			@end
		@end

		@method _assert comment, booleanValue, failureMessage
			if not booleanValue
				raise new JsUnitException( comment, failureMessage )
			end
		@end

		@method assert
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var booleanValue = __this__.nonCommentArg(1, 1, arguments);
			|
			|if (typeof(booleanValue) != 'boolean')
			|    error('Bad argument to assert(boolean)');
			|
			|__this__._assert(__this__.commentArg(1, arguments), booleanValue === true, 'Call to assert(boolean) with false');
			@end
		@end

		@method assertTrue
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var booleanValue = __this__.nonCommentArg(1, 1, arguments);
			|
			|if (typeof(booleanValue) != 'boolean')
			|    error('Bad argument to assertTrue(boolean)');
			|
			|__this__._assert(__this__.commentArg(1, arguments), booleanValue === true, 'Call to assertTrue(boolean) with false');
			@end
		@end

		@method assertFalse
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var booleanValue = __this__.nonCommentArg(1, 1, arguments);
			|
			|if (typeof(booleanValue) != 'boolean')
			|    error('Bad argument to assertFalse(boolean)');
			|
			|__this__._assert(__this__.commentArg(1, arguments), booleanValue === false, 'Call to assertFalse(boolean) with true');
			@end
		@end

		@method assertEquals
			@embed JavaScript
			|__this__._validateArguments(2, arguments);
			|var var1 = __this__.nonCommentArg(1, 2, arguments);
			|var var2 = __this__.nonCommentArg(2, 2, arguments);
			|__this__._assert(__this__.commentArg(2, arguments), var1 === var2, 'Expected ' + __this__._displayStringForValue(var1) + ' but was ' + __this__._displayStringForValue(var2));
			@end
		@end

		@method assertNotEquals
			@embed JavaScript
			|__this__._validateArguments(2, arguments);
			|var var1 = __this__.nonCommentArg(1, 2, arguments);
			|var var2 = __this__.nonCommentArg(2, 2, arguments);
			|__this__._assert(__this__.commentArg(2, arguments), var1 !== var2, 'Expected not to be ' + __this__._displayStringForValue(var2));
			@end
		@end

		@method assertNull
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var aVar = __this__.nonCommentArg(1, 1, arguments);
			|__this__._assert(__this__.commentArg(1, arguments), aVar === null, 'Expected ' + __this__._displayStringForValue(null) + ' but was ' + __this__._displayStringForValue(aVar));
			@end
		@end

		@method assertNotNull
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var aVar = __this__.nonCommentArg(1, 1, arguments);
			|__this__._assert(__this__.commentArg(1, arguments), aVar !== null, 'Expected not to be ' + __this__._displayStringForValue(null));
			@end
		@end

		@method assertUndefined
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var aVar = __this__.nonCommentArg(1, 1, arguments);
			|__this__._assert(__this__.commentArg(1, arguments), aVar === __this__.@method, 'Expected ' + __this__._displayStringForValue(__this__.@method) + ' but was ' + __this__._displayStringForValue(aVar));
			@end
		@end

		@method assertNotUndefined
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var aVar = __this__.nonCommentArg(1, 1, arguments);
			|__this__._assert(__this__.commentArg(1, arguments), aVar !== __this__.@method, 'Expected not to be ' + __this__._displayStringForValue(__this__.@method));
			@end
		@end

		@method assertNaN
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var aVar = __this__.nonCommentArg(1, 1, arguments);
			|__this__._assert(__this__.commentArg(1, arguments), isNaN(aVar), 'Expected NaN');
			@end
		@end

		@method assertNotNaN
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var aVar = __this__.nonCommentArg(1, 1, arguments);
			|__this__._assert(__this__.commentArg(1, arguments), !isNaN(aVar), 'Expected not NaN');
			@end
		@end

		@method assertObjectEquals
			@embed JavaScript
			|__this__._validateArguments(2, arguments);
			|var var1 = __this__.nonCommentArg(1, 2, arguments);
			|var var2 = __this__.nonCommentArg(2, 2, arguments);
			|var type;
			|var msg = __this__.commentArg(2, arguments)?__this__.commentArg(2, arguments):'';
			|var isSame = (var1 === var2);
			|//shortpath for references to same object
			|var isEqual = ( (type = __this__._trueTypeOf(var1)) == __this__._trueTypeOf(var2) );
			|if (isEqual && !isSame) {
			|    switch (type) {
			|        case 'String':
			|        case 'Number':
			|            isEqual = (var1 == var2);
			|            break;
			|        case 'Boolean':
			|        case 'Date':
			|            isEqual = (var1 === var2);
			|            break;
			|        case 'RegExp':
			|        case 'Function':
			|            isEqual = (var1.toString() === var2.toString());
			|            break;
			|        default: //Object | Array
			|            var i;
			|            if (isEqual = (var1.length === var2.length))
			|                for (i in var1)
			|                    assertObjectEquals(msg + ' found nested ' + type + '@' + i + '\n', var1[i], var2[i]);
			|    }
			|    __this__._assert(msg, isEqual, 'Expected ' + __this__._displayStringForValue(var1) + ' but was ' + __this__._displayStringForValue(var2));
			|}
			@end
		@end

		@method assertEvaluatesToTrue
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var value = __this__.nonCommentArg(1, 1, arguments);
			|if (!value)
			|    fail(__this__.commentArg(1, arguments));
			@end
		@end

		@method assertEvaluatesToFalse
			@embed JavaScript
			|__this__._validateArguments(1, arguments);
			|var value = __this__.nonCommentArg(1, 1, arguments);
			|if (value)
			|    fail(__this__.commentArg(1, arguments));
			@end
		@end

		@method assertHTMLEquals
			@embed JavaScript
			|__this__._validateArguments(2, arguments);
			|var var1 = __this__.nonCommentArg(1, 2, arguments);
			|var var2 = __this__.nonCommentArg(2, 2, arguments);
			|var var1Standardized = standardizeHTML(var1);
			|var var2Standardized = standardizeHTML(var2);
			|
			|__this__._assert(__this__.commentArg(2, arguments), var1Standardized === var2Standardized, 'Expected ' + __this__._displayStringForValue(var1Standardized) + ' but was ' + __this__._displayStringForValue(var2Standardized));
			@end
		@end

		@method assertHashEquals
			@embed JavaScript
			|__this__._validateArguments(2, arguments);
			|var var1 = __this__.nonCommentArg(1, 2, arguments);
			|var var2 = __this__.nonCommentArg(2, 2, arguments);
			|for (var key in var1) {
			|    assertNotUndefined("Expected hash had key " + key + " that was not found", var2[key]);
			|    assertEquals(
			|            "Value for key " + key + " mismatch - expected = " + var1[key] + ", actual = " + var2[key],
			|            var1[key], var2[key]
			|            );
			|}
			|for (var key in var2) {
			|    assertNotUndefined("Actual hash had key " + key + " that was not expected", var1[key]);
			|}
			@end
		@end

		@method assertRoughlyEquals
			@embed JavaScript
			|__this__._validateArguments(3, arguments);
			|var expected = __this__.nonCommentArg(1, 3, arguments);
			|var actual = __this__.nonCommentArg(2, 3, arguments);
			|var tolerance = __this__.nonCommentArg(3, 3, arguments);
			|assertTrue(
			|        "Expected " + expected + ", but got " + actual + " which was more than " + tolerance + " away",
			|        Math.abs(expected - actual) < tolerance
			|        );
			@end
		@end

		@method assertContains
			@embed JavaScript
			|__this__._validateArguments(2, arguments);
			|var contained = __this__.nonCommentArg(1, 2, arguments);
			|var container = __this__.nonCommentArg(2, 2, arguments);
			|assertTrue(
			|        "Expected '" + container + "' to contain '" + contained + "'",
			|        container.indexOf(contained) != -1
			|        );
			@end
		@end

		@method standardizeHTML html
			@embed JavaScript
			|var translator = document.createElement("DIV");
			|translator.innerHTML = html;
			|return translator.innerHTML;
			@end
		@end


		@method assertTypeOf
			@embed JavaScript
			|__this__._validateArguments(2, arguments);
			|var var1 = __this__.nonCommentArg(1, 2, arguments);
			|var var2 = __this__.nonCommentArg(2, 2, arguments);
			|var type = __this__._trueTypeOf(var2)
			|__this__._assert(__this__.commentArg(2, arguments), var1 === type, 'Expected type of (' + var1 + ') but was type of (' + type + ')');
			@end
		@end

		@method assertInstanceOf
			@embed JavaScript
			|__this__._validateArguments(2, arguments);
			|var var1 = __this__.nonCommentArg(1, 2, arguments);
			|var var2 = __this__.nonCommentArg(2, 2, arguments);
			|var type = __this__._trueTypeOf(var2);
			|if (type == "object" || type == "Object")
			|    type = var2.getClass().getName();
			|__this__._assert(__this__.commentArg(2, arguments), var1 === type, 'Expected instance of (' + var1 + ') but was instance of (' + type + ')');
			@end
		@end

	@end

@end

# -----------------------------------------------------------------------------
#
#  JsUnitException
#
# -----------------------------------------------------------------------------

@class JsUnitException

	@property isJsUnitException
	@property comment
	@property jsUnitMessage
	@property stackTrace
	
	@constructor _comment, message
		isJsUnitException = true
		comment           = _comment
		jsUnitMessage     = message
		stackTrace   = getStackTrace()
	@end
	
	@method getStackTrace
		return "no stack for now"
		@embed JavaScript
		|var result = '';
		|
		|if (typeof(arguments.caller) != 'undefined') { // IE, not ECMA
		|    for (var a = arguments.caller; a != null; a = a.caller) {
		|        result += '> ' + getFunctionName(a.callee) + '\n';
		|        if (a.caller == a) {
		|            result += '*';
		|            break;
		|        }
		|    }
		|}
		|else { // Mozilla, not ECMA
		|    // fake an exception so we can get Mozillas error stack
		|    var testExcp;
		|    try
		|    {
		|        throw new Error();
		|    }
		|    catch(testExcp)
		|    {
		|        var stack = testExcp.stack.split('\n');
		|        for (var i = 1; i < stack.length; i++)
		|        {
		|	     if (stack[i])
		|		result += '> ' + stack[i] + '\n';
		|        }
		|    }
		|}
		|
		|return result;
		@end
	@end
	
	@method getFunctionName aFunction
		@embed JavaScript
		|var regexpResult = aFunction.toString().match(/function(\s*)(\w*)/);
		|if (regexpResult && regexpResult.length >= 2 && regexpResult[2]) {
		|    return regexpResult[2];
		|}
		|return 'anonymous';
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
			info( "PASS [" + reason + "ms]"  )
		else
			error( "FAIL: " + reason )
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
		_append ( html div({class:"insulin-info"}, message) )
	@end

	@method warn message
		_append ( html div({class:"insulin-warning"}, message) )
	@end

	@method error message
		_append ( html div({class:"insulin-error"}, message) )
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
			$(".test-time", test_row) html ( "ms" )
		else
			$(test_row) addClass "test-failed"
			$(".test-time", test_row) html ( reason )
		end
		_append ( test_row )
		currentTest += 1
	@end

	@method onUnitTestStart name
		var test_row = html tr (
			html td ({class:"test-unit", colspan:3}, name)
		)
	@end

	@method onUnitTestEnd name, passed, failed
		var message  = "Unit test: " + name + ": " + passed + " passed " + failed + " failed"
		var test_row = html tr (
			html td ({class:"test-unit-summary", colspan:3}, message)
		)
	@end

	@method onTestCaseStart name
		var test_row = html tr (
			html td ({class:"test-case", colspan:3}, name)
		)
	@end

	@method onTestCaseEnd name, passed, failed
		var message  = "Test case: " + name + ": " + passed + " passed " + failed + " failed"
		var test_row = html tr (
			html td ({class:"test-case-summary", colspan:3}, message)
		)
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
