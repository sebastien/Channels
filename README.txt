== Channels 0.8
== Developer Manual
-- Author: Sebastien Pierre <sebastien@ivy.fr>
-- Revision: 12-Nov-2007


Extend 2.0 is an evolution of [Extend 1.0](http://www.ivy.fr/extend/extend-1.0.0.js)
which implements a flexible class-based OOP layer on top of the JavaScript
prototype object model.

Extend 2.0 allows you to write nice and clean classes in JavaScript, features
introspection and class meta-information, is mature and
[fully-tested](http://www.ivy.fr/js/extend/test.html), and used as a base for
our wonderful [Sugar language](http://www.ivy.fr/sugar) runtime.

The problem
===========





Channels API
==========

  Extend offers a set of methods that can are available to Extend classes and
  instances created from Extend classes. These methods range from simple
  introspection (what is the class of an object, what is this class name, is
  this an object an instance of this class, etc) to more complex things
  (safely wrapping a method for callback, listing inherited methods, etc).

  Futures API
  -----------

    'Extend.Class({...})'::
       Declares and returns a new class according to the class description
       given as argument. This description was explained in the previous
       section.

    'Extend.getClass(name:String)'::
       Returns the class with the given absolute name, if any.

    'Extend.getClasses()'::
       Returns a dictionary that maps _declared class names_ to actual class
       instances. Extend acts like a global namespace where non-anonymous
       declared classes are registered.

    'Extend.getChildrenOf(aClass)'::
       Returns a dictionary that maps _declared class names_ to actual class
       instances of classes that inherit from the given class ('aClass'). This
       excludes the given class from the result.

  Channels API
  ------------

  The _object API_ defines the methods which are available to instances
  (objects) which were created (instantiated) from a class defined using Extend.

    'isClass()'::
      Tells if the given object is class or not. This returns 'false'

    'getClass()'::
      Returns the class object associated with this instance. You can use the
      class object to access class operations, class attributes, etc.

    'getMethod(name:String)'::
      In JavaScript, if you give a method as a callback by simply doing
      'object.method', then you may have problems when the caller changes the
      'this' argument of the method. Using 'getMethod' will ensure that the this
      is preserved. It's actually the equivalent of doing
      'this.getClass().bindMethod(this, name)'.

    'getCallback(name:String)'::
      The 'getCallback' method is similar to 'getMethod', except that it will
      add an extra argument which is the 'this' used when invoking the method.
      Libraries such as [jQuery](<http://www.jquery.com>) change the 'this' of
      callbacks given to events such as 'click' or 'focus' to the DOM node that
      received the event rather than the instance to which  the method is bound.
      Using 'getMethod' insulates you from this change, but you also lose the
      reference to the DOM node that received the event (the event target). When
      using 'getCallback', you'll have the target as an additional argument.

    'getSuper(c:Class)'::
      Returns a proxy that will use the current object as state, but where every
      operation defined in the proxy will use the implementation defined in the
      given class.

    'isInstance(c:Class)'::
      Returns 'true' if this instance is an instance of the given class, which
      must be either the class of this instance, or an ancestor of this instance
      class.

Examples
========

  Step 1: Create a new class

  >   var Shape = Extend.Class(
  >     name:"Shape",
  >     initialize:function(){
  >       this.points = [];
  >     }
  >     methods:{
  >       addPoint:function(p){
  >         this.points.push(p);
  >       }
  >       getPoints:function(){
  >         return this.points;
  >       }
  >     }
  >   });

  Step 2: Create an instance of your class, and do stuff

  >   my_shape = new Shape();
  >   my_shape.addPoint([0,0]);
  >   my_shape.addPoint([1,0]);
  >   console.log(my_shape.getPoints().toSource());

  Step 3: Create a subclass

  >   var Rectangle = Extend.Class(
  >     name:"Rectangle",
  >     parent:"Shape",
  >     initialize:function(){
  >       this.points = [];
  >     }
  >     methods:{
  >       addPoint:function(p){
  >         this.points.push(p);
  >       }
  >       getPoints:function(){
  >         return this.points;
  >       }
  >     }
  >   });

  Using callbacks with jQuery

  >   var MyWidget = Extend.Class({
  >     name:"MyWidget",
  >     methods:{
  >       onClick:function(target){
  >         $(target).css({background:yello});
  >       }
  >   })
  >   
  >   var w = new MyWidget()
  >   $("#my-widget").click( w.getCallback("onClick") )

# --
 
 [0]: JavaScript Gotchas, Sébastien Pierre, June 2007
      [tech note](http://www.ivy.fr/notes/javascript-gotchas.html)

 [1]: Object-Oriented Programmming in JavaScript, Mike Moss, January 2006
      [article](http://mckoss.com/jscript/object.htm)

 [2]: Prototype-based Programming Wikipedia Article,
      [wikipedia](http://en.wikipedia.org/wiki/Prototype-based_programming)

 [3]: Java Reflection API
      [tutorial](http://java.sun.com/docs/books/tutorial/reflect/index.html)

 [4]: Extend Class, Prototype library extension to add subclassing
      [wiki page](http://wiki.script.aculo.us/scriptaculous/show/ExtendClass)

 [5]: Extend Class Further, adding Ruby-like OO features to Prototype
      [wiki page](http://wiki.script.aculo.us/scriptaculous/show/ExtendClassFurther)

# EOF vim: syn=kiwi ts=2 sw=2 et
