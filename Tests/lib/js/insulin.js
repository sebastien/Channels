// 8< ---[insulin.js]---
var insulin={}
insulin._VERSION_='0.8.0';
insulin.ui=undefined
insulin.TestCase=Extend.Class({
	// The tests in the case
	name:'insulin.TestCase', parent:undefined,
	properties:{
		tests:new Array(),
		name:undefined
	},
	initialize:function(ui, _name){
		var __this__=this
		__this__.tests = new Array()
		insulin.ui = ui;
		__this__.name = _name;
	},
	methods:{
		addTest:function(test){
			var __this__=this
			__this__.tests.push(test)
		},
		run:function(){
			var __this__=this
			var passed=0;
			var failed=0;
			Extend.iterate(__this__.tests, function(test){
				if ( test.run() )
				{
					passed = (passed + 1);
				}
				else if ( true )
				{
					failed = (failed + 1);
				}
			}, __this__)
			insulin.ui.onTestCaseEnd(__this__.name, passed, failed)
		}
	}
})
insulin.UnitTest=Extend.Class({
	// Base class for unit tests
	// test functions should be prefixed by "test"
	// The name of the test case
	name:'insulin.UnitTest', parent:undefined,
	properties:{
		// Number of tests that passed
		name:undefined,
		// Numer of tests that failed
		passed:0,
		// Proper undefined value in all environments
		failed:0,
		JSUNIT_UNDEFINED_VALUE:undefined
	},
	initialize:function(_name){
		var __this__=this
		__this__.passed = 0
		__this__.failed = 0
		__this__.name = _name;
		if ( (__this__.name == undefined) )
		{
			__this__.name = __this__.getClass().getName();
		}
		__this__.JSUNIT_UNDEFINED_VALUE = __this__.JSUNIT_UNDEFINED_VALUE;
		__this__.assertArrayEquals = __this__.assertObjectEquals;
	},
	methods:{
		// General setup function that is executed before running all the tests in this unit test
		setup:function(){
			var __this__=this
		},
		// General cleanup function that is executed after running all the tests in this unit test
		cleanup:function(){
			var __this__=this
		},
		// General setup function that is executed before running each of the tests in this unit test
		setupAll:function(){
			var __this__=this
		},
		// General cleanup function that is executed after running each of the tests in this unit test
		cleanupAll:function(){
			var __this__=this
		},
		// By default this method introspects the class methods and find out about the ones who are prefixed by "test"
		// It will return the name of all test functions
		getTests:function(){
			var __this__=this
			var unit_tests=new Array();
			Extend.iterate(__this__.getClass().listMethods(), function(method, name){
				var name_regex=new RegExp("^test.*");
				if ( name_regex.test(name) )
				{
					var test_name=name.replace("test", "");
					var unit_test={};
					unit_test.name = test_name;
					unit_tests.push(unit_test)
				}
			}, __this__)
			return unit_tests
		},
		// runs all the tests in the unit test
		run:function(){
			var __this__=this
			var unit_tests=__this__.getTests();
			__this__.passed = 0;
			__this__.failed = 0;
			insulin.ui.onUnitTestStart(__this__.name)
			try {
				__this__.setup()
				Extend.iterate(Extend.range(0,(unit_tests.length)), function(index){
					var test=unit_tests[index];
					__this__.runMethod(test.name)
				}, __this__)
				__this__.cleanup()
			}
			catch(e){
				var reason=__this__.handleException(e);
				insulin.ui.error(("FAIL: " + reason))
				__this__.failed = (__this__.failed + 1);
			}
			insulin.ui.onUnitTestEnd(__this__.name, __this__.passed, __this__.failed)
			return (__this__.failed == 0)
		},
		// Runs the test unit, checking for contextual setup and cleanup
		// This method is responsible for catching any exceptions that could be thrown by a test
		runMethod:function(name){
			var __this__=this
			insulin.ui.onTestStart(name)
			try {
				__this__.setupAll()
				var setup_method=__this__.getTestSetup(name);
				if ( (setup_method != null) )
				{
					setup_method()
				}
				var method=__this__.getMethod(("test" + name));
				var time_start=new Date().getMilliseconds();
				method()
				var time_end=new Date().getMilliseconds();
				var time_run=(time_end - time_start);
				insulin.ui.onTestEnd(name, true, time_run)
				__this__.passed = (__this__.passed + 1);
			}
			catch(e){
				var reason=__this__.handleException(e);
				insulin.ui.onTestEnd(name, false, reason)
				__this__.failed = (__this__.failed + 1);
			}
			finally {
				var cleanup_method=__this__.getTestCleanup(name);
				if ( (cleanup_method != null) )
				{
					cleanup_method()
				}
				__this__.cleanupAll()
			}
		},
		// if there is a method prefixed with "setup", it will be called before running the associated test
		getTestSetup:function(name){
			var __this__=this
			var setup_name=("setup" + name);
			if ( (__this__.getClass().listMethods()[setup_name] != null) )
			{
				return __this__.getMethod(setup_name)
			}
			else if ( true )
			{
				return null
			}
		},
		// if there is a method prefixed with "cleanup", it will be called after running the associated test
		getTestCleanup:function(name){
			var __this__=this
			var cleanup_name=("cleanup" + name);
			if ( __this__.getClass().listMethods()[cleanup_name] )
			{
				return __this__.getMethod(cleanup_name)
			}
			else if ( true )
			{
				return null
			}
		},
		handleException:function(e){
			var __this__=this
			var reason="";
			if ( (! e.isJsUnitException) )
			{
				e.jsUnitMessage = e.message;
				e.stackTrace = e.stack;
			}
			reason = (reason + (e.jsUnitMessage + "\n"));
			reason = (reason + "Stack trace: \n");
			if ( (e.stackTrace != undefined) )
			{
				Extend.iterate(e.stackTrace.split("\n"), function(frame){
					if ( frame )
					{
						reason = (reason + ((insulin.ui.indentation + frame) + "\n"));
					}
				}, __this__)
			}
			return reason
		},
		// A more functional typeof
		// @param Object o
		// @return String
		_trueTypeOf:function(something){
			var __this__=this
			var result = typeof something;
			try {
			    switch (result) {
			        case 'string':
			        case 'boolean':
			        case 'number':
			            break;
			        case 'object':
			        case 'function':
			            switch (something.constructor)
			                    {
			                case String:
			                    result = 'String';
			                    break;
			                case Boolean:
			                    result = 'Boolean';
			                    break;
			                case Number:
			                    result = 'Number';
			                    break;
			                case Array:
			                    result = 'Array';
			                    break;
			                case RegExp:
			                    result = 'RegExp';
			                    break;
			                case Function:
			                    result = 'Function';
			                    break;
			                default:
			                    var m = something.constructor.toString().match(/function\s*([^( ]+)\(/);
			                    if (m)
			                        result = m[1];
			                    else
			                        break;
			            }
			            break;
			    }
			}
			finally {
			    result = result.substr(0, 1).toUpperCase() + result.substr(1);
			    return result;
			}
			
		},
		_displayStringForValue:function(aVar){
			var __this__=this
			var result = '<' + aVar + '>';
			if (!(aVar === null || aVar === __this__.@method)) {
			    result += ' (' + __this__._trueTypeOf(aVar) + ')';
			}
			return result;
			
		},
		fail:function(failureMessage){
			var __this__=this
			throw new insulin.JsUnitException("Call to fail()", failureMessage)
		},
		error:function(errorMessage){
			var __this__=this
			throw new insulin.JsUnitException("Call to error()", errorMessage)
		},
		argumentsIncludeComments:function(expectedNumberOfNonCommentArgs, args){
			var __this__=this
			return args.length == expectedNumberOfNonCommentArgs + 1;
			
		},
		commentArg:function(expectedNumberOfNonCommentArgs, args){
			var __this__=this
			if (__this__.argumentsIncludeComments(expectedNumberOfNonCommentArgs, args))
			    return args[0];
			
			return null;
			
		},
		nonCommentArg:function(desiredNonCommentArgIndex, expectedNumberOfNonCommentArgs, args){
			var __this__=this
			return __this__.argumentsIncludeComments(expectedNumberOfNonCommentArgs, args) ?
			       args[desiredNonCommentArgIndex] :
			       args[desiredNonCommentArgIndex - 1];
			
		},
		_validateArguments:function(expectedNumberOfNonCommentArgs, args){
			var __this__=this
			if (!( args.length == expectedNumberOfNonCommentArgs ||
			       (args.length == expectedNumberOfNonCommentArgs + 1 && typeof(args[0]) == 'string') ))
			    error('Incorrect arguments passed to assert function');
			
		},
		_assert:function(comment, booleanValue, failureMessage){
			var __this__=this
			if ( (! booleanValue) )
			{
				throw new insulin.JsUnitException(comment, failureMessage)
			}
		},
		assert:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var booleanValue = __this__.nonCommentArg(1, 1, arguments);
			
			if (typeof(booleanValue) != 'boolean')
			    error('Bad argument to assert(boolean)');
			
			__this__._assert(__this__.commentArg(1, arguments), booleanValue === true, 'Call to assert(boolean) with false');
			
		},
		assertTrue:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var booleanValue = __this__.nonCommentArg(1, 1, arguments);
			
			if (typeof(booleanValue) != 'boolean')
			    error('Bad argument to assertTrue(boolean)');
			
			__this__._assert(__this__.commentArg(1, arguments), booleanValue === true, 'Call to assertTrue(boolean) with false');
			
		},
		assertFalse:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var booleanValue = __this__.nonCommentArg(1, 1, arguments);
			
			if (typeof(booleanValue) != 'boolean')
			    error('Bad argument to assertFalse(boolean)');
			
			__this__._assert(__this__.commentArg(1, arguments), booleanValue === false, 'Call to assertFalse(boolean) with true');
			
		},
		assertEquals:function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			__this__._assert(__this__.commentArg(2, arguments), var1 === var2, 'Expected ' + __this__._displayStringForValue(var1) + ' but was ' + __this__._displayStringForValue(var2));
			
		},
		assertNotEquals:function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			__this__._assert(__this__.commentArg(2, arguments), var1 !== var2, 'Expected not to be ' + __this__._displayStringForValue(var2));
			
		},
		assertNull:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), aVar === null, 'Expected ' + __this__._displayStringForValue(null) + ' but was ' + __this__._displayStringForValue(aVar));
			
		},
		assertNotNull:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), aVar !== null, 'Expected not to be ' + __this__._displayStringForValue(null));
			
		},
		assertUndefined:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), aVar === __this__.@method, 'Expected ' + __this__._displayStringForValue(__this__.@method) + ' but was ' + __this__._displayStringForValue(aVar));
			
		},
		assertNotUndefined:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), aVar !== __this__.@method, 'Expected not to be ' + __this__._displayStringForValue(__this__.@method));
			
		},
		assertNaN:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), isNaN(aVar), 'Expected NaN');
			
		},
		assertNotNaN:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), !isNaN(aVar), 'Expected not NaN');
			
		},
		assertObjectEquals:function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			var type;
			var msg = __this__.commentArg(2, arguments)?__this__.commentArg(2, arguments):'';
			var isSame = (var1 === var2);
			//shortpath for references to same object
			var isEqual = ( (type = __this__._trueTypeOf(var1)) == __this__._trueTypeOf(var2) );
			if (isEqual && !isSame) {
			    switch (type) {
			        case 'String':
			        case 'Number':
			            isEqual = (var1 == var2);
			            break;
			        case 'Boolean':
			        case 'Date':
			            isEqual = (var1 === var2);
			            break;
			        case 'RegExp':
			        case 'Function':
			            isEqual = (var1.toString() === var2.toString());
			            break;
			        default: //Object | Array
			            var i;
			            if (isEqual = (var1.length === var2.length))
			                for (i in var1)
			                    assertObjectEquals(msg + ' found nested ' + type + '@' + i + '\n', var1[i], var2[i]);
			    }
			    __this__._assert(msg, isEqual, 'Expected ' + __this__._displayStringForValue(var1) + ' but was ' + __this__._displayStringForValue(var2));
			}
			
		},
		assertEvaluatesToTrue:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var value = __this__.nonCommentArg(1, 1, arguments);
			if (!value)
			    fail(__this__.commentArg(1, arguments));
			
		},
		assertEvaluatesToFalse:function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var value = __this__.nonCommentArg(1, 1, arguments);
			if (value)
			    fail(__this__.commentArg(1, arguments));
			
		},
		assertHTMLEquals:function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			var var1Standardized = standardizeHTML(var1);
			var var2Standardized = standardizeHTML(var2);
			
			__this__._assert(__this__.commentArg(2, arguments), var1Standardized === var2Standardized, 'Expected ' + __this__._displayStringForValue(var1Standardized) + ' but was ' + __this__._displayStringForValue(var2Standardized));
			
		},
		assertHashEquals:function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			for (var key in var1) {
			    assertNotUndefined("Expected hash had key " + key + " that was not found", var2[key]);
			    assertEquals(
			            "Value for key " + key + " mismatch - expected = " + var1[key] + ", actual = " + var2[key],
			            var1[key], var2[key]
			            );
			}
			for (var key in var2) {
			    assertNotUndefined("Actual hash had key " + key + " that was not expected", var1[key]);
			}
			
		},
		assertRoughlyEquals:function(){
			var __this__=this
			__this__._validateArguments(3, arguments);
			var expected = __this__.nonCommentArg(1, 3, arguments);
			var actual = __this__.nonCommentArg(2, 3, arguments);
			var tolerance = __this__.nonCommentArg(3, 3, arguments);
			assertTrue(
			        "Expected " + expected + ", but got " + actual + " which was more than " + tolerance + " away",
			        Math.abs(expected - actual) < tolerance
			        );
			
		},
		assertContains:function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var contained = __this__.nonCommentArg(1, 2, arguments);
			var container = __this__.nonCommentArg(2, 2, arguments);
			assertTrue(
			        "Expected '" + container + "' to contain '" + contained + "'",
			        container.indexOf(contained) != -1
			        );
			
		},
		standardizeHTML:function(html){
			var __this__=this
			var translator = document.createElement("DIV");
			translator.innerHTML = html;
			return translator.innerHTML;
			
		},
		assertTypeOf:function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			var type = __this__._trueTypeOf(var2)
			__this__._assert(__this__.commentArg(2, arguments), var1 === type, 'Expected type of (' + var1 + ') but was type of (' + type + ')');
			
		},
		assertInstanceOf:function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			var type = __this__._trueTypeOf(var2);
			if (type == "object" || type == "Object")
			    type = var2.getClass().getName();
			__this__._assert(__this__.commentArg(2, arguments), var1 === type, 'Expected instance of (' + var1 + ') but was instance of (' + type + ')');
			
		}
	}
})
insulin.JsUnitException=Extend.Class({
	name:'insulin.JsUnitException', parent:undefined,
	properties:{
		isJsUnitException:undefined,
		comment:undefined,
		jsUnitMessage:undefined,
		stackTrace:undefined
	},
	initialize:function(_comment, message){
		var __this__=this
		__this__.isJsUnitException = true;
		__this__.comment = _comment;
		__this__.jsUnitMessage = message;
		__this__.stackTrace = __this__.getStackTrace();
	},
	methods:{
		getStackTrace:function(){
			var __this__=this
			return "no stack for now"
			var result = '';
			
			if (typeof(arguments.caller) != 'undefined') { // IE, not ECMA
			    for (var a = arguments.caller; a != null; a = a.caller) {
			        result += '> ' + getFunctionName(a.callee) + '\n';
			        if (a.caller == a) {
			            result += '*';
			            break;
			        }
			    }
			}
			else { // Mozilla, not ECMA
			    // fake an exception so we can get Mozillas error stack
			    var testExcp;
			    try
			    {
			        throw new Error();
			    }
			    catch(testExcp)
			    {
			        var stack = testExcp.stack.split('\n');
			        for (var i = 1; i < stack.length; i++)
			        {
				     if (stack[i])
					result += '> ' + stack[i] + '\n';
			        }
			    }
			}
			
			return result;
			
		},
		getFunctionName:function(aFunction){
			var __this__=this
			var regexpResult = aFunction.toString().match(/function(\s*)(\w*)/);
			if (regexpResult && regexpResult.length >= 2 && regexpResult[2]) {
			    return regexpResult[2];
			}
			return 'anonymous';
			
		}
	}
})
insulin.StringUI=Extend.Class({
	name:'insulin.StringUI', parent:undefined,
	properties:{
		indent:"",
		indentation:"  "
	},
	methods:{
		format:function(prefix, indent, message){
			var __this__=this
			iprefix = "";
			Extend.iterate(Extend.range(0,(prefix.length)), function(){
				iprefix = (iprefix + " ");
			}, __this__)
			result = "";
			first = true;
			Extend.iterate(message.split("\n"), function(line){
				if ( line )
				{
					if ( first )
					{
						result = (result + prefix);
						first = false;
					}
					else if ( true )
					{
						result = (result + ("\n" + iprefix));
					}
					result = (result + (indent + line));
				}
			}, __this__)
			return result
		},
		// prints a message
		display:function(message){
			var __this__=this
			return __this__.format("", __this__.indent, message)
		},
		// prints an informational message
		// You should use this for messages that shouldn't be ignored.
		info:function(message){
			var __this__=this
			return __this__.format("I: ", __this__.indent, message)
		},
		// prints a warning message
		// Use this for when a test must be skipped, but where this doesn't
		// count as a failure.
		warn:function(message){
			var __this__=this
			return __this__.format("W: ", __this__.indent, message)
		},
		// prints an error message
		// Use this for fatal errors.
		error:function(message){
			var __this__=this
			return __this__.format("E: ", __this__.indent, message)
		},
		onTestStart:function(name){
			var __this__=this
			var result=__this__.info(("Test: " + name));
			__this__.indent = (__this__.indent + __this__.indentation);
			return result
		},
		onTestEnd:function(name, success, reason){
			var __this__=this
			var result;
			if ( success )
			{
				result = __this__.info((("PASS [" + reason) + "ms]"));
			}
			else if ( true )
			{
				result = __this__.error(("FAIL: " + reason));
			}
			__this__.indent = __this__.indent.replace(__this__.indentation, "");
			return result
		},
		onUnitTestStart:function(name){
			var __this__=this
			var result=__this__.info(("Unit test: " + name));
			__this__.indent = (__this__.indent + __this__.indentation);
			return result
		},
		onUnitTestEnd:function(name, passed, failed){
			var __this__=this
			var message=(((((("Unit test: " + name) + ": ") + passed) + " passed, ") + failed) + " failed");
			var result;
			if ( failed )
			{
				result = __this__.error(message);
			}
			else if ( true )
			{
				result = __this__.info(message);
			}
			__this__.indent = __this__.indent.replace(__this__.indentation, "");
			return result
		},
		onTestCaseStart:function(name){
			var __this__=this
			var result=__this__.info(("Test case: " + name));
			__this__.indent = (__this__.indent + __this__.indentation);
			return result
		},
		onTestCaseEnd:function(name, passed, failed){
			var __this__=this
			var message=(((((("Test case: " + name) + ": ") + passed) + " passed ") + failed) + " failed");
			var result;
			if ( failed )
			{
				result = __this__.error(message);
			}
			else if ( true )
			{
				result = __this__.info(message);
			}
			__this__.indent = __this__.indent.replace(__this__.indentation, "");
			return result
		}
	}
})
insulin.TestUI=Extend.Class({
	// Default UI for Testing
	// This defaults to Sugar's print method, which chooses either the system's
	// or browser's console.
	name:'insulin.TestUI', parent:undefined,
	properties:{
		string:undefined
	},
	initialize:function(){
		var __this__=this
		__this__.string = new insulin.StringUI();
	},
	methods:{
		// prints a message
		display:function(message){
			var __this__=this
			Extend.print(__this__.string.display(message))
		},
		// prints an informational message
		// You should use this for messages that shouldn't be ignored.
		info:function(message){
			var __this__=this
			Extend.print(__this__.string.info(message))
		},
		// prints a warning message
		// Use this for when a test must be skipped, but where this doesn't
		// count as a failure.
		warn:function(message){
			var __this__=this
			Extend.print(__this__.string.warn(message))
		},
		// prints an error message
		// Use this for fatal errors.
		error:function(message){
			var __this__=this
			Extend.print(__this__.string.error(message))
		},
		onTestStart:function(name){
			var __this__=this
			Extend.print(__this__.string.onTestStart(name))
		},
		onTestEnd:function(name, success, reason){
			var __this__=this
			Extend.print(__this__.string.onTestEnd(name, success, reason))
		},
		onUnitTestStart:function(name){
			var __this__=this
			Extend.print(__this__.string.onUnitTestStart(name))
		},
		onUnitTestEnd:function(name, passed, failed){
			var __this__=this
			Extend.print(__this__.string.onUnitTestEnd(name, passed, failed))
		},
		onTestCaseStart:function(name){
			var __this__=this
			Extend.print(__this__.string.onTestCaseStart(name))
		},
		onTestCaseEnd:function(name, passed, failed){
			var __this__=this
			Extend.print(__this__.string.onTestCaseEnd(name, passed, failed))
		}
	}
})
insulin.getTestUI=	function(testID){
		var __this__=insulin;
		if ( (((typeof(window) != "undefined") && ("console" in window)) && ("trace" in console)) )
		{
			if ( ((testID != "undefined") && testID) )
			{
				return new insulin.LoggedFirebugTestUI(testID)
			}
			else if ( true )
			{
				return new insulin.HtmlTestUI()
			}
		}
		else if ( true )
		{
			return new insulin.TestUI()
		}
	}
insulin.FirebugTestUI=Extend.Class({
	// overrides TestUI to send messages to the Firebug console
	// Use this UI when Firebug is installed.
	name:'insulin.FirebugTestUI', parent:insulin.TestUI,
	methods:{
		info:function(message){
			var __this__=this
			console.info(message)
		},
		warn:function(message){
			var __this__=this
			console.warn(message)
		},
		error:function(message){
			var __this__=this
			console.error(message)
		},
		onTestStart:function(name){
			var __this__=this
			console.group(("Test: " + name))
		},
		onTestEnd:function(name, success, reason){
			var __this__=this
			if ( success )
			{
				__this__.info((("PASS [" + reason) + "ms]"))
			}
			else if ( true )
			{
				__this__.error(("FAIL: " + reason))
			}
			console.groupEnd()
		},
		onUnitTestStart:function(name){
			var __this__=this
			console.group(("Unit test: " + name))
		},
		onUnitTestEnd:function(name, passed, failed){
			var __this__=this
			var message=(((((("Unit test: " + name) + ": ") + passed) + " passed, ") + failed) + " failed");
			if ( failed )
			{
				console.error(message)
			}
			else if ( true )
			{
				console.info(message)
			}
			console.groupEnd()
		},
		onTestCaseStart:function(name){
			var __this__=this
			console.group(("Test case: " + name))
		},
		onTestCaseEnd:function(name, passed, failed){
			var __this__=this
			var message=(((((("Test case: " + name) + ": ") + passed) + " passed ") + failed) + " failed");
			if ( failed )
			{
				console.error(message)
				$("#TestResult").css({"background":"red", "color":"white"}).html(message)
			}
			else if ( true )
			{
				console.info(message)
				$("#TestResult").css({"background":"green", "color":"white"}).html(message)
			}
			console.groupEnd()
		}
	}
})
insulin.LoggedFirebugTestUI=Extend.Class({
	name:'insulin.LoggedFirebugTestUI', parent:insulin.FirebugTestUI,
	properties:{
		testID:undefined
	},
	initialize:function(testID){
		var __this__=this
		__this__.testID = testID;
		__this__.string = new insulin.StringUI();
	},
	methods:{
		log:function(message){
			var __this__=this
			var output={};
			output.output = (message + "\n");
			$.ajax({"type":"POST", "url":(("/tests/results/" + __this__.testID) + "/log"), "data":output, "async":false})
		},
		info:function(message){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).info(message)
			__this__.log(__this__.string.info(message))
		},
		warn:function(message){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).warn(message)
			__this__.log(__this__.string.warn(message))
		},
		error:function(message){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).error(message)
			__this__.log(__this__.string.error(message))
		},
		onTestStart:function(name){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onTestStart(name)
			__this__.log(__this__.string.onTestStart(name))
		},
		onTestEnd:function(name, success, reason){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onTestEnd(name, success, reason)
			__this__.log(__this__.string.onTestEnd(name, success, reason))
		},
		onUnitTestStart:function(name){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onUnitTestStart(name)
			__this__.log(__this__.string.onUnitTestStart(name))
		},
		onUnitTestEnd:function(name, passed, failed){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onUnitTestEnd(name, passed, failed)
			__this__.log(__this__.string.onUnitTestEnd(name, passed, failed))
		},
		onTestCaseStart:function(name){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onTestCaseStart(name)
			__this__.log(__this__.string.onTestCaseStart(name))
		},
		onTestCaseEnd:function(name, passed, failed){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onTestCaseEnd(name, passed, failed)
			__this__.log(__this__.string.onTestCaseEnd(name, passed, failed))
			$.ajax({"type":"POST", "url":(("/tests/results/" + __this__.testID) + "/stopped"), "data":{}, "async":false})
		}
	}
})
insulin.HtmlTestUI=Extend.Class({
	// overrides TestUI display messages in a webpage
	name:'insulin.HtmlTestUI', parent:insulin.TestUI,
	methods:{
		info:function(message){
			var __this__=this
			setTimeout(function(){
				$("#log").append(html.div({"class":"info"}, message))
			}, 0)
		},
		warn:function(message){
			var __this__=this
			setTimeout(function(){
				$("#log").append(html.div({"class":"warning"}, message))
			}, 0)
		},
		error:function(message){
			var __this__=this
			setTimeout(function(){
				$("#log").append(html.div({"class":"error"}, message))
			}, 0)
		},
		separator:function(){
			var __this__=this
			setTimeout(function(){
				$("#log").append(html.hr())
			}, 0)
		},
		onTestStart:function(name){
			var __this__=this
			__this__.info(html.h3(("Starting Test: " + name)))
		},
		onTestEnd:function(name, success, reason){
			var __this__=this
			if ( success )
			{
				__this__.info((("PASS [" + reason) + "ms]"))
			}
			else if ( true )
			{
				__this__.error(html.pre(("FAIL: " + reason)))
			}
			__this__.separator()
		},
		onUnitTestStart:function(name){
			var __this__=this
			__this__.info(html.h3(("Unit test: " + name)))
		},
		onUnitTestEnd:function(name, passed, failed){
			var __this__=this
			var message=(((((("Unit test: " + name) + ": ") + passed) + " passed, ") + failed) + " failed");
			if ( failed )
			{
				__this__.error(message)
			}
			else if ( true )
			{
				__this__.info(message)
			}
			__this__.separator()
		},
		onTestCaseStart:function(name){
			var __this__=this
			__this__.info(("Test case: " + name))
		},
		onTestCaseEnd:function(name, passed, failed){
			var __this__=this
			var message=(((((("Test case: " + name) + ": ") + passed) + " passed ") + failed) + " failed");
			if ( failed )
			{
				__this__.error(message)
				$("#TestResult").css({"background":"red", "color":"white"}).html(message)
			}
			else if ( true )
			{
				__this__.info(message)
				$("#TestResult").css({"background":"green", "color":"white"}).html(message)
			}
			__this__.separator()
		}
	}
})
insulin.TestRunner=Extend.Class({
	name:'insulin.TestRunner', parent:undefined,
	properties:{
		testID:undefined,
		testCase:undefined
	},
	initialize:function(testID, testCaseName){
		var __this__=this
		__this__.testID = testID;
		var test_ui=insulin.getTestUI(__this__.testID);
		__this__.testCase = new insulin.TestCase(test_ui, testCaseName);
		__this__.findTests()
		return __this__
	},
	methods:{
		addTest:function(newTest){
			var __this__=this
			__this__.testCase.addTest(newTest)
		},
		findTests:function(){
			var __this__=this
			Extend.iterate(Extend.getChildrenOf(insulin.UnitTest), function(test){
				__this__.testCase.addTest(new test())
			}, __this__)
		},
		runTests:function(){
			var __this__=this
			__this__.testCase.run()
		}
	}
})
insulin.init=	function(){
		var __this__=insulin;
	}
insulin.init()
