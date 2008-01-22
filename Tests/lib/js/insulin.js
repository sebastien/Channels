// 8< ---[insulin.js]---
function _meta_(v,m){var ms=v['__meta__']||{};for(var k in m){ms[k]=m[k]};v['__meta__']=ms;return v}
var insulin={}
var __this__=insulin
insulin._VERSION_='0.8.0';
insulin.ui=undefined
insulin.TestCase=Extend.Class({
	// The tests in the case
	name:'insulin.TestCase', parent:undefined,
	properties:{
		tests:new Array(),
		name:undefined
	},
	initialize:_meta_(function(ui, _name){
		var __this__=this
		__this__.tests = new Array()
		insulin.ui = ui;
		__this__.name = _name;
	},	{
			arity:2,
			arguments:[{'name': 'ui'}, {'name': '_name'}]
		}),
	methods:{
		addTest:_meta_(function(test){
			var __this__=this
			__this__.tests.push(test)
		},	{
				arity:1,
				arguments:[{'name': 'test'}]
			}),
		run:_meta_(function(){
			var __this__=this
			var passed=0;
			var failed=0;
			Extend.iterate(__this__.tests, _meta_(function(test){
				if ( test.run() )
				{
					passed = (passed + 1);
				}
				else if ( true )
				{
					failed = (failed + 1);
				}
			},	{
					arity:1,
					arguments:[{'name': 'test'}]
				}), __this__)
			insulin.ui.onTestCaseEnd(__this__.name, passed, failed)
		},	{
				arity:0,
				arguments:[]
			})
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
	initialize:_meta_(function(_name){
		var __this__=this
		__this__.passed = 0
		__this__.failed = 0
		__this__.name = _name;
		if ( (__this__.name === undefined) )
		{
			__this__.name = __this__.getClass().getName();
		}
		__this__.JSUNIT_UNDEFINED_VALUE = __this__.JSUNIT_UNDEFINED_VALUE;
		__this__.assertArrayEquals = __this__.assertObjectEquals;
	},	{
			arity:1,
			arguments:[{'name': '_name'}]
		}),
	methods:{
		// General setup function that is executed before running all the tests in this unit test
		setup:_meta_(function(){
			var __this__=this
		},	{
				arity:0,
				arguments:[]
			}),
		// General cleanup function that is executed after running all the tests in this unit test
		cleanup:_meta_(function(){
			var __this__=this
		},	{
				arity:0,
				arguments:[]
			}),
		// General setup function that is executed before running each of the tests in this unit test
		setupAll:_meta_(function(){
			var __this__=this
		},	{
				arity:0,
				arguments:[]
			}),
		// General cleanup function that is executed after running each of the tests in this unit test
		cleanupAll:_meta_(function(){
			var __this__=this
		},	{
				arity:0,
				arguments:[]
			}),
		// By default this method introspects the class methods and find out about the ones who are prefixed by "test"
		// It will return the name of all test functions
		getTests:_meta_(function(){
			var __this__=this
			var unit_tests=new Array();
			Extend.iterate(__this__.getClass().listMethods(), _meta_(function(method, name){
				var name_regex=new RegExp("^test.*");
				if ( name_regex.test(name) )
				{
					var test_name=name.replace("test", "");
					var unit_test={};
					unit_test.name = test_name;
					unit_tests.push(unit_test)
				}
			},	{
					arity:2,
					arguments:[{'name': 'method'}, {'name': 'name'}]
				}), __this__)
			return unit_tests
		},	{
				arity:0,
				arguments:[]
			}),
		// runs all the tests in the unit test
		run:_meta_(function(){
			var __this__=this
			var unit_tests=__this__.getTests();
			__this__.passed = 0;
			__this__.failed = 0;
			insulin.ui.onUnitTestStart(__this__.name)
			try {
				__this__.setup()
				Extend.iterate(Extend.range(0,(unit_tests.length)), _meta_(function(index){
					var test=unit_tests[index];
					__this__.runMethod(test.name)
				},	{
						arity:1,
						arguments:[{'name': 'index'}]
					}), __this__)
				__this__.cleanup()
			}
			catch(e){
				var reason=__this__.handleException(e);
				insulin.ui.error(("FAIL: " + reason))
				__this__.failed = (__this__.failed + 1);
			}
			insulin.ui.onUnitTestEnd(__this__.name, __this__.passed, __this__.failed)
			return (__this__.failed == 0)
		},	{
				arity:0,
				arguments:[]
			}),
		// Runs the test unit, checking for contextual setup and cleanup
		// This method is responsible for catching any exceptions that could be thrown by a test
		runMethod:_meta_(function(name){
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
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		// if there is a method prefixed with "setup", it will be called before running the associated test
		getTestSetup:_meta_(function(name){
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
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		// if there is a method prefixed with "cleanup", it will be called after running the associated test
		getTestCleanup:_meta_(function(name){
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
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		handleException:_meta_(function(e){
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
				Extend.iterate(e.stackTrace.split("\n"), _meta_(function(frame){
					if ( frame )
					{
						reason = (reason + ((insulin.ui.indentation + frame) + "\n"));
					}
				},	{
						arity:1,
						arguments:[{'name': 'frame'}]
					}), __this__)
			}
			return reason
		},	{
				arity:1,
				arguments:[{'name': 'e'}]
			}),
		// A more functional typeof
		// @param Object o
		// @return String
		_trueTypeOf:_meta_(function(something){
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
			
		},	{
				arity:1,
				arguments:[{'name': 'something'}]
			}),
		_displayStringForValue:_meta_(function(aVar){
			var __this__=this
			var result = '<' + aVar + '>';
			if (!(aVar === null || aVar === __this__.@method)) {
			    result += ' (' + __this__._trueTypeOf(aVar) + ')';
			}
			return result;
			
		},	{
				arity:1,
				arguments:[{'name': 'aVar'}]
			}),
		fail:_meta_(function(failureMessage){
			var __this__=this
			throw new insulin.JsUnitException("Call to fail()", failureMessage)
		},	{
				arity:1,
				arguments:[{'name': 'failureMessage'}]
			}),
		error:_meta_(function(errorMessage){
			var __this__=this
			throw new insulin.JsUnitException("Call to error()", errorMessage)
		},	{
				arity:1,
				arguments:[{'name': 'errorMessage'}]
			}),
		argumentsIncludeComments:_meta_(function(expectedNumberOfNonCommentArgs, args){
			var __this__=this
			return args.length == expectedNumberOfNonCommentArgs + 1;
			
		},	{
				arity:2,
				arguments:[{'name': 'expectedNumberOfNonCommentArgs'}, {'name': 'args'}]
			}),
		commentArg:_meta_(function(expectedNumberOfNonCommentArgs, args){
			var __this__=this
			if (__this__.argumentsIncludeComments(expectedNumberOfNonCommentArgs, args))
			    return args[0];
			
			return null;
			
		},	{
				arity:2,
				arguments:[{'name': 'expectedNumberOfNonCommentArgs'}, {'name': 'args'}]
			}),
		nonCommentArg:_meta_(function(desiredNonCommentArgIndex, expectedNumberOfNonCommentArgs, args){
			var __this__=this
			return __this__.argumentsIncludeComments(expectedNumberOfNonCommentArgs, args) ?
			       args[desiredNonCommentArgIndex] :
			       args[desiredNonCommentArgIndex - 1];
			
		},	{
				arity:3,
				arguments:[{'name': 'desiredNonCommentArgIndex'}, {'name': 'expectedNumberOfNonCommentArgs'}, {'name': 'args'}]
			}),
		_validateArguments:_meta_(function(expectedNumberOfNonCommentArgs, args){
			var __this__=this
			if (!( args.length == expectedNumberOfNonCommentArgs ||
			       (args.length == expectedNumberOfNonCommentArgs + 1 && typeof(args[0]) == 'string') ))
			    error('Incorrect arguments passed to assert function');
			
		},	{
				arity:2,
				arguments:[{'name': 'expectedNumberOfNonCommentArgs'}, {'name': 'args'}]
			}),
		_assert:_meta_(function(comment, booleanValue, failureMessage){
			var __this__=this
			if ( (! booleanValue) )
			{
				throw new insulin.JsUnitException(comment, failureMessage)
			}
		},	{
				arity:3,
				arguments:[{'name': 'comment'}, {'name': 'booleanValue'}, {'name': 'failureMessage'}]
			}),
		assert:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var booleanValue = __this__.nonCommentArg(1, 1, arguments);
			
			if (typeof(booleanValue) != 'boolean')
			    error('Bad argument to assert(boolean)');
			
			__this__._assert(__this__.commentArg(1, arguments), booleanValue === true, 'Call to assert(boolean) with false');
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertTrue:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var booleanValue = __this__.nonCommentArg(1, 1, arguments);
			
			if (typeof(booleanValue) != 'boolean')
			    error('Bad argument to assertTrue(boolean)');
			
			__this__._assert(__this__.commentArg(1, arguments), booleanValue === true, 'Call to assertTrue(boolean) with false');
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertFalse:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var booleanValue = __this__.nonCommentArg(1, 1, arguments);
			
			if (typeof(booleanValue) != 'boolean')
			    error('Bad argument to assertFalse(boolean)');
			
			__this__._assert(__this__.commentArg(1, arguments), booleanValue === false, 'Call to assertFalse(boolean) with true');
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertEquals:_meta_(function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			__this__._assert(__this__.commentArg(2, arguments), var1 === var2, 'Expected ' + __this__._displayStringForValue(var1) + ' but was ' + __this__._displayStringForValue(var2));
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertNotEquals:_meta_(function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			__this__._assert(__this__.commentArg(2, arguments), var1 !== var2, 'Expected not to be ' + __this__._displayStringForValue(var2));
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertNull:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), aVar === null, 'Expected ' + __this__._displayStringForValue(null) + ' but was ' + __this__._displayStringForValue(aVar));
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertNotNull:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), aVar !== null, 'Expected not to be ' + __this__._displayStringForValue(null));
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertUndefined:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), aVar === __this__.@method, 'Expected ' + __this__._displayStringForValue(__this__.@method) + ' but was ' + __this__._displayStringForValue(aVar));
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertNotUndefined:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), aVar !== __this__.@method, 'Expected not to be ' + __this__._displayStringForValue(__this__.@method));
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertNaN:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), isNaN(aVar), 'Expected NaN');
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertNotNaN:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var aVar = __this__.nonCommentArg(1, 1, arguments);
			__this__._assert(__this__.commentArg(1, arguments), !isNaN(aVar), 'Expected not NaN');
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertObjectEquals:_meta_(function(){
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
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertEvaluatesToTrue:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var value = __this__.nonCommentArg(1, 1, arguments);
			if (!value)
			    fail(__this__.commentArg(1, arguments));
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertEvaluatesToFalse:_meta_(function(){
			var __this__=this
			__this__._validateArguments(1, arguments);
			var value = __this__.nonCommentArg(1, 1, arguments);
			if (value)
			    fail(__this__.commentArg(1, arguments));
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertHTMLEquals:_meta_(function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			var var1Standardized = standardizeHTML(var1);
			var var2Standardized = standardizeHTML(var2);
			
			__this__._assert(__this__.commentArg(2, arguments), var1Standardized === var2Standardized, 'Expected ' + __this__._displayStringForValue(var1Standardized) + ' but was ' + __this__._displayStringForValue(var2Standardized));
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertHashEquals:_meta_(function(){
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
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertRoughlyEquals:_meta_(function(){
			var __this__=this
			__this__._validateArguments(3, arguments);
			var expected = __this__.nonCommentArg(1, 3, arguments);
			var actual = __this__.nonCommentArg(2, 3, arguments);
			var tolerance = __this__.nonCommentArg(3, 3, arguments);
			assertTrue(
			        "Expected " + expected + ", but got " + actual + " which was more than " + tolerance + " away",
			        Math.abs(expected - actual) < tolerance
			        );
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertContains:_meta_(function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var contained = __this__.nonCommentArg(1, 2, arguments);
			var container = __this__.nonCommentArg(2, 2, arguments);
			assertTrue(
			        "Expected '" + container + "' to contain '" + contained + "'",
			        container.indexOf(contained) != -1
			        );
			
		},	{
				arity:0,
				arguments:[]
			}),
		standardizeHTML:_meta_(function(html){
			var __this__=this
			var translator = document.createElement("DIV");
			translator.innerHTML = html;
			return translator.innerHTML;
			
		},	{
				arity:1,
				arguments:[{'name': 'html'}]
			}),
		assertTypeOf:_meta_(function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			var type = __this__._trueTypeOf(var2)
			__this__._assert(__this__.commentArg(2, arguments), var1 === type, 'Expected type of (' + var1 + ') but was type of (' + type + ')');
			
		},	{
				arity:0,
				arguments:[]
			}),
		assertInstanceOf:_meta_(function(){
			var __this__=this
			__this__._validateArguments(2, arguments);
			var var1 = __this__.nonCommentArg(1, 2, arguments);
			var var2 = __this__.nonCommentArg(2, 2, arguments);
			var type = __this__._trueTypeOf(var2);
			if (type == "object" || type == "Object")
			    type = var2.getClass().getName();
			__this__._assert(__this__.commentArg(2, arguments), var1 === type, 'Expected instance of (' + var1 + ') but was instance of (' + type + ')');
			
		},	{
				arity:0,
				arguments:[]
			})
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
	initialize:_meta_(function(_comment, message){
		var __this__=this
		__this__.isJsUnitException = true;
		__this__.comment = _comment;
		__this__.jsUnitMessage = message;
		__this__.stackTrace = __this__.getStackTrace();
	},	{
			arity:2,
			arguments:[{'name': '_comment'}, {'name': 'message'}]
		}),
	methods:{
		getStackTrace:_meta_(function(){
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
			
		},	{
				arity:0,
				arguments:[]
			}),
		getFunctionName:_meta_(function(aFunction){
			var __this__=this
			var regexpResult = aFunction.toString().match(/function(\s*)(\w*)/);
			if (regexpResult && regexpResult.length >= 2 && regexpResult[2]) {
			    return regexpResult[2];
			}
			return 'anonymous';
			
		},	{
				arity:1,
				arguments:[{'name': 'aFunction'}]
			})
	}
})
insulin.StringUI=Extend.Class({
	name:'insulin.StringUI', parent:undefined,
	properties:{
		indent:"",
		indentation:"  "
	},
	methods:{
		format:_meta_(function(prefix, indent, message){
			var __this__=this
			iprefix = "";
			Extend.iterate(Extend.range(0,(prefix.length)), _meta_(function(){
				iprefix = (iprefix + " ");
			},	{
					arity:0,
					arguments:[]
				}), __this__)
			result = "";
			first = true;
			Extend.iterate(message.split("\n"), _meta_(function(line){
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
			},	{
					arity:1,
					arguments:[{'name': 'line'}]
				}), __this__)
			return result
		},	{
				arity:3,
				arguments:[{'name': 'prefix'}, {'name': 'indent'}, {'name': 'message'}]
			}),
		// prints a message
		display:_meta_(function(message){
			var __this__=this
			return __this__.format("", __this__.indent, message)
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		// prints an informational message
		// You should use this for messages that shouldn't be ignored.
		info:_meta_(function(message){
			var __this__=this
			return __this__.format("I: ", __this__.indent, message)
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		// prints a warning message
		// Use this for when a test must be skipped, but where this doesn't
		// count as a failure.
		warn:_meta_(function(message){
			var __this__=this
			return __this__.format("W: ", __this__.indent, message)
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		// prints an error message
		// Use this for fatal errors.
		error:_meta_(function(message){
			var __this__=this
			return __this__.format("E: ", __this__.indent, message)
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		onTestStart:_meta_(function(name){
			var __this__=this
			var result=__this__.info(("Test: " + name));
			__this__.indent = (__this__.indent + __this__.indentation);
			return result
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestEnd:_meta_(function(name, success, reason){
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
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'success'}, {'name': 'reason'}]
			}),
		onUnitTestStart:_meta_(function(name){
			var __this__=this
			var result=__this__.info(("Unit test: " + name));
			__this__.indent = (__this__.indent + __this__.indentation);
			return result
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onUnitTestEnd:_meta_(function(name, passed, failed){
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
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			}),
		onTestCaseStart:_meta_(function(name){
			var __this__=this
			var result=__this__.info(("Test case: " + name));
			__this__.indent = (__this__.indent + __this__.indentation);
			return result
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestCaseEnd:_meta_(function(name, passed, failed){
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
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			})
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
	initialize:_meta_(function(){
		var __this__=this
		__this__.string = new insulin.StringUI();
	},	{
			arity:0,
			arguments:[]
		}),
	methods:{
		// prints a message
		display:_meta_(function(message){
			var __this__=this
			Extend.print(__this__.string.display(message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		// prints an informational message
		// You should use this for messages that shouldn't be ignored.
		info:_meta_(function(message){
			var __this__=this
			Extend.print(__this__.string.info(message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		// prints a warning message
		// Use this for when a test must be skipped, but where this doesn't
		// count as a failure.
		warn:_meta_(function(message){
			var __this__=this
			Extend.print(__this__.string.warn(message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		// prints an error message
		// Use this for fatal errors.
		error:_meta_(function(message){
			var __this__=this
			Extend.print(__this__.string.error(message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		onTestStart:_meta_(function(name){
			var __this__=this
			Extend.print(__this__.string.onTestStart(name))
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestEnd:_meta_(function(name, success, reason){
			var __this__=this
			Extend.print(__this__.string.onTestEnd(name, success, reason))
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'success'}, {'name': 'reason'}]
			}),
		onUnitTestStart:_meta_(function(name){
			var __this__=this
			Extend.print(__this__.string.onUnitTestStart(name))
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onUnitTestEnd:_meta_(function(name, passed, failed){
			var __this__=this
			Extend.print(__this__.string.onUnitTestEnd(name, passed, failed))
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			}),
		onTestCaseStart:_meta_(function(name){
			var __this__=this
			Extend.print(__this__.string.onTestCaseStart(name))
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestCaseEnd:_meta_(function(name, passed, failed){
			var __this__=this
			Extend.print(__this__.string.onTestCaseEnd(name, passed, failed))
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			})
	}
})
insulin.getTestUI=	_meta_(function(testID){
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
	},	{
			arity:1,
			arguments:[{'name': 'testID'}]
		})
insulin.FirebugTestUI=Extend.Class({
	// overrides TestUI to send messages to the Firebug console
	// Use this UI when Firebug is installed.
	name:'insulin.FirebugTestUI', parent:insulin.TestUI,
	methods:{
		info:_meta_(function(message){
			var __this__=this
			console.info(message)
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		warn:_meta_(function(message){
			var __this__=this
			console.warn(message)
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		error:_meta_(function(message){
			var __this__=this
			console.error(message)
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		onTestStart:_meta_(function(name){
			var __this__=this
			console.group(("Test: " + name))
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestEnd:_meta_(function(name, success, reason){
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
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'success'}, {'name': 'reason'}]
			}),
		onUnitTestStart:_meta_(function(name){
			var __this__=this
			console.group(("Unit test: " + name))
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onUnitTestEnd:_meta_(function(name, passed, failed){
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
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			}),
		onTestCaseStart:_meta_(function(name){
			var __this__=this
			console.group(("Test case: " + name))
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestCaseEnd:_meta_(function(name, passed, failed){
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
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			})
	}
})
insulin.LoggedFirebugTestUI=Extend.Class({
	name:'insulin.LoggedFirebugTestUI', parent:insulin.FirebugTestUI,
	properties:{
		testID:undefined
	},
	initialize:_meta_(function(testID){
		var __this__=this
		__this__.testID = testID;
		__this__.string = new insulin.StringUI();
	},	{
			arity:1,
			arguments:[{'name': 'testID'}]
		}),
	methods:{
		log:_meta_(function(message){
			var __this__=this
			var output={};
			output.output = (message + "\n");
			$.ajax({"type":"POST", "url":(("/tests/results/" + __this__.testID) + "/log"), "data":output, "async":false})
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		info:_meta_(function(message){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).info(message)
			__this__.log(__this__.string.info(message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		warn:_meta_(function(message){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).warn(message)
			__this__.log(__this__.string.warn(message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		error:_meta_(function(message){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).error(message)
			__this__.log(__this__.string.error(message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		onTestStart:_meta_(function(name){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onTestStart(name)
			__this__.log(__this__.string.onTestStart(name))
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestEnd:_meta_(function(name, success, reason){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onTestEnd(name, success, reason)
			__this__.log(__this__.string.onTestEnd(name, success, reason))
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'success'}, {'name': 'reason'}]
			}),
		onUnitTestStart:_meta_(function(name){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onUnitTestStart(name)
			__this__.log(__this__.string.onUnitTestStart(name))
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onUnitTestEnd:_meta_(function(name, passed, failed){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onUnitTestEnd(name, passed, failed)
			__this__.log(__this__.string.onUnitTestEnd(name, passed, failed))
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			}),
		onTestCaseStart:_meta_(function(name){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onTestCaseStart(name)
			__this__.log(__this__.string.onTestCaseStart(name))
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestCaseEnd:_meta_(function(name, passed, failed){
			var __this__=this
			__this__.getSuper(insulin.LoggedFirebugTestUI.getParent()).onTestCaseEnd(name, passed, failed)
			__this__.log(__this__.string.onTestCaseEnd(name, passed, failed))
			$.ajax({"type":"POST", "url":(("/tests/results/" + __this__.testID) + "/stopped"), "data":{}, "async":false})
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			})
	}
})
insulin.HtmlTestUI=Extend.Class({
	// overrides TestUI display messages in a webpage
	name:'insulin.HtmlTestUI', parent:insulin.TestUI,
	properties:{
		selector:undefined,
		currentTestCase:0,
		currentTestUnit:0,
		currentTest:0
	},
	initialize:_meta_(function(selector){
		var __this__=this
		selector = selector === undefined ? ".TestResults" : selector
		__this__.currentTestCase = 0
		__this__.currentTestUnit = 0
		__this__.currentTest = 0
		__this__.getSuper(insulin.HtmlTestUI.getParent())()
		__this__.selector = selector;
	},	{
			arity:1,
			arguments:[{'flags': '=', 'name': 'selector'}]
		}),
	methods:{
		_append:_meta_(function(node){
			var __this__=this
			$(__this__.selector).append(node)
		},	{
				arity:1,
				arguments:[{'name': 'node'}]
			}),
		info:_meta_(function(message){
			var __this__=this
			__this__._append(html.div({"class":"insulin-info"}, message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		warn:_meta_(function(message){
			var __this__=this
			__this__._append(html.div({"class":"insulin-warning"}, message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		error:_meta_(function(message){
			var __this__=this
			__this__._append(html.div({"class":"insulin-error"}, message))
		},	{
				arity:1,
				arguments:[{'name': 'message'}]
			}),
		separator:_meta_(function(){
			var __this__=this
		},	{
				arity:0,
				arguments:[]
			}),
		onTestStart:_meta_(function(name){
			var __this__=this
			var test_id=__this__.currentTest;
			var test_name=name;
			var test_row=html.tr({"id":("test_" + test_id), "class":"test test-running"}, html.td({"class":"test-id"}, ("#" + test_id)), html.td({"class":"test-name"}, ("" + test_name), html.div(html.ul({"class":"assertions empty"}))), html.td({"class":"test-time"}, "running..."));
			__this__._append(test_row)
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestEnd:_meta_(function(name, success, reason){
			var __this__=this
			var test_row=$(("#test_" + __this__.currentTest));
			$(test_row).removeClass("test-running")
			if ( success )
			{
				$(test_row).addClass("test-succeeded")
				$(".test-time", test_row).html("ms")
			}
			else if ( true )
			{
				$(test_row).addClass("test-failed")
				$(".test-time", test_row).html(reason)
			}
			__this__._append(test_row)
			__this__.currentTest = (__this__.currentTest + 1);
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'success'}, {'name': 'reason'}]
			}),
		onUnitTestStart:_meta_(function(name){
			var __this__=this
			var test_row=html.tr(html.td({"class":"test-unit", "colspan":3}, name));
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onUnitTestEnd:_meta_(function(name, passed, failed){
			var __this__=this
			var message=(((((("Unit test: " + name) + ": ") + passed) + " passed ") + failed) + " failed");
			var test_row=html.tr(html.td({"class":"test-unit-summary", "colspan":3}, message));
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			}),
		onTestCaseStart:_meta_(function(name){
			var __this__=this
			var test_row=html.tr(html.td({"class":"test-case", "colspan":3}, name));
		},	{
				arity:1,
				arguments:[{'name': 'name'}]
			}),
		onTestCaseEnd:_meta_(function(name, passed, failed){
			var __this__=this
			var message=(((((("Test case: " + name) + ": ") + passed) + " passed ") + failed) + " failed");
			var test_row=html.tr(html.td({"class":"test-case-summary", "colspan":3}, message));
		},	{
				arity:3,
				arguments:[{'name': 'name'}, {'name': 'passed'}, {'name': 'failed'}]
			})
	}
})
insulin.TestRunner=Extend.Class({
	name:'insulin.TestRunner', parent:undefined,
	properties:{
		testID:undefined,
		testCase:undefined
	},
	initialize:_meta_(function(testID, testCaseName){
		var __this__=this
		__this__.testID = testID;
		var test_ui=insulin.getTestUI(__this__.testID);
		__this__.testCase = new insulin.TestCase(test_ui, testCaseName);
		__this__.findTests()
		return __this__
	},	{
			arity:2,
			arguments:[{'name': 'testID'}, {'name': 'testCaseName'}]
		}),
	methods:{
		addTest:_meta_(function(newTest){
			var __this__=this
			__this__.testCase.addTest(newTest)
		},	{
				arity:1,
				arguments:[{'name': 'newTest'}]
			}),
		findTests:_meta_(function(){
			var __this__=this
			Extend.iterate(Extend.getChildrenOf(insulin.UnitTest), _meta_(function(test){
				__this__.testCase.addTest(new test())
			},	{
					arity:1,
					arguments:[{'name': 'test'}]
				}), __this__)
		},	{
				arity:0,
				arguments:[]
			}),
		runTests:_meta_(function(){
			var __this__=this
			__this__.testCase.run()
		},	{
				arity:0,
				arguments:[]
			})
	}
})
insulin.init=	_meta_(function(){
		var __this__=insulin;
	},	{
			arity:0,
			arguments:[]
		})
insulin.init()
