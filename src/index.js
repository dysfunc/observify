const Observify = (obj) => {

  // ref for Object.toString for checking class type
  const toString = {}.toString;
  // ref for slice so we only do it once
  const slice = [].slice;

  /**
   * Event handlers cache
   * @type {Object}
   */
  const events = {};

  /**
   * Prop handlers cache
   * @type {Object}
   */
  const props = {};

  /**
   * Metadata cache for namescape and previous values
   * @type {Object}
   */
  const meta = {};

  /**
   * class2type dictonary
   * @type {Object}
   */
  const class2type = ['Array', 'Boolean', 'Date', 'Error', 'Function', 'Object', 'RegExp', 'String'].reduce((obj, type) => {
    obj['[object ' + type + ']'] = type.toLowerCase();
    return obj;
  }, {});

  /**
   * Returns the internal JavaScript [Class]] of an object
   * @param  {Object} obj Object to check the class property of
   * @return {String}     Only the class property of the object
   */
  const typeOf = (obj) => obj === null ? String(obj) : class2type[toString.call(obj)] || 'object';

  /**
   * Performs a deep comparison between two values to determine if they are equivalent.
   * @param  {*} x     The value to compare
   * @param  {*} y     The other value to compare
   * @return {Boolean} Returns true if the values are equivalent, else false.
   */
   const isEqual = function(x, y){
     if(x === null || x === undefined || y === null || y === undefined){
       return x === y;
     }

     if(x.constructor !== y.constructor){
       return false;
     }

     // functions and regexp should strictly equal each other
     if(x instanceof Function || x instanceof RegExp){
       return x === y;
     }

     // strict equality check or matching valueOf
     if(x === y || x.valueOf() === y.valueOf()){
       return true;
     }

     if(Array.isArray(x) && x.length !== y.length){
       return false;
     }

     // if dates, valueOf would've have matched
     if(x instanceof Date){
       return false;
     }

     if(!(x instanceof Object) || !(y instanceof Object)){
       return false;
     }

     // recursive object equality check
     const keys = Object.keys(x);

     return Object.keys(y).every((key) => keys.indexOf(key) !== -1) && keys.every((key) => isEqual(x[key], y[key]));
  };

  /**
   * Determines if the passed object prop is writable
   * @param  {Object} target Parent object containing the key
   * @param  {String} key    String containing unique Object property key
   * @return {Boolean}       Returns true if the object property is writable, else false.
   */
  const isWritable = (target, key) => {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    return !descriptor || descriptor && descriptor.writable;
  };

  /**
   * Returns the value at the passed property path
   * @param  {String} prop Object property path in dot notation
   * @return {*}           The property value
   */
  const lookup = (prop) => {
    const parent = traverse(prop);
    const value = parent[prop.split('.').pop()];

    return value;
  };

  /**
   * Recursively binds/unbinds callbacks to/from the passed object
   * @param  {String}   prop  String containing the object property key
   * @param  {*}        value The value of the object property
   * @param  {Function} fn    Function to bind/unbind on changes
   * @param  {Boolean}  flag  If true, unbind the callback function(s) else binds callback(s)
   */
  const recursive = function(prop, value, fn, flag){
    if(typeOf(value) === 'object'){
      for(const key in value){
        if(typeOf(value[key]) === 'object'){
          recursive(`${prop}.${key}`, value[key], fn, flag);
        }else{
          if(flag){
            unbind(props, `${prop}.${key}`, fn);
          }else{
            bind(props, metadata(`${prop}.${key}`), fn);
          }
        }
      }
    }

    if(flag){
      unbind(props, prop, fn);
    }else{
      bind(props, metadata(prop), fn);
    }
  };

  /**
   * Recursively prevents writes to each object property of the passed object
   * @param  {Object} object Object to iterate over
   * @return {Object}        Returns the object
   */
  const lock = (object) => {
    const keys = Object.keys(object);

    for(let key of keys){
      const value = object[key];

      if(typeOf(value) === 'object'){
        lock(value);
      }else{
        Object.defineProperty(object, key, {
          enumerable: true,
          writable: false,
          value
        });
      }
    }

    return object;
  };

  /**
   * Recursively enables writes to each locked object properties of the passed object
   * @param  {Object} object Object to iterate over
   * @return {Object}        Returns the object
   */
  const unlock = (object) => {
    const keys = Object.keys(object);

    for(let key of keys){
      const writable = isWritable(object, key);
      const value = object[key];

      if(typeOf(value) === 'object'){
        lock(value);
      }else{
        if(!writable){
          delete object[key];
          object[key] = value;
        }
      }
    }

    return object;
  };

  /**
   * Returns the target parent from the path
   * @param  {String} path String containing the event name in dot notation
   * @return {Object}      Returns the matched parent object from the path
   */
  const traverse = (path) => {
    const index = (o, i) => o[i];
    const levels = path.split('.');
    const object = levels.length > 1 ? levels.slice(0, -1).reduce(index, obj) : obj;

    return object;
  };

  /**
   * Helper method to save the event namespace and
   * previous value to our cache for ref in callbacks
   * @param  {String} path String containing the property path in dot notation
   * @return {String}      Returns the unique path (used as the event namespace)
   */
  const metadata = (path) => {
    const prevValue = lookup(path);

    meta[path] = {
      eventName: path,
      prevValue: prevValue instanceof Array ? prevValue.slice() : prevValue
    };

    return path;
  };

  /**
   * Helper method to bind handlers to props or events
   * @param  {Object}   cache    The event handler cache to use
   * @param  {String}   key      String containing the prop or event name
   * @param  {Function} callback The callback function that we'll assign to the key
   * @return {Object}            Returns the object
   */
  const bind = (cache, key, callback) => {
    if(!cache[key]){
      cache[key] = [callback];
    }else{
      cache[key].push(callback);
    }

    return obj;
  };

  /**
   * Helper method to unbind handlers from props or events
   * @param  {Object}   cache    The event handler cache to use
   * @param  {String}   key      String containing the prop or event name
   * @param  {Function} callback The callback function to unbind from the key
   * @return {Object}            Returns the object
   */
  const unbind = (cache, key, callback) => {
    if(cache[key] && callback === undefined){
      delete cache[key];
    }

    if(cache[key]){
      cache[key].forEach((fn, index) => {
        if(fn === callback){
          cache[key].splice(index, 1);
        }
      });

      if(!cache[key].length){
        delete cache[key];
      }
    }

    return obj;
  };

  /**
   * Disables the ability to write to a specific property
   * @param  {String} path String containing the path to object property in dot notation
   * @return {Object}      Returns the object
   */
  obj.lock = (path) => {
    if(!path){
      return lock(obj);
    }

    const property = path.split('.').pop();
    const parent = traverse(path);
    const value = parent[property];

    // make sure the key is not writable
    Object.defineProperty(parent, property, {
      enumerable: true,
      writable: false,
      value
    });

    // recursively update object values
    if(typeof(value) === 'object'){
      lock(value);
    }

    return obj;
  };

  /**
   * Enables writes to a specific property
   * @param  {String} path String containing the dot notation to object prop
   * @return {Object}      Returns the object
   */
  obj.unlock = (path) => {
    if(!path){
      return unlock(obj);
    }

    const property = path.split('.').pop();
    const parent = traverse(path);
    const value = parent[property];
    const writable = isWritable(parent, property);

    if(!writable){
      delete parent[property];

      parent[property] = value;

      // recursively update object values
      if(typeOf(value) === 'object'){
        unlock(value);
      }
    }

    return obj;
  };

  /*
   * Listen for changes on a specific prop
   * @param  {String}   prop String containing the Object key to watch
   * @param  {Function} fn   Callback function to execute on property value change
   * @return {Object}        Returns the object
   */
  obj.listen = (prop, fn) => recursive(prop, lookup(prop), fn);

  /**
   * Stops listening for changes on a specific prop
   * @param  {String}   prop String containing the Object key to unwatch
   * @param  {Function} fn   Callback handler to remove (Optional). If blank, all handlers will be removed
   * @return {Object}        Returns the object
   */
  obj.unlisten = (prop, fn) => recursive(prop, lookup(prop), fn, true);

  /**
   * Bind event handlers to an event namespace
   * @param  {String}   event String containing the event name
   * @param  {Function} fn    Callback handler to execute when an event has been triggered
   * @return {Object}         Returns the object
   */
  obj.on = (event, fn) => bind(events, event, fn);

  /**
   * Unbind event handlers from an event namespace
   * @param  {String}   event String containing the event name
   * @param  {Function} fn    Callback handler to remove. If blank, all handlers will be removed
   * @return {Object}         Returns the object
   */
  obj.off = (event, fn) => unbind(events, event, fn);

  /**
   * Triggers all callbacks bound to an event namespace
   * @param  {String} event String containing the event name
   * @return {Object}       Returns the object
   */
  obj.trigger = function(event){
    const args = slice.call(arguments, 1);

    if(events[event]){
      events[event].forEach((fn) => fn.apply(this, args));
    }

    return this;
  };

  /**
   * Prevent library methods from being writable and enumerable
   * @type {Boolean}
   */
  ['on', 'off', 'listen', 'unlisten', 'trigger', 'lock', 'unlock'].forEach((property) => {
    Object.defineProperty(obj, property, {
      enumerable: false,
      writable: false
    });
  });

  /**
   * Fires all listening handlers that match the passed key/prop name
   * @param  {String} path   String containing path to the object property
   * @param  {Mixed}  value  Current value of the passed property
   * @param  {Object} scope  Scope in which to execute the callback function
   * @return {Boolean}       Always returns true
   */
  const triggerEvents = (path, value, scope) => {
    const event = meta[path];

    if(event){
      const name = event.eventName;

      if(props[name]){
        if(!isEqual(value, event.prevValue)){
          props[name].forEach((fn) => fn.call(scope, value, event.prevValue, path));
        }
      }

      event.prevValue = value instanceof Array ? value.slice() : value
    }

    return true;
  };

  /**
   * Setup our handlers traps so we can manage any
   * getting/setting of object props.
   * @type {Object}
   */
  const handler = {
    get(target, prop){
      const value = target[prop];
      // traps array operation (i.e. .push, .shift, .unshfit, etc...)
      if(typeOf(value) === 'function' && typeOf(target) === 'array'){
        const self = this;
        // allow operation through
        return function(){
          const array = Array.prototype[prop].apply(target, arguments)
          // trigger any listeners
          triggerEvents(self.ref, target, self);

          return array;
        }
      }
      // build out property access path using dot notation (for event bindings)
      // use .toString() to avoid Symbol to string errors. Symbols must be stringified explicitly
      const ref = this.ref ? `${this.ref}.${prop.toString()}` : prop;
      // add our ref to the proxy handler object
      const handlerObj = Object.assign({}, handler, { ref });
      // create a new proxy object for properties that are objects or arrays
      if(typeof value === 'object' && value !== null){
        return new Proxy(value, handlerObj);
      }

      return value;
    },
    set(target, prop, value){
      const writable = isWritable(target, prop);
      const path = this.ref ? `${this.ref}.${prop.toString()}` : prop;

      if(!writable){
        return target[prop];
      }

      target[prop] = value;

      triggerEvents(path, value, this);

      return true;
    }
  }

  return new Proxy(obj, handler);
};

if(typeof exports !== 'object' && typeof define === 'function' && define.amd){
  define([], Observify);
}
else if(typeof exports === 'object'){
  module.exports = Observify;
}
else if(window !== 'undefined'){
  window.Observify = Observify;
}
