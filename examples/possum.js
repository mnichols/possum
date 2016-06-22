require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */

/*global window, navigator, document, require, process, module */
(function (app) {
  'use strict';
  var namespace = 'cuid',
    c = 0,
    blockSize = 4,
    base = 36,
    discreteValues = Math.pow(base, blockSize),

    pad = function pad(num, size) {
      var s = "000000000" + num;
      return s.substr(s.length-size);
    },

    randomBlock = function randomBlock() {
      return pad((Math.random() *
            discreteValues << 0)
            .toString(base), blockSize);
    },

    safeCounter = function () {
      c = (c < discreteValues) ? c : 0;
      c++; // this is not subliminal
      return c - 1;
    },

    api = function cuid() {
      // Starting with a lowercase letter makes
      // it HTML element ID friendly.
      var letter = 'c', // hard-coded allows for sequential access

        // timestamp
        // warning: this exposes the exact date and time
        // that the uid was created.
        timestamp = (new Date().getTime()).toString(base),

        // Prevent same-machine collisions.
        counter,

        // A few chars to generate distinct ids for different
        // clients (so different computers are far less
        // likely to generate the same id)
        fingerprint = api.fingerprint(),

        // Grab some more chars from Math.random()
        random = randomBlock() + randomBlock();

        counter = pad(safeCounter().toString(base), blockSize);

      return  (letter + timestamp + counter + fingerprint + random);
    };

  api.slug = function slug() {
    var date = new Date().getTime().toString(36),
      counter,
      print = api.fingerprint().slice(0,1) +
        api.fingerprint().slice(-1),
      random = randomBlock().slice(-2);

      counter = safeCounter().toString(36).slice(-4);

    return date.slice(-2) +
      counter + print + random;
  };

  api.globalCount = function globalCount() {
    // We want to cache the results of this
    var cache = (function calc() {
        var i,
          count = 0;

        for (i in window) {
          count++;
        }

        return count;
      }());

    api.globalCount = function () { return cache; };
    return cache;
  };

  api.fingerprint = function browserPrint() {
    return pad((navigator.mimeTypes.length +
      navigator.userAgent.length).toString(36) +
      api.globalCount().toString(36), 4);
  };

  // don't change anything from here down.
  if (app.register) {
    app.register(namespace, api);
  } else if (typeof module !== 'undefined') {
    module.exports = api;
  } else {
    app[namespace] = api;
  }

}(this.applitude || this));

},{}],2:[function(require,module,exports){
var arrayEach = require('../internal/arrayEach'),
    baseEach = require('../internal/baseEach'),
    createForEach = require('../internal/createForEach');

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection). Iteratee functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length" property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEach(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
 *   console.log(n, key);
 * });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
var forEach = createForEach(arrayEach, baseEach);

module.exports = forEach;

},{"../internal/arrayEach":4,"../internal/baseEach":8,"../internal/createForEach":16}],3:[function(require,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function arrayCopy(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = arrayCopy;

},{}],4:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],5:[function(require,module,exports){
var baseCopy = require('./baseCopy'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.assign` without support for argument juggling,
 * multiple sources, and `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return source == null
    ? object
    : baseCopy(source, keys(source), object);
}

module.exports = baseAssign;

},{"../object/keys":39,"./baseCopy":7}],6:[function(require,module,exports){
var arrayCopy = require('./arrayCopy'),
    arrayEach = require('./arrayEach'),
    baseAssign = require('./baseAssign'),
    baseForOwn = require('./baseForOwn'),
    initCloneArray = require('./initCloneArray'),
    initCloneByTag = require('./initCloneByTag'),
    initCloneObject = require('./initCloneObject'),
    isArray = require('../lang/isArray'),
    isObject = require('../lang/isObject');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
cloneableTags[dateTag] = cloneableTags[float32Tag] =
cloneableTags[float64Tag] = cloneableTags[int8Tag] =
cloneableTags[int16Tag] = cloneableTags[int32Tag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[stringTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[mapTag] = cloneableTags[setTag] =
cloneableTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * The base implementation of `_.clone` without support for argument juggling
 * and `this` binding `customizer` functions.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The object `value` belongs to.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates clones with source counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return arrayCopy(value, result);
    }
  } else {
    var tag = objToString.call(value),
        isFunc = tag == funcTag;

    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return baseAssign(result, value);
      }
    } else {
      return cloneableTags[tag]
        ? initCloneByTag(value, tag, isDeep)
        : (object ? value : {});
    }
  }
  // Check for circular references and return its corresponding clone.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == value) {
      return stackB[length];
    }
  }
  // Add the source value to the stack of traversed objects and associate it with its clone.
  stackA.push(value);
  stackB.push(result);

  // Recursively populate clone (susceptible to call stack limits).
  (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
    result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
  });
  return result;
}

module.exports = baseClone;

},{"../lang/isArray":32,"../lang/isObject":35,"./arrayCopy":3,"./arrayEach":4,"./baseAssign":5,"./baseForOwn":10,"./initCloneArray":21,"./initCloneByTag":22,"./initCloneObject":23}],7:[function(require,module,exports){
/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @returns {Object} Returns `object`.
 */
function baseCopy(source, props, object) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],8:[function(require,module,exports){
var baseForOwn = require('./baseForOwn'),
    createBaseEach = require('./createBaseEach');

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./baseForOwn":10,"./createBaseEach":14}],9:[function(require,module,exports){
var createBaseFor = require('./createBaseFor');

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./createBaseFor":15}],10:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"../object/keys":39,"./baseFor":9}],11:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],12:[function(require,module,exports){
var identity = require('../utility/identity');

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"../utility/identity":41}],13:[function(require,module,exports){
(function (global){
/** Native method references. */
var ArrayBuffer = global.ArrayBuffer,
    Uint8Array = global.Uint8Array;

/**
 * Creates a clone of the given array buffer.
 *
 * @private
 * @param {ArrayBuffer} buffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function bufferClone(buffer) {
  var result = new ArrayBuffer(buffer.byteLength),
      view = new Uint8Array(result);

  view.set(new Uint8Array(buffer));
  return result;
}

module.exports = bufferClone;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],14:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength'),
    toObject = require('./toObject');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./getLength":19,"./isLength":26,"./toObject":29}],15:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"./toObject":29}],16:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isArray = require('../lang/isArray');

/**
 * Creates a function for `_.forEach` or `_.forEachRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createForEach(arrayFunc, eachFunc) {
  return function(collection, iteratee, thisArg) {
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee)
      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
  };
}

module.exports = createForEach;

},{"../lang/isArray":32,"./bindCallback":12}],17:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    keysIn = require('../object/keysIn');

/**
 * Creates a function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {Function} objectFunc The function to iterate over an object.
 * @returns {Function} Returns the new each function.
 */
function createForIn(objectFunc) {
  return function(object, iteratee, thisArg) {
    if (typeof iteratee != 'function' || thisArg !== undefined) {
      iteratee = bindCallback(iteratee, thisArg, 3);
    }
    return objectFunc(object, iteratee, keysIn);
  };
}

module.exports = createForIn;

},{"../object/keysIn":40,"./bindCallback":12}],18:[function(require,module,exports){
var bindCallback = require('./bindCallback');

/**
 * Creates a function for `_.forOwn` or `_.forOwnRight`.
 *
 * @private
 * @param {Function} objectFunc The function to iterate over an object.
 * @returns {Function} Returns the new each function.
 */
function createForOwn(objectFunc) {
  return function(object, iteratee, thisArg) {
    if (typeof iteratee != 'function' || thisArg !== undefined) {
      iteratee = bindCallback(iteratee, thisArg, 3);
    }
    return objectFunc(object, iteratee);
  };
}

module.exports = createForOwn;

},{"./bindCallback":12}],19:[function(require,module,exports){
var baseProperty = require('./baseProperty');

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"./baseProperty":11}],20:[function(require,module,exports){
var isNative = require('../lang/isNative');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"../lang/isNative":34}],21:[function(require,module,exports){
/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add array properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

module.exports = initCloneArray;

},{}],22:[function(require,module,exports){
var bufferClone = require('./bufferClone');

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return bufferClone(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      var buffer = object.buffer;
      return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      var result = new Ctor(object.source, reFlags.exec(object));
      result.lastIndex = object.lastIndex;
  }
  return result;
}

module.exports = initCloneByTag;

},{"./bufferClone":13}],23:[function(require,module,exports){
/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  var Ctor = object.constructor;
  if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
    Ctor = Object;
  }
  return new Ctor;
}

module.exports = initCloneObject;

},{}],24:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"./getLength":19,"./isLength":26}],25:[function(require,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],26:[function(require,module,exports){
/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],27:[function(require,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],28:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('./isIndex'),
    isLength = require('./isLength'),
    keysIn = require('../object/keysIn');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"../lang/isArguments":31,"../lang/isArray":32,"../object/keysIn":40,"./isIndex":25,"./isLength":26}],29:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"../lang/isObject":35}],30:[function(require,module,exports){
var baseClone = require('../internal/baseClone'),
    bindCallback = require('../internal/bindCallback');

/**
 * Creates a deep clone of `value`. If `customizer` is provided it's invoked
 * to produce the cloned values. If `customizer` returns `undefined` cloning
 * is handled by the method instead. The `customizer` is bound to `thisArg`
 * and invoked with up to three argument; (value [, index|key, object]).
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
 * The enumerable properties of `arguments` objects and objects created by
 * constructors other than `Object` are cloned to plain `Object` objects. An
 * empty object is returned for uncloneable values such as functions, DOM nodes,
 * Maps, Sets, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {*} Returns the deep cloned value.
 * @example
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * var deep = _.cloneDeep(users);
 * deep[0] === users[0];
 * // => false
 *
 * // using a customizer callback
 * var el = _.cloneDeep(document.body, function(value) {
 *   if (_.isElement(value)) {
 *     return value.cloneNode(true);
 *   }
 * });
 *
 * el === document.body
 * // => false
 * el.nodeName
 * // => BODY
 * el.childNodes.length;
 * // => 20
 */
function cloneDeep(value, customizer, thisArg) {
  return typeof customizer == 'function'
    ? baseClone(value, true, bindCallback(customizer, thisArg, 3))
    : baseClone(value, true);
}

module.exports = cloneDeep;

},{"../internal/baseClone":6,"../internal/bindCallback":12}],31:[function(require,module,exports){
var isArrayLike = require('../internal/isArrayLike'),
    isObjectLike = require('../internal/isObjectLike');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{"../internal/isArrayLike":24,"../internal/isObjectLike":27}],32:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"../internal/getNative":20,"../internal/isLength":26,"../internal/isObjectLike":27}],33:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 which returns 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

module.exports = isFunction;

},{"./isObject":35}],34:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike');

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isNative;

},{"../internal/isObjectLike":27,"./isFunction":33}],35:[function(require,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],36:[function(require,module,exports){
/**
 * Checks if `value` is `undefined`.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 * @example
 *
 * _.isUndefined(void 0);
 * // => true
 *
 * _.isUndefined(null);
 * // => false
 */
function isUndefined(value) {
  return value === undefined;
}

module.exports = isUndefined;

},{}],37:[function(require,module,exports){
var baseFor = require('../internal/baseFor'),
    createForIn = require('../internal/createForIn');

/**
 * Iterates over own and inherited enumerable properties of an object invoking
 * `iteratee` for each property. The `iteratee` is bound to `thisArg` and invoked
 * with three arguments: (value, key, object). Iteratee functions may exit
 * iteration early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.forIn(new Foo, function(value, key) {
 *   console.log(key);
 * });
 * // => logs 'a', 'b', and 'c' (iteration order is not guaranteed)
 */
var forIn = createForIn(baseFor);

module.exports = forIn;

},{"../internal/baseFor":9,"../internal/createForIn":17}],38:[function(require,module,exports){
var baseForOwn = require('../internal/baseForOwn'),
    createForOwn = require('../internal/createForOwn');

/**
 * Iterates over own enumerable properties of an object invoking `iteratee`
 * for each property. The `iteratee` is bound to `thisArg` and invoked with
 * three arguments: (value, key, object). Iteratee functions may exit iteration
 * early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.forOwn(new Foo, function(value, key) {
 *   console.log(key);
 * });
 * // => logs 'a' and 'b' (iteration order is not guaranteed)
 */
var forOwn = createForOwn(baseForOwn);

module.exports = forOwn;

},{"../internal/baseForOwn":10,"../internal/createForOwn":18}],39:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isArrayLike = require('../internal/isArrayLike'),
    isObject = require('../lang/isObject'),
    shimKeys = require('../internal/shimKeys');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"../internal/getNative":20,"../internal/isArrayLike":24,"../internal/shimKeys":28,"../lang/isObject":35}],40:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isLength = require('../internal/isLength'),
    isObject = require('../lang/isObject');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"../internal/isIndex":25,"../internal/isLength":26,"../lang/isArguments":31,"../lang/isArray":32,"../lang/isObject":35}],41:[function(require,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],42:[function(require,module,exports){
/**
 * Stampit
 **
 * Create objects from reusable, composable behaviors.
 **
 * Copyright (c) 2013 Eric Elliott
 * http://opensource.org/licenses/MIT
 **/
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashCollectionForEach = require('lodash/collection/forEach');

var _lodashCollectionForEach2 = _interopRequireDefault(_lodashCollectionForEach);

var _lodashLangIsFunction = require('lodash/lang/isFunction');

var _lodashLangIsFunction2 = _interopRequireDefault(_lodashLangIsFunction);

var _lodashLangIsObject = require('lodash/lang/isObject');

var _lodashLangIsObject2 = _interopRequireDefault(_lodashLangIsObject);

var _supermixer = require('supermixer');

var create = Object.create;
function isThenable(value) {
  return value && (0, _lodashLangIsFunction2['default'])(value.then);
}

function extractFunctions() {
  var result = [];

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if ((0, _lodashLangIsFunction2['default'])(args[0])) {
    (0, _lodashCollectionForEach2['default'])(args, function (fn) {
      // assuming all the arguments are functions
      if ((0, _lodashLangIsFunction2['default'])(fn)) {
        result.push(fn);
      }
    });
  } else if ((0, _lodashLangIsObject2['default'])(args[0])) {
    (0, _lodashCollectionForEach2['default'])(args, function (obj) {
      (0, _lodashCollectionForEach2['default'])(obj, function (fn) {
        if ((0, _lodashLangIsFunction2['default'])(fn)) {
          result.push(fn);
        }
      });
    });
  }
  return result;
}

function addMethods(fixed) {
  for (var _len2 = arguments.length, methods = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    methods[_key2 - 1] = arguments[_key2];
  }

  return _supermixer.mixinFunctions.apply(undefined, [fixed.methods].concat(methods));
}
function addRefs(fixed) {
  for (var _len3 = arguments.length, refs = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    refs[_key3 - 1] = arguments[_key3];
  }

  fixed.refs = fixed.state = _supermixer.mixin.apply(undefined, [fixed.refs].concat(refs));
  return fixed.refs;
}
function addInit(fixed) {
  for (var _len4 = arguments.length, inits = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    inits[_key4 - 1] = arguments[_key4];
  }

  var extractedInits = extractFunctions.apply(undefined, inits);
  fixed.init = fixed.enclose = fixed.init.concat(extractedInits);
  return fixed.init;
}
function addProps(fixed) {
  for (var _len5 = arguments.length, propses = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
    propses[_key5 - 1] = arguments[_key5];
  }

  return _supermixer.merge.apply(undefined, [fixed.props].concat(propses));
}
function addStatic(fixed) {
  for (var _len6 = arguments.length, statics = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
    statics[_key6 - 1] = arguments[_key6];
  }

  return _supermixer.mixin.apply(undefined, [fixed['static']].concat(statics));
}

function cloneAndExtend(fixed, extensionFunction) {
  var stamp = stampit(fixed);

  for (var _len7 = arguments.length, args = Array(_len7 > 2 ? _len7 - 2 : 0), _key7 = 2; _key7 < _len7; _key7++) {
    args[_key7 - 2] = arguments[_key7];
  }

  extensionFunction.apply(undefined, [stamp.fixed].concat(args));
  return stamp;
}

function _compose() {
  var result = stampit();

  for (var _len8 = arguments.length, factories = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
    factories[_key8] = arguments[_key8];
  }

  (0, _lodashCollectionForEach2['default'])(factories, function (source) {
    if (source && source.fixed) {
      addMethods(result.fixed, source.fixed.methods);
      // We might end up having two different stampit modules loaded and used in conjunction.
      // These || operators ensure that old stamps could be combined with the current version stamps.
      // 'state' is the old name for 'refs'
      addRefs(result.fixed, source.fixed.refs || source.fixed.state);
      // 'enclose' is the old name for 'init'
      addInit(result.fixed, source.fixed.init || source.fixed.enclose);
      addProps(result.fixed, source.fixed.props);
      addStatic(result.fixed, source.fixed['static']);
    }
  });
  return (0, _supermixer.mixin)(result, result.fixed['static']);
}

/**
 * Return a factory function that will produce new objects using the
 * components that are passed in or composed.
 *
 * @param  {Object} [options] Options to build stamp from: `{ methods, refs, init, props }`
 * @param  {Object} [options.methods] A map of method names and bodies for delegation.
 * @param  {Object} [options.refs] A map of property names and values to be mixed into each new object.
 * @param  {Object} [options.init] A closure (function) used to create private data and privileged methods.
 * @param  {Object} [options.props] An object to be deeply cloned into each newly stamped object.
 * @param  {Object} [options.static] An object to be mixed into each `this` and derived stamps (not objects!).
 * @return {Function(refs)} factory A factory to produce objects.
 * @return {Function(refs)} factory.create Just like calling the factory function.
 * @return {Object} factory.fixed An object map containing the stamp components.
 * @return {Function(methods)} factory.methods Add methods to the stamp. Chainable.
 * @return {Function(refs)} factory.refs Add references to the stamp. Chainable.
 * @return {Function(Function(context))} factory.init Add a closure which called on object instantiation. Chainable.
 * @return {Function(props)} factory.props Add deeply cloned properties to the produced objects. Chainable.
 * @return {Function(stamps)} factory.compose Combine several stamps into single. Chainable.
 * @return {Function(statics)} factory.static Add properties to the stamp (not objects!). Chainable.
 */
var stampit = function stampit(options) {
  var fixed = { methods: {}, refs: {}, init: [], props: {}, 'static': {} };
  fixed.state = fixed.refs; // Backward compatibility. 'state' is the old name for 'refs'.
  fixed.enclose = fixed.init; // Backward compatibility. 'enclose' is the old name for 'init'.
  if (options) {
    addMethods(fixed, options.methods);
    addRefs(fixed, options.refs);
    addInit(fixed, options.init);
    addProps(fixed, options.props);
    addStatic(fixed, options['static']);
  }

  var factory = function Factory(refs) {
    for (var _len9 = arguments.length, args = Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
      args[_key9 - 1] = arguments[_key9];
    }

    var instance = (0, _supermixer.mixin)(create(fixed.methods), fixed.refs, refs);
    (0, _supermixer.mergeUnique)(instance, fixed.props); // props are safely merged into refs

    var nextPromise = null;
    if (fixed.init.length > 0) {
      (0, _lodashCollectionForEach2['default'])(fixed.init, function (fn) {
        if (!(0, _lodashLangIsFunction2['default'])(fn)) {
          return; // not a function, do nothing.
        }

        // Check if we are in the async mode.
        if (!nextPromise) {
          // Call the init().
          var callResult = fn.call(instance, { args: args, instance: instance, stamp: factory });
          if (!callResult) {
            return; // The init() returned nothing. Proceed to the next init().
          }

          // Returned value is meaningful.
          // It will replace the stampit-created object.
          if (!isThenable(callResult)) {
            instance = callResult; // stamp is synchronous so far.
            return;
          }

          // This is the sync->async conversion point.
          // Since now our factory will return a promise, not an object.
          nextPromise = callResult;
        } else {
          // As long as one of the init() functions returned a promise,
          // now our factory will 100% return promise too.
          // Linking the init() functions into the promise chain.
          nextPromise = nextPromise.then(function (newInstance) {
            // The previous promise might want to return a value,
            // which we should take as a new object instance.
            instance = newInstance || instance;

            // Calling the following init().
            // NOTE, than `fn` is wrapped to a closure within the forEach loop.
            var callResult = fn.call(instance, { args: args, instance: instance, stamp: factory });
            // Check if call result is truthy.
            if (!callResult) {
              // The init() returned nothing. Thus using the previous object instance.
              return instance;
            }

            if (!isThenable(callResult)) {
              // This init() was synchronous and returned a meaningful value.
              instance = callResult;
              // Resolve the instance for the next `then()`.
              return instance;
            }

            // The init() returned another promise. It is becoming our nextPromise.
            return callResult;
          });
        }
      });
    }

    // At the end we should resolve the last promise and
    // return the resolved value (as a promise too).
    return nextPromise ? nextPromise.then(function (newInstance) {
      return newInstance || instance;
    }) : instance;
  };

  var refsMethod = cloneAndExtend.bind(null, fixed, addRefs);
  var initMethod = cloneAndExtend.bind(null, fixed, addInit);
  return (0, _supermixer.mixin)(factory, {
    /**
     * Creates a new object instance form the stamp.
     */
    create: factory,

    /**
     * The stamp components.
     */
    fixed: fixed,

    /**
     * Take n objects and add them to the methods list of a new stamp. Creates new stamp.
     * @return {Function} A new stamp (factory object).
     */
    methods: cloneAndExtend.bind(null, fixed, addMethods),

    /**
     * Take n objects and add them to the references list of a new stamp. Creates new stamp.
     * @return {Function} A new stamp (factory object).
     */
    refs: refsMethod,

    /**
     * @deprecated since v2.0. Use refs() instead.
     * Alias to refs().
     * @return {Function} A new stamp (factory object).
     */
    state: refsMethod,

    /**
     * Take n functions, an array of functions, or n objects and add
     * the functions to the initializers list of a new stamp. Creates new stamp.
     * @return {Function} A new stamp (factory object).
     */
    init: initMethod,

    /**
     * @deprecated since v2.0. User init() instead.
     * Alias to init().
     * @return {Function} A new stamp (factory object).
     */
    enclose: initMethod,

    /**
     * Take n objects and deep merge them to the properties. Creates new stamp.
     * @return {Function} A new stamp (factory object).
     */
    props: cloneAndExtend.bind(null, fixed, addProps),

    /**
     * Take n objects and add all props to the factory object. Creates new stamp.
     * @return {Function} A new stamp (factory object).
     */
    'static': function _static() {
      for (var _len10 = arguments.length, statics = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        statics[_key10] = arguments[_key10];
      }

      var newStamp = cloneAndExtend.apply(undefined, [factory.fixed, addStatic].concat(statics));
      return (0, _supermixer.mixin)(newStamp, newStamp.fixed['static']);
    },

    /**
     * Take one or more factories produced from stampit() and
     * combine them with `this` to produce and return a new factory.
     * Combining overrides properties with last-in priority.
     * @param {[Function]|...Function} factories Stampit factories.
     * @return {Function} A new stampit factory composed from arguments.
     */
    compose: function compose() {
      for (var _len11 = arguments.length, factories = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
        factories[_key11] = arguments[_key11];
      }

      return _compose.apply(undefined, [factory].concat(factories));
    }
  }, fixed['static']);
};

// Static methods

function isStamp(obj) {
  return (0, _lodashLangIsFunction2['default'])(obj) && (0, _lodashLangIsFunction2['default'])(obj.methods) && (
  // isStamp can be called for old stampit factory object.
  // We should check old names (state and enclose) too.
  (0, _lodashLangIsFunction2['default'])(obj.refs) || (0, _lodashLangIsFunction2['default'])(obj.state)) && ((0, _lodashLangIsFunction2['default'])(obj.init) || (0, _lodashLangIsFunction2['default'])(obj.enclose)) && (0, _lodashLangIsFunction2['default'])(obj.props) && (0, _lodashLangIsFunction2['default'])(obj['static']) && (0, _lodashLangIsObject2['default'])(obj.fixed);
}

function convertConstructor(Constructor) {
  var stamp = stampit();
  stamp.fixed.refs = stamp.fixed.state = (0, _supermixer.mergeChainNonFunctions)(stamp.fixed.refs, Constructor.prototype);
  (0, _supermixer.mixin)(stamp, (0, _supermixer.mixin)(stamp.fixed['static'], Constructor));

  (0, _supermixer.mixinChainFunctions)(stamp.fixed.methods, Constructor.prototype);
  addInit(stamp.fixed, function (_ref) {
    var instance = _ref.instance;
    var args = _ref.args;
    return Constructor.apply(instance, args);
  });

  return stamp;
}

function shortcutMethod(extensionFunction) {
  var stamp = stampit();

  for (var _len12 = arguments.length, args = Array(_len12 > 1 ? _len12 - 1 : 0), _key12 = 1; _key12 < _len12; _key12++) {
    args[_key12 - 1] = arguments[_key12];
  }

  extensionFunction.apply(undefined, [stamp.fixed].concat(args));

  return stamp;
}

function mixinWithConsoleWarning() {
  console.log('stampit.mixin(), .mixIn(), .extend(), and .assign() are deprecated.', 'Use Object.assign or _.assign instead');
  return _supermixer.mixin.apply(this, arguments);
}

exports['default'] = (0, _supermixer.mixin)(stampit, {

  /**
   * Take n objects and add them to the methods list of a new stamp. Creates new stamp.
   * @return {Function} A new stamp (factory object).
   */
  methods: shortcutMethod.bind(null, addMethods),

  /**
   * Take n objects and add them to the references list of a new stamp. Creates new stamp.
   * @return {Function} A new stamp (factory object).
   */
  refs: shortcutMethod.bind(null, addRefs),

  /**
   * Take n functions, an array of functions, or n objects and add
   * the functions to the initializers list of a new stamp. Creates new stamp.
   * @return {Function} A new stamp (factory object).
   */
  init: shortcutMethod.bind(null, addInit),

  /**
   * Take n objects and deep merge them to the properties. Creates new stamp.
   * @return {Function} A new stamp (factory object).
   */
  props: shortcutMethod.bind(null, addProps),

  /**
   * Take n objects and add all props to the factory object. Creates new stamp.
   * @return {Function} A new stamp (factory object).
   */
  'static': function _static() {
    for (var _len13 = arguments.length, statics = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
      statics[_key13] = arguments[_key13];
    }

    var newStamp = shortcutMethod.apply(undefined, [addStatic].concat(statics));
    return (0, _supermixer.mixin)(newStamp, newStamp.fixed['static']);
  },

  /**
   * Take two or more factories produced from stampit() and
   * combine them to produce a new factory.
   * Combining overrides properties with last-in priority.
   * @param {[Function]|...Function} factories Stamps produced by stampit().
   * @return {Function} A new stampit factory composed from arguments.
   */
  compose: _compose,

  /**
   * @deprecated Since v2.2. Use Object.assign or _.assign instead.
   * Alias to Object.assign.
   */
  mixin: mixinWithConsoleWarning,
  extend: mixinWithConsoleWarning,
  mixIn: mixinWithConsoleWarning,
  assign: mixinWithConsoleWarning,

  /**
   * Check if an object is a stamp.
   * @param {Object} obj An object to check.
   * @returns {Boolean}
   */
  isStamp: isStamp,

  /**
   * Take an old-fashioned JS constructor and return a stampit stamp
   * that you can freely compose with other stamps.
   * @param  {Function} Constructor
   * @return {Function} A composable stampit factory (aka stamp).
   */
  convertConstructor: convertConstructor
});
module.exports = exports['default'];
},{"lodash/collection/forEach":2,"lodash/lang/isFunction":33,"lodash/lang/isObject":35,"supermixer":43}],43:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _mixer = require('./mixer');

var _mixer2 = _interopRequireDefault(_mixer);

var _lodashLangIsFunction = require('lodash/lang/isFunction');

var _lodashLangIsFunction2 = _interopRequireDefault(_lodashLangIsFunction);

var isNotFunction = function isNotFunction(val) {
  return !(0, _lodashLangIsFunction2['default'])(val);
};

/**
 * Regular mixin function.
 */
var mixin = (0, _mixer2['default'])();

/**
 * Mixin functions only.
 */
var mixinFunctions = (0, _mixer2['default'])({
  filter: _lodashLangIsFunction2['default']
});

/**
 * Mixin functions including prototype chain.
 */
var mixinChainFunctions = (0, _mixer2['default'])({
  filter: _lodashLangIsFunction2['default'],
  chain: true
});

/**
 * Regular object merge function. Ignores functions.
 */
var merge = (0, _mixer2['default'])({
  deep: true
});

/**
 * Regular object merge function. Ignores functions.
 */
var mergeUnique = (0, _mixer2['default'])({
  deep: true,
  noOverwrite: true
});

/**
 * Merge objects including prototype chain properties.
 */
var mergeChainNonFunctions = (0, _mixer2['default'])({
  filter: isNotFunction,
  deep: true,
  chain: true
});

exports['default'] = _mixer2['default'];
exports.mixin = mixin;
exports.mixinFunctions = mixinFunctions;
exports.mixinChainFunctions = mixinChainFunctions;
exports.merge = merge;
exports.mergeUnique = mergeUnique;
exports.mergeChainNonFunctions = mergeChainNonFunctions;
},{"./mixer":44,"lodash/lang/isFunction":33}],44:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = mixer;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashObjectForOwn = require('lodash/object/forOwn');

var _lodashObjectForOwn2 = _interopRequireDefault(_lodashObjectForOwn);

var _lodashObjectForIn = require('lodash/object/forIn');

var _lodashObjectForIn2 = _interopRequireDefault(_lodashObjectForIn);

var _lodashLangCloneDeep = require('lodash/lang/cloneDeep');

var _lodashLangCloneDeep2 = _interopRequireDefault(_lodashLangCloneDeep);

var _lodashLangIsObject = require('lodash/lang/isObject');

var _lodashLangIsObject2 = _interopRequireDefault(_lodashLangIsObject);

var _lodashLangIsUndefined = require('lodash/lang/isUndefined');

var _lodashLangIsUndefined2 = _interopRequireDefault(_lodashLangIsUndefined);

/**
 * Factory for creating mixin functions of all kinds.
 *
 * @param {Object} opts
 * @param {Function} opts.filter Function which filters value and key.
 * @param {Function} opts.transform Function which transforms each value.
 * @param {Boolean} opts.chain Loop through prototype properties too.
 * @param {Boolean} opts.deep Deep looping through the nested properties.
 * @param {Boolean} opts.noOverwrite Do not overwrite any existing data (aka first one wins).
 * @return {Function} A new mix function.
 */

function mixer() {
  var opts = arguments[0] === undefined ? {} : arguments[0];

  // We will be recursively calling the exact same function when walking deeper.
  if (opts.deep && !opts._innerMixer) {
    opts._innerMixer = true; // avoiding infinite recursion.
    opts._innerMixer = mixer(opts); // create same mixer for recursion purpose.
  }

  /**
   * Combine properties from the passed objects into target. This method mutates target,
   * if you want to create a new Object pass an empty object as first param.
   *
   * @param {Object} target Target Object
   * @param {...Object} objects Objects to be combined (0...n objects).
   * @return {Object} The mixed object.
   */
  return function mix(target) {
    for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      sources[_key - 1] = arguments[_key];
    }

    // Check if it's us who called the function. See recursion calls are below.
    if ((0, _lodashLangIsUndefined2['default'])(target) || !opts.noOverwrite && !(0, _lodashLangIsObject2['default'])(target)) {
      if (sources.length > 1) {
        // Weird, but someone (not us!) called this mixer with an incorrect first argument.
        return opts._innerMixer.apply(opts, [{}].concat(sources));
      }
      return (0, _lodashLangCloneDeep2['default'])(sources[0]);
    }

    if (opts.noOverwrite) {
      if (!(0, _lodashLangIsObject2['default'])(target) || !(0, _lodashLangIsObject2['default'])(sources[0])) {
        return target;
      }
    }

    function iteratee(sourceValue, key) {
      var targetValue = target[key];
      if (opts.filter && !opts.filter(sourceValue, targetValue, key)) {
        return;
      }

      var result = opts.deep ? opts._innerMixer(targetValue, sourceValue) : sourceValue;
      target[key] = opts.transform ? opts.transform(result, targetValue, key) : result;
    }

    var loop = opts.chain ? _lodashObjectForIn2['default'] : _lodashObjectForOwn2['default'];
    sources.forEach(function (obj) {
      loop(obj, iteratee);
    });

    return target;
  };
}

module.exports = exports['default'];
},{"lodash/lang/cloneDeep":30,"lodash/lang/isObject":35,"lodash/lang/isUndefined":36,"lodash/object/forIn":37,"lodash/object/forOwn":38}],"possum":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stampit = require('stampit');

var _stampit2 = _interopRequireDefault(_stampit);

var _cuid = require('cuid');

var _cuid2 = _interopRequireDefault(_cuid);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

//constants
var ANY_TRANSITION = 'ANY';

var EVENTS = {
    INVALID_TRANSITION: 'invalidTransition',
    NO_HANDLER: 'noHandler',
    HANDLING: 'handling',
    HANDLED: 'handled',
    INVOKED: 'invoked',
    DEFERRED: 'deferred',
    TRANSITIONED: 'transitioned'
};

var evented = (0, _stampit2.default)().init(function () {
    var _this = this;

    var eventModel = (0, _stampit2.default)().refs({
        topic: undefined,
        payload: undefined,
        state: undefined,
        timestamp: undefined,
        id: undefined,
        namespace: undefined
    }).init(function () {
        this.timestamp = new Date().toUTCString();
        this.id = (0, _cuid2.default)();
    });

    this.createEvent = eventModel;
    this.copyEvent = function (e, topic) {
        return _this.createEvent({
            topic: topic || e.topic,
            payload: e.payload,
            state: e.state,
            timestamp: new Date().toUTCString(),
            namespace: e.namespace,
            id: (0, _cuid2.default)()
        });
    };
    this.namespaced = function (value, namespace) {
        namespace = namespace || _this.namespace;
        var delimiter = _this.emitterOpts.delimiter || '.';
        var pre = '';
        if (namespace) {
            pre = '' + namespace + delimiter;
        }
        return '' + pre + value;
    };
});

/**
* possums are event emitters
* Provide either a `emitEvent` function for total control of the method of publication;
* or, provide a `emit` event (supported by any nodejs EventEmitter clone)
* */
var emitter = (0, _stampit2.default)().init(function () {
    var _this2 = this;

    //default impl
    this.emitEvent = function (e) {
        if (!_this2.emit) {
            throw new Error('please provide an `emit` or an `emitEvent` implementation');
        }
        e.event = _this2.namespaced(e.topic);
        _this2.emit(e.event, e);
        return _this2;
    };
});

/**
 * represents a single state in config passed by `states`
 *
 * */
var stateModel = (0, _stampit2.default)().refs({
    name: undefined
}).init(function () {
    var _this3 = this;

    if (!this.name) {
        throw new Error('`name` is required');
    }
    var enter = void 0;
    var exit = void 0;
    var handlers = {};

    function noop() {}

    this.entry = function () {
        return enter || noop;
    };
    this.exit = function () {
        return exit || noop;
    };
    this.get = function (inputType) {
        return handlers[inputType];
    };
    this.set = function () {
        var handlers = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        for (var inputType in handlers) {
            _this3.handler(inputType, handlers[inputType]);
        }
    };
    this.handler = function (inputType, fn) {
        switch (inputType) {
            case '_enter':
                enter = fn;
                break;
            case '_exit':
                exit = fn;
                break;
            default:
                handlers[inputType] = fn;
                break;
        }
        return _this3;
    };
});

/**
 * maps state names to their config and exposes
 * api for retrieving and setting them
 *
 * */
var statesCollection = (0, _stampit2.default)().init(function () {
    var _this4 = this;

    var map = {};

    this.set = function (states) {
        for (var stateName in states) {
            var state = stateModel({ name: stateName });
            state.set(states[stateName]);
            map[stateName] = state;
        }
        return _this4;
    };
    this.get = function (stateName, inputType) {
        var cfg = map[stateName];
        if (!cfg) {
            return undefined;
        }
        var handler = cfg.get(inputType);
        if (!handler) {
            return undefined;
        }
        return handler;
    };
    this.getEntry = function (stateName) {
        var cfg = map[stateName];
        return cfg.entry();
    };
    this.getExit = function (stateName) {
        var cfg = map[stateName];
        return cfg.exit();
    };
    this.has = function (stateName) {
        return Object.hasOwnProperty.call(map, stateName);
    };
});

/**
 * possum api
 *
 * */
var api = (0, _stampit2.default)().refs({
    emitterOpts: {
        wildcards: true,
        delimiter: '.',
        newListener: true,
        maxListeners: 10
    }
}).static({
    /**
     * Assign states config to instance
     *
     * @method states
     * @param {Object} cfg state : inputHandlers pairs
     * @example
     * p.states({
     *  'uninitialized': {
     *      'initialized': function(inputType, args) { ...}
     *      'another': function(inputType, args) { ...}
     *  }
     * })
     * @return {stamp}
     * */

    states: function states(cfg) {
        return this.props({
            states: cfg
        });
    }
    /**
     * Set the state target. Uses `this` if not provided.
     *
     * @method target
     * @param {Any} obj the object for state tracking
     * @return {stamp}
     */

    , target: function target(obj) {
        return this.props({
            target: obj
        });
    }
    /**
     * Configure the instance
     *
     * @method config
     * @param {Object} args any number of args to configure
     * @return {stamp}
     * */

    , config: function config() {
        return this.props.apply(this, arguments);
    }
}).compose(evented, emitter).init(function () {
    var _this5 = this;

    if (!this.initialState) {
        throw new Error('an `initialState` config is required');
    }

    var handlers = statesCollection();
    handlers.set(this.states);

    var target = this.target || this;

    var invocations = [];

    var deferrals = {};

    var replay = function replay(deferred, lastResult) {
        if (!deferred.length) {
            return lastResult;
        }
        var next = deferred.shift();
        if (lastResult && lastResult.then) {
            return lastResult.then(_this5.handle.bind(_this5, next.inputType, next.args)).then(function (res) {
                return replay(deferred, res);
            });
        }
        return replay(deferred, _this5.handle(next.inputType, next.args));
    };

    var done = function done(len, completed, result) {
        //remove the invocation
        if (invocations.length >= len) {
            invocations.splice(len - 1, 1);
        }
        _this5.emitEvent(completed);
        return result;
    };

    /**
     * The current state
     *
     * @property {String} currentState the current state of the possum
     * */
    this.currentState = this.initialState;
    /**
     * The prior state
     *
     * @property {String} priorState the prior state of the possum
     * */
    this.priorState = undefined;

    /**
     * Handle an `inputType` with the configure states handlers
     *
     * @method handle - the primary interaction point for callers
     * @param {String} inputType
     * @param {Any} [args]
     * @example
     *
     * myPossum.handle('initialize',{ id: '123'})
     * @return {Any} the result of the handler configured by `states`
     * */
    this.handle = function (inputType, args) {
        var len = invocations.push({ inputType: inputType, args: args });
        var handler = handlers.get(_this5.currentState, inputType);
        if (!handler) {
            var noHandler = _this5.createEvent({
                topic: EVENTS.NO_HANDLER,
                payload: {
                    args: args,
                    inputType: inputType
                },
                namespace: _this5.namespace,
                state: _this5.currentState
            });
            _this5.emitEvent(noHandler);
            return _this5;
        }
        //create events
        var handling = _this5.createEvent({
            topic: EVENTS.HANDLING,
            payload: {
                args: args,
                inputType: inputType
            },
            namespace: _this5.namespace,
            state: _this5.currentState
        });
        var invoked = _this5.copyEvent(handling, EVENTS.INVOKED);
        var handled = _this5.copyEvent(handling, EVENTS.HANDLED);

        //do it
        _this5.emitEvent(handling);
        var result = handler.call(_this5, args, target);
        _this5.emitEvent(invoked);

        if (result && result.then) {
            return result.then(done.bind(_this5, len, handled));
        }
        return done(len, handled, result);
    };

    /**
     * Defers the invocation for replay after transition
     *
     * @method deferUntilTransition
     * @param {String} [toState] optionally provide a transition
     * after which to replay this invocation.
     * @return {Possum} the possum instance
     * */
    this.deferUntilTransition = function () {
        var toState = arguments.length <= 0 || arguments[0] === undefined ? ANY_TRANSITION : arguments[0];

        var coll = deferrals[toState] || [];
        var invocation = invocations.pop();
        var deferred = _this5.createEvent({
            topic: 'deferred',
            state: _this5.currentState,
            payload: invocation,
            namespace: _this5.namespace
        });
        coll.push(invocation);
        deferrals[toState] = coll;

        _this5.emitEvent(deferred);
        return _this5;
    };

    var doTransition = function doTransition(toState, target) {
        _this5.priorState = _this5.currentState;
        _this5.currentState = toState;
        var transitioned = _this5.createEvent({
            topic: 'transitioned',
            payload: {
                toState: _this5.currentState,
                fromState: _this5.priorState
            },
            state: _this5.currentState,
            namespace: _this5.namespace
        });
        _this5.emitEvent(transitioned);
        var deferred = (deferrals[toState] || []).concat(deferrals[ANY_TRANSITION] || []);
        delete deferrals[toState];
        delete deferrals[ANY_TRANSITION];
        return replay(deferred);
    };
    /**
     * Transition to another state.
     * Prefer calling this internally; eg inside a handler.
     *
     * @method transition
     * @param {String} toState - the target transition
     * @return {Any} the result of any deferred handlers, if any
     * */
    this.transition = function (toState) {
        if (!handlers.has(toState)) {
            _this5.emitEvent(_this5.createEvent({
                topic: EVENTS.INVALID_TRANSITION,
                namespace: _this5.namespace,
                payload: { toState: toState, fromState: _this5.currentState },
                state: _this5.currentState
            }));
            return _this5;
        }
        // first exit current state
        var exit = handlers.getExit(_this5.currentState);
        var enter = handlers.getEntry(toState);
        var result = exit.call(_this5, target);
        var doTransitionBound = doTransition.bind(_this5, toState, target);
        if (result && result.then) {
            return result.then(enter.bind(_this5)).then(doTransitionBound);
        }
        result = enter.call(_this5, target);
        if (result && result.then) {
            return result.then(doTransitionBound);
        }
        return doTransitionBound();
    };

    /**
     * Getter/setter for the state target to pass
     * into each handler
     *
     * @method target
     * @param {Any} [obj] if provided, SET the target
     * with `obj`; otherwise, GET the target
     * @return {Any} the target
     * */
    this.target = function (obj) {
        if (obj) {
            return target = obj;
        }
        return target;
    };
});

exports.default = api;

},{"cuid":1,"stampit":42}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY3VpZC9kaXN0L2Jyb3dzZXItY3VpZC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY29sbGVjdGlvbi9mb3JFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheUNvcHkuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2FycmF5RWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUFzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUNsb25lLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlQ29weS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VGb3IuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VGb3JPd24uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VQcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmluZENhbGxiYWNrLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9idWZmZXJDbG9uZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQmFzZUVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUJhc2VGb3IuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUZvckVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUZvckluLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jcmVhdGVGb3JPd24uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2dldExlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvZ2V0TmF0aXZlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pbml0Q2xvbmVBcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaW5pdENsb25lQnlUYWcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2luaXRDbG9uZU9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNBcnJheUxpa2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzSW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzTGVuZ3RoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc09iamVjdExpa2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3NoaW1LZXlzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC90b09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9jbG9uZURlZXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNBcmd1bWVudHMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNBcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0Z1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzTmF0aXZlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzVW5kZWZpbmVkLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3QvZm9ySW4uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9mb3JPd24uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9rZXlzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3Qva2V5c0luLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC91dGlsaXR5L2lkZW50aXR5LmpzIiwibm9kZV9tb2R1bGVzL3N0YW1waXQvZGlzdC9zdGFtcGl0LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVybWl4ZXIvZGlzdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdXBlcm1peGVyL2Rpc3QvbWl4ZXIuanMiLCJkaXN0L3Bvc3N1bS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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TUFBUDtBQUNILEtBTEQ7QUFNSCxDQXRQUyxDQUFWOztBQXdQQSxRQUFRLE9BQVIsR0FBa0IsR0FBbEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBjdWlkLmpzXG4gKiBDb2xsaXNpb24tcmVzaXN0YW50IFVJRCBnZW5lcmF0b3IgZm9yIGJyb3dzZXJzIGFuZCBub2RlLlxuICogU2VxdWVudGlhbCBmb3IgZmFzdCBkYiBsb29rdXBzIGFuZCByZWNlbmN5IHNvcnRpbmcuXG4gKiBTYWZlIGZvciBlbGVtZW50IElEcyBhbmQgc2VydmVyLXNpZGUgbG9va3Vwcy5cbiAqXG4gKiBFeHRyYWN0ZWQgZnJvbSBDTENUUlxuICpcbiAqIENvcHlyaWdodCAoYykgRXJpYyBFbGxpb3R0IDIwMTJcbiAqIE1JVCBMaWNlbnNlXG4gKi9cblxuLypnbG9iYWwgd2luZG93LCBuYXZpZ2F0b3IsIGRvY3VtZW50LCByZXF1aXJlLCBwcm9jZXNzLCBtb2R1bGUgKi9cbihmdW5jdGlvbiAoYXBwKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyIG5hbWVzcGFjZSA9ICdjdWlkJyxcbiAgICBjID0gMCxcbiAgICBibG9ja1NpemUgPSA0LFxuICAgIGJhc2UgPSAzNixcbiAgICBkaXNjcmV0ZVZhbHVlcyA9IE1hdGgucG93KGJhc2UsIGJsb2NrU2l6ZSksXG5cbiAgICBwYWQgPSBmdW5jdGlvbiBwYWQobnVtLCBzaXplKSB7XG4gICAgICB2YXIgcyA9IFwiMDAwMDAwMDAwXCIgKyBudW07XG4gICAgICByZXR1cm4gcy5zdWJzdHIocy5sZW5ndGgtc2l6ZSk7XG4gICAgfSxcblxuICAgIHJhbmRvbUJsb2NrID0gZnVuY3Rpb24gcmFuZG9tQmxvY2soKSB7XG4gICAgICByZXR1cm4gcGFkKChNYXRoLnJhbmRvbSgpICpcbiAgICAgICAgICAgIGRpc2NyZXRlVmFsdWVzIDw8IDApXG4gICAgICAgICAgICAudG9TdHJpbmcoYmFzZSksIGJsb2NrU2l6ZSk7XG4gICAgfSxcblxuICAgIHNhZmVDb3VudGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgYyA9IChjIDwgZGlzY3JldGVWYWx1ZXMpID8gYyA6IDA7XG4gICAgICBjKys7IC8vIHRoaXMgaXMgbm90IHN1YmxpbWluYWxcbiAgICAgIHJldHVybiBjIC0gMTtcbiAgICB9LFxuXG4gICAgYXBpID0gZnVuY3Rpb24gY3VpZCgpIHtcbiAgICAgIC8vIFN0YXJ0aW5nIHdpdGggYSBsb3dlcmNhc2UgbGV0dGVyIG1ha2VzXG4gICAgICAvLyBpdCBIVE1MIGVsZW1lbnQgSUQgZnJpZW5kbHkuXG4gICAgICB2YXIgbGV0dGVyID0gJ2MnLCAvLyBoYXJkLWNvZGVkIGFsbG93cyBmb3Igc2VxdWVudGlhbCBhY2Nlc3NcblxuICAgICAgICAvLyB0aW1lc3RhbXBcbiAgICAgICAgLy8gd2FybmluZzogdGhpcyBleHBvc2VzIHRoZSBleGFjdCBkYXRlIGFuZCB0aW1lXG4gICAgICAgIC8vIHRoYXQgdGhlIHVpZCB3YXMgY3JlYXRlZC5cbiAgICAgICAgdGltZXN0YW1wID0gKG5ldyBEYXRlKCkuZ2V0VGltZSgpKS50b1N0cmluZyhiYXNlKSxcblxuICAgICAgICAvLyBQcmV2ZW50IHNhbWUtbWFjaGluZSBjb2xsaXNpb25zLlxuICAgICAgICBjb3VudGVyLFxuXG4gICAgICAgIC8vIEEgZmV3IGNoYXJzIHRvIGdlbmVyYXRlIGRpc3RpbmN0IGlkcyBmb3IgZGlmZmVyZW50XG4gICAgICAgIC8vIGNsaWVudHMgKHNvIGRpZmZlcmVudCBjb21wdXRlcnMgYXJlIGZhciBsZXNzXG4gICAgICAgIC8vIGxpa2VseSB0byBnZW5lcmF0ZSB0aGUgc2FtZSBpZClcbiAgICAgICAgZmluZ2VycHJpbnQgPSBhcGkuZmluZ2VycHJpbnQoKSxcblxuICAgICAgICAvLyBHcmFiIHNvbWUgbW9yZSBjaGFycyBmcm9tIE1hdGgucmFuZG9tKClcbiAgICAgICAgcmFuZG9tID0gcmFuZG9tQmxvY2soKSArIHJhbmRvbUJsb2NrKCk7XG5cbiAgICAgICAgY291bnRlciA9IHBhZChzYWZlQ291bnRlcigpLnRvU3RyaW5nKGJhc2UpLCBibG9ja1NpemUpO1xuXG4gICAgICByZXR1cm4gIChsZXR0ZXIgKyB0aW1lc3RhbXAgKyBjb3VudGVyICsgZmluZ2VycHJpbnQgKyByYW5kb20pO1xuICAgIH07XG5cbiAgYXBpLnNsdWcgPSBmdW5jdGlvbiBzbHVnKCkge1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKS5nZXRUaW1lKCkudG9TdHJpbmcoMzYpLFxuICAgICAgY291bnRlcixcbiAgICAgIHByaW50ID0gYXBpLmZpbmdlcnByaW50KCkuc2xpY2UoMCwxKSArXG4gICAgICAgIGFwaS5maW5nZXJwcmludCgpLnNsaWNlKC0xKSxcbiAgICAgIHJhbmRvbSA9IHJhbmRvbUJsb2NrKCkuc2xpY2UoLTIpO1xuXG4gICAgICBjb3VudGVyID0gc2FmZUNvdW50ZXIoKS50b1N0cmluZygzNikuc2xpY2UoLTQpO1xuXG4gICAgcmV0dXJuIGRhdGUuc2xpY2UoLTIpICtcbiAgICAgIGNvdW50ZXIgKyBwcmludCArIHJhbmRvbTtcbiAgfTtcblxuICBhcGkuZ2xvYmFsQ291bnQgPSBmdW5jdGlvbiBnbG9iYWxDb3VudCgpIHtcbiAgICAvLyBXZSB3YW50IHRvIGNhY2hlIHRoZSByZXN1bHRzIG9mIHRoaXNcbiAgICB2YXIgY2FjaGUgPSAoZnVuY3Rpb24gY2FsYygpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgY291bnQgPSAwO1xuXG4gICAgICAgIGZvciAoaSBpbiB3aW5kb3cpIHtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgICAgfSgpKTtcblxuICAgIGFwaS5nbG9iYWxDb3VudCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNhY2hlOyB9O1xuICAgIHJldHVybiBjYWNoZTtcbiAgfTtcblxuICBhcGkuZmluZ2VycHJpbnQgPSBmdW5jdGlvbiBicm93c2VyUHJpbnQoKSB7XG4gICAgcmV0dXJuIHBhZCgobmF2aWdhdG9yLm1pbWVUeXBlcy5sZW5ndGggK1xuICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5sZW5ndGgpLnRvU3RyaW5nKDM2KSArXG4gICAgICBhcGkuZ2xvYmFsQ291bnQoKS50b1N0cmluZygzNiksIDQpO1xuICB9O1xuXG4gIC8vIGRvbid0IGNoYW5nZSBhbnl0aGluZyBmcm9tIGhlcmUgZG93bi5cbiAgaWYgKGFwcC5yZWdpc3Rlcikge1xuICAgIGFwcC5yZWdpc3RlcihuYW1lc3BhY2UsIGFwaSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGFwaTtcbiAgfSBlbHNlIHtcbiAgICBhcHBbbmFtZXNwYWNlXSA9IGFwaTtcbiAgfVxuXG59KHRoaXMuYXBwbGl0dWRlIHx8IHRoaXMpKTtcbiIsInZhciBhcnJheUVhY2ggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hcnJheUVhY2gnKSxcbiAgICBiYXNlRWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VFYWNoJyksXG4gICAgY3JlYXRlRm9yRWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2NyZWF0ZUZvckVhY2gnKTtcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGBjb2xsZWN0aW9uYCBpbnZva2luZyBgaXRlcmF0ZWVgIGZvciBlYWNoIGVsZW1lbnQuXG4gKiBUaGUgYGl0ZXJhdGVlYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6XG4gKiAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHlcbiAqIGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gKlxuICogKipOb3RlOioqIEFzIHdpdGggb3RoZXIgXCJDb2xsZWN0aW9uc1wiIG1ldGhvZHMsIG9iamVjdHMgd2l0aCBhIFwibGVuZ3RoXCIgcHJvcGVydHlcbiAqIGFyZSBpdGVyYXRlZCBsaWtlIGFycmF5cy4gVG8gYXZvaWQgdGhpcyBiZWhhdmlvciBgXy5mb3JJbmAgb3IgYF8uZm9yT3duYFxuICogbWF5IGJlIHVzZWQgZm9yIG9iamVjdCBpdGVyYXRpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBhbGlhcyBlYWNoXG4gKiBAY2F0ZWdvcnkgQ29sbGVjdGlvblxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBpdGVyYXRlZWAuXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fHN0cmluZ30gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8oWzEsIDJdKS5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAqICAgY29uc29sZS5sb2cobik7XG4gKiB9KS52YWx1ZSgpO1xuICogLy8gPT4gbG9ncyBlYWNoIHZhbHVlIGZyb20gbGVmdCB0byByaWdodCBhbmQgcmV0dXJucyB0aGUgYXJyYXlcbiAqXG4gKiBfLmZvckVhY2goeyAnYSc6IDEsICdiJzogMiB9LCBmdW5jdGlvbihuLCBrZXkpIHtcbiAqICAgY29uc29sZS5sb2cobiwga2V5KTtcbiAqIH0pO1xuICogLy8gPT4gbG9ncyBlYWNoIHZhbHVlLWtleSBwYWlyIGFuZCByZXR1cm5zIHRoZSBvYmplY3QgKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xudmFyIGZvckVhY2ggPSBjcmVhdGVGb3JFYWNoKGFycmF5RWFjaCwgYmFzZUVhY2gpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvckVhY2g7XG4iLCIvKipcbiAqIENvcGllcyB0aGUgdmFsdWVzIG9mIGBzb3VyY2VgIHRvIGBhcnJheWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IHNvdXJjZSBUaGUgYXJyYXkgdG8gY29weSB2YWx1ZXMgZnJvbS5cbiAqIEBwYXJhbSB7QXJyYXl9IFthcnJheT1bXV0gVGhlIGFycmF5IHRvIGNvcHkgdmFsdWVzIHRvLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5Q29weShzb3VyY2UsIGFycmF5KSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gc291cmNlLmxlbmd0aDtcblxuICBhcnJheSB8fCAoYXJyYXkgPSBBcnJheShsZW5ndGgpKTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBhcnJheVtpbmRleF0gPSBzb3VyY2VbaW5kZXhdO1xuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUNvcHk7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5mb3JFYWNoYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBgYXJyYXlgLlxuICovXG5mdW5jdGlvbiBhcnJheUVhY2goYXJyYXksIGl0ZXJhdGVlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgaWYgKGl0ZXJhdGVlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlFYWNoO1xuIiwidmFyIGJhc2VDb3B5ID0gcmVxdWlyZSgnLi9iYXNlQ29weScpLFxuICAgIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmFzc2lnbmAgd2l0aG91dCBzdXBwb3J0IGZvciBhcmd1bWVudCBqdWdnbGluZyxcbiAqIG11bHRpcGxlIHNvdXJjZXMsIGFuZCBgY3VzdG9taXplcmAgZnVuY3Rpb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZUFzc2lnbihvYmplY3QsIHNvdXJjZSkge1xuICByZXR1cm4gc291cmNlID09IG51bGxcbiAgICA/IG9iamVjdFxuICAgIDogYmFzZUNvcHkoc291cmNlLCBrZXlzKHNvdXJjZSksIG9iamVjdCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUFzc2lnbjtcbiIsInZhciBhcnJheUNvcHkgPSByZXF1aXJlKCcuL2FycmF5Q29weScpLFxuICAgIGFycmF5RWFjaCA9IHJlcXVpcmUoJy4vYXJyYXlFYWNoJyksXG4gICAgYmFzZUFzc2lnbiA9IHJlcXVpcmUoJy4vYmFzZUFzc2lnbicpLFxuICAgIGJhc2VGb3JPd24gPSByZXF1aXJlKCcuL2Jhc2VGb3JPd24nKSxcbiAgICBpbml0Q2xvbmVBcnJheSA9IHJlcXVpcmUoJy4vaW5pdENsb25lQXJyYXknKSxcbiAgICBpbml0Q2xvbmVCeVRhZyA9IHJlcXVpcmUoJy4vaW5pdENsb25lQnlUYWcnKSxcbiAgICBpbml0Q2xvbmVPYmplY3QgPSByZXF1aXJlKCcuL2luaXRDbG9uZU9iamVjdCcpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJyxcbiAgICBhcnJheVRhZyA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgYm9vbFRhZyA9ICdbb2JqZWN0IEJvb2xlYW5dJyxcbiAgICBkYXRlVGFnID0gJ1tvYmplY3QgRGF0ZV0nLFxuICAgIGVycm9yVGFnID0gJ1tvYmplY3QgRXJyb3JdJyxcbiAgICBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBtYXBUYWcgPSAnW29iamVjdCBNYXBdJyxcbiAgICBudW1iZXJUYWcgPSAnW29iamVjdCBOdW1iZXJdJyxcbiAgICBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICByZWdleHBUYWcgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICBzZXRUYWcgPSAnW29iamVjdCBTZXRdJyxcbiAgICBzdHJpbmdUYWcgPSAnW29iamVjdCBTdHJpbmddJyxcbiAgICB3ZWFrTWFwVGFnID0gJ1tvYmplY3QgV2Vha01hcF0nO1xuXG52YXIgYXJyYXlCdWZmZXJUYWcgPSAnW29iamVjdCBBcnJheUJ1ZmZlcl0nLFxuICAgIGZsb2F0MzJUYWcgPSAnW29iamVjdCBGbG9hdDMyQXJyYXldJyxcbiAgICBmbG9hdDY0VGFnID0gJ1tvYmplY3QgRmxvYXQ2NEFycmF5XScsXG4gICAgaW50OFRhZyA9ICdbb2JqZWN0IEludDhBcnJheV0nLFxuICAgIGludDE2VGFnID0gJ1tvYmplY3QgSW50MTZBcnJheV0nLFxuICAgIGludDMyVGFnID0gJ1tvYmplY3QgSW50MzJBcnJheV0nLFxuICAgIHVpbnQ4VGFnID0gJ1tvYmplY3QgVWludDhBcnJheV0nLFxuICAgIHVpbnQ4Q2xhbXBlZFRhZyA9ICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScsXG4gICAgdWludDE2VGFnID0gJ1tvYmplY3QgVWludDE2QXJyYXldJyxcbiAgICB1aW50MzJUYWcgPSAnW29iamVjdCBVaW50MzJBcnJheV0nO1xuXG4vKiogVXNlZCB0byBpZGVudGlmeSBgdG9TdHJpbmdUYWdgIHZhbHVlcyBzdXBwb3J0ZWQgYnkgYF8uY2xvbmVgLiAqL1xudmFyIGNsb25lYWJsZVRhZ3MgPSB7fTtcbmNsb25lYWJsZVRhZ3NbYXJnc1RhZ10gPSBjbG9uZWFibGVUYWdzW2FycmF5VGFnXSA9XG5jbG9uZWFibGVUYWdzW2FycmF5QnVmZmVyVGFnXSA9IGNsb25lYWJsZVRhZ3NbYm9vbFRhZ10gPVxuY2xvbmVhYmxlVGFnc1tkYXRlVGFnXSA9IGNsb25lYWJsZVRhZ3NbZmxvYXQzMlRhZ10gPVxuY2xvbmVhYmxlVGFnc1tmbG9hdDY0VGFnXSA9IGNsb25lYWJsZVRhZ3NbaW50OFRhZ10gPVxuY2xvbmVhYmxlVGFnc1tpbnQxNlRhZ10gPSBjbG9uZWFibGVUYWdzW2ludDMyVGFnXSA9XG5jbG9uZWFibGVUYWdzW251bWJlclRhZ10gPSBjbG9uZWFibGVUYWdzW29iamVjdFRhZ10gPVxuY2xvbmVhYmxlVGFnc1tyZWdleHBUYWddID0gY2xvbmVhYmxlVGFnc1tzdHJpbmdUYWddID1cbmNsb25lYWJsZVRhZ3NbdWludDhUYWddID0gY2xvbmVhYmxlVGFnc1t1aW50OENsYW1wZWRUYWddID1cbmNsb25lYWJsZVRhZ3NbdWludDE2VGFnXSA9IGNsb25lYWJsZVRhZ3NbdWludDMyVGFnXSA9IHRydWU7XG5jbG9uZWFibGVUYWdzW2Vycm9yVGFnXSA9IGNsb25lYWJsZVRhZ3NbZnVuY1RhZ10gPVxuY2xvbmVhYmxlVGFnc1ttYXBUYWddID0gY2xvbmVhYmxlVGFnc1tzZXRUYWddID1cbmNsb25lYWJsZVRhZ3Nbd2Vha01hcFRhZ10gPSBmYWxzZTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9ialRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY2xvbmVgIHdpdGhvdXQgc3VwcG9ydCBmb3IgYXJndW1lbnQganVnZ2xpbmdcbiAqIGFuZCBgdGhpc2AgYmluZGluZyBgY3VzdG9taXplcmAgZnVuY3Rpb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjbG9uZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRGVlcF0gU3BlY2lmeSBhIGRlZXAgY2xvbmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjbG9uaW5nIHZhbHVlcy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBba2V5XSBUaGUga2V5IG9mIGB2YWx1ZWAuXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdF0gVGhlIG9iamVjdCBgdmFsdWVgIGJlbG9uZ3MgdG8uXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBPVtdXSBUcmFja3MgdHJhdmVyc2VkIHNvdXJjZSBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQj1bXV0gQXNzb2NpYXRlcyBjbG9uZXMgd2l0aCBzb3VyY2UgY291bnRlcnBhcnRzLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGNsb25lZCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gYmFzZUNsb25lKHZhbHVlLCBpc0RlZXAsIGN1c3RvbWl6ZXIsIGtleSwgb2JqZWN0LCBzdGFja0EsIHN0YWNrQikge1xuICB2YXIgcmVzdWx0O1xuICBpZiAoY3VzdG9taXplcikge1xuICAgIHJlc3VsdCA9IG9iamVjdCA/IGN1c3RvbWl6ZXIodmFsdWUsIGtleSwgb2JqZWN0KSA6IGN1c3RvbWl6ZXIodmFsdWUpO1xuICB9XG4gIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgaWYgKCFpc09iamVjdCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgdmFyIGlzQXJyID0gaXNBcnJheSh2YWx1ZSk7XG4gIGlmIChpc0Fycikge1xuICAgIHJlc3VsdCA9IGluaXRDbG9uZUFycmF5KHZhbHVlKTtcbiAgICBpZiAoIWlzRGVlcCkge1xuICAgICAgcmV0dXJuIGFycmF5Q29weSh2YWx1ZSwgcmVzdWx0KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIHRhZyA9IG9ialRvU3RyaW5nLmNhbGwodmFsdWUpLFxuICAgICAgICBpc0Z1bmMgPSB0YWcgPT0gZnVuY1RhZztcblxuICAgIGlmICh0YWcgPT0gb2JqZWN0VGFnIHx8IHRhZyA9PSBhcmdzVGFnIHx8IChpc0Z1bmMgJiYgIW9iamVjdCkpIHtcbiAgICAgIHJlc3VsdCA9IGluaXRDbG9uZU9iamVjdChpc0Z1bmMgPyB7fSA6IHZhbHVlKTtcbiAgICAgIGlmICghaXNEZWVwKSB7XG4gICAgICAgIHJldHVybiBiYXNlQXNzaWduKHJlc3VsdCwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY2xvbmVhYmxlVGFnc1t0YWddXG4gICAgICAgID8gaW5pdENsb25lQnlUYWcodmFsdWUsIHRhZywgaXNEZWVwKVxuICAgICAgICA6IChvYmplY3QgPyB2YWx1ZSA6IHt9KTtcbiAgICB9XG4gIH1cbiAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIHJlZmVyZW5jZXMgYW5kIHJldHVybiBpdHMgY29ycmVzcG9uZGluZyBjbG9uZS5cbiAgc3RhY2tBIHx8IChzdGFja0EgPSBbXSk7XG4gIHN0YWNrQiB8fCAoc3RhY2tCID0gW10pO1xuXG4gIHZhciBsZW5ndGggPSBzdGFja0EubGVuZ3RoO1xuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICBpZiAoc3RhY2tBW2xlbmd0aF0gPT0gdmFsdWUpIHtcbiAgICAgIHJldHVybiBzdGFja0JbbGVuZ3RoXTtcbiAgICB9XG4gIH1cbiAgLy8gQWRkIHRoZSBzb3VyY2UgdmFsdWUgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzIGFuZCBhc3NvY2lhdGUgaXQgd2l0aCBpdHMgY2xvbmUuXG4gIHN0YWNrQS5wdXNoKHZhbHVlKTtcbiAgc3RhY2tCLnB1c2gocmVzdWx0KTtcblxuICAvLyBSZWN1cnNpdmVseSBwb3B1bGF0ZSBjbG9uZSAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAoaXNBcnIgPyBhcnJheUVhY2ggOiBiYXNlRm9yT3duKSh2YWx1ZSwgZnVuY3Rpb24oc3ViVmFsdWUsIGtleSkge1xuICAgIHJlc3VsdFtrZXldID0gYmFzZUNsb25lKHN1YlZhbHVlLCBpc0RlZXAsIGN1c3RvbWl6ZXIsIGtleSwgdmFsdWUsIHN0YWNrQSwgc3RhY2tCKTtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUNsb25lO1xuIiwiLyoqXG4gKiBDb3BpZXMgcHJvcGVydGllcyBvZiBgc291cmNlYCB0byBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgb2JqZWN0IHRvIGNvcHkgcHJvcGVydGllcyBmcm9tLlxuICogQHBhcmFtIHtBcnJheX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIGNvcHkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdD17fV0gVGhlIG9iamVjdCB0byBjb3B5IHByb3BlcnRpZXMgdG8uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBiYXNlQ29weShzb3VyY2UsIHByb3BzLCBvYmplY3QpIHtcbiAgb2JqZWN0IHx8IChvYmplY3QgPSB7fSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgIG9iamVjdFtrZXldID0gc291cmNlW2tleV07XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQ29weTtcbiIsInZhciBiYXNlRm9yT3duID0gcmVxdWlyZSgnLi9iYXNlRm9yT3duJyksXG4gICAgY3JlYXRlQmFzZUVhY2ggPSByZXF1aXJlKCcuL2NyZWF0ZUJhc2VFYWNoJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZm9yRWFjaGAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fE9iamVjdHxzdHJpbmd9IFJldHVybnMgYGNvbGxlY3Rpb25gLlxuICovXG52YXIgYmFzZUVhY2ggPSBjcmVhdGVCYXNlRWFjaChiYXNlRm9yT3duKTtcblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRWFjaDtcbiIsInZhciBjcmVhdGVCYXNlRm9yID0gcmVxdWlyZSgnLi9jcmVhdGVCYXNlRm9yJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGJhc2VGb3JJbmAgYW5kIGBiYXNlRm9yT3duYCB3aGljaCBpdGVyYXRlc1xuICogb3ZlciBgb2JqZWN0YCBwcm9wZXJ0aWVzIHJldHVybmVkIGJ5IGBrZXlzRnVuY2AgaW52b2tpbmcgYGl0ZXJhdGVlYCBmb3JcbiAqIGVhY2ggcHJvcGVydHkuIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHkgYnkgZXhwbGljaXRseVxuICogcmV0dXJuaW5nIGBmYWxzZWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHtGdW5jdGlvbn0ga2V5c0Z1bmMgVGhlIGZ1bmN0aW9uIHRvIGdldCB0aGUga2V5cyBvZiBgb2JqZWN0YC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbnZhciBiYXNlRm9yID0gY3JlYXRlQmFzZUZvcigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGb3I7XG4iLCJ2YXIgYmFzZUZvciA9IHJlcXVpcmUoJy4vYmFzZUZvcicpLFxuICAgIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZvck93bmAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZUZvck93bihvYmplY3QsIGl0ZXJhdGVlKSB7XG4gIHJldHVybiBiYXNlRm9yKG9iamVjdCwgaXRlcmF0ZWUsIGtleXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGb3JPd247XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnByb3BlcnR5YCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZXAgcGF0aHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VQcm9wZXJ0eShrZXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VQcm9wZXJ0eTtcbiIsInZhciBpZGVudGl0eSA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvaWRlbnRpdHknKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VDYWxsYmFja2Agd2hpY2ggb25seSBzdXBwb3J0cyBgdGhpc2AgYmluZGluZ1xuICogYW5kIHNwZWNpZnlpbmcgdGhlIG51bWJlciBvZiBhcmd1bWVudHMgdG8gcHJvdmlkZSB0byBgZnVuY2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGJpbmQuXG4gKiBAcGFyYW0geyp9IHRoaXNBcmcgVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbYXJnQ291bnRdIFRoZSBudW1iZXIgb2YgYXJndW1lbnRzIHRvIHByb3ZpZGUgdG8gYGZ1bmNgLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBjYWxsYmFjay5cbiAqL1xuZnVuY3Rpb24gYmluZENhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGlkZW50aXR5O1xuICB9XG4gIGlmICh0aGlzQXJnID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZnVuYztcbiAgfVxuICBzd2l0Y2ggKGFyZ0NvdW50KSB7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgdmFsdWUpO1xuICAgIH07XG4gICAgY2FzZSAzOiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgfTtcbiAgICBjYXNlIDQ6IHJldHVybiBmdW5jdGlvbihhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgIH07XG4gICAgY2FzZSA1OiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIG90aGVyLCBrZXksIG9iamVjdCwgc291cmNlKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlLCBvdGhlciwga2V5LCBvYmplY3QsIHNvdXJjZSk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiaW5kQ2FsbGJhY2s7XG4iLCIvKiogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIEFycmF5QnVmZmVyID0gZ2xvYmFsLkFycmF5QnVmZmVyLFxuICAgIFVpbnQ4QXJyYXkgPSBnbG9iYWwuVWludDhBcnJheTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgY2xvbmUgb2YgdGhlIGdpdmVuIGFycmF5IGJ1ZmZlci5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYnVmZmVyIFRoZSBhcnJheSBidWZmZXIgdG8gY2xvbmUuXG4gKiBAcmV0dXJucyB7QXJyYXlCdWZmZXJ9IFJldHVybnMgdGhlIGNsb25lZCBhcnJheSBidWZmZXIuXG4gKi9cbmZ1bmN0aW9uIGJ1ZmZlckNsb25lKGJ1ZmZlcikge1xuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5QnVmZmVyKGJ1ZmZlci5ieXRlTGVuZ3RoKSxcbiAgICAgIHZpZXcgPSBuZXcgVWludDhBcnJheShyZXN1bHQpO1xuXG4gIHZpZXcuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZmZlcikpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1ZmZlckNsb25lO1xuIiwidmFyIGdldExlbmd0aCA9IHJlcXVpcmUoJy4vZ2V0TGVuZ3RoJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyksXG4gICAgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGBiYXNlRWFjaGAgb3IgYGJhc2VFYWNoUmlnaHRgIGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlYWNoRnVuYyBUaGUgZnVuY3Rpb24gdG8gaXRlcmF0ZSBvdmVyIGEgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Zyb21SaWdodF0gU3BlY2lmeSBpdGVyYXRpbmcgZnJvbSByaWdodCB0byBsZWZ0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYmFzZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQmFzZUVhY2goZWFjaEZ1bmMsIGZyb21SaWdodCkge1xuICByZXR1cm4gZnVuY3Rpb24oY29sbGVjdGlvbiwgaXRlcmF0ZWUpIHtcbiAgICB2YXIgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGdldExlbmd0aChjb2xsZWN0aW9uKSA6IDA7XG4gICAgaWYgKCFpc0xlbmd0aChsZW5ndGgpKSB7XG4gICAgICByZXR1cm4gZWFjaEZ1bmMoY29sbGVjdGlvbiwgaXRlcmF0ZWUpO1xuICAgIH1cbiAgICB2YXIgaW5kZXggPSBmcm9tUmlnaHQgPyBsZW5ndGggOiAtMSxcbiAgICAgICAgaXRlcmFibGUgPSB0b09iamVjdChjb2xsZWN0aW9uKTtcblxuICAgIHdoaWxlICgoZnJvbVJpZ2h0ID8gaW5kZXgtLSA6ICsraW5kZXggPCBsZW5ndGgpKSB7XG4gICAgICBpZiAoaXRlcmF0ZWUoaXRlcmFibGVbaW5kZXhdLCBpbmRleCwgaXRlcmFibGUpID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQmFzZUVhY2g7XG4iLCJ2YXIgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGJhc2UgZnVuY3Rpb24gZm9yIGBfLmZvckluYCBvciBgXy5mb3JJblJpZ2h0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBiYXNlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVCYXNlRm9yKGZyb21SaWdodCkge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0LCBpdGVyYXRlZSwga2V5c0Z1bmMpIHtcbiAgICB2YXIgaXRlcmFibGUgPSB0b09iamVjdChvYmplY3QpLFxuICAgICAgICBwcm9wcyA9IGtleXNGdW5jKG9iamVjdCksXG4gICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgICAgaW5kZXggPSBmcm9tUmlnaHQgPyBsZW5ndGggOiAtMTtcblxuICAgIHdoaWxlICgoZnJvbVJpZ2h0ID8gaW5kZXgtLSA6ICsraW5kZXggPCBsZW5ndGgpKSB7XG4gICAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgICAgaWYgKGl0ZXJhdGVlKGl0ZXJhYmxlW2tleV0sIGtleSwgaXRlcmFibGUpID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVCYXNlRm9yO1xuIiwidmFyIGJpbmRDYWxsYmFjayA9IHJlcXVpcmUoJy4vYmluZENhbGxiYWNrJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiBmb3IgYF8uZm9yRWFjaGAgb3IgYF8uZm9yRWFjaFJpZ2h0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gYXJyYXlGdW5jIFRoZSBmdW5jdGlvbiB0byBpdGVyYXRlIG92ZXIgYW4gYXJyYXkuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlYWNoRnVuYyBUaGUgZnVuY3Rpb24gdG8gaXRlcmF0ZSBvdmVyIGEgY29sbGVjdGlvbi5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGVhY2ggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUZvckVhY2goYXJyYXlGdW5jLCBlYWNoRnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24oY29sbGVjdGlvbiwgaXRlcmF0ZWUsIHRoaXNBcmcpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBpdGVyYXRlZSA9PSAnZnVuY3Rpb24nICYmIHRoaXNBcmcgPT09IHVuZGVmaW5lZCAmJiBpc0FycmF5KGNvbGxlY3Rpb24pKVxuICAgICAgPyBhcnJheUZ1bmMoY29sbGVjdGlvbiwgaXRlcmF0ZWUpXG4gICAgICA6IGVhY2hGdW5jKGNvbGxlY3Rpb24sIGJpbmRDYWxsYmFjayhpdGVyYXRlZSwgdGhpc0FyZywgMykpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUZvckVhY2g7XG4iLCJ2YXIgYmluZENhbGxiYWNrID0gcmVxdWlyZSgnLi9iaW5kQ2FsbGJhY2snKSxcbiAgICBrZXlzSW4gPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5c0luJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIGZvciBgXy5mb3JJbmAgb3IgYF8uZm9ySW5SaWdodGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9iamVjdEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgb3ZlciBhbiBvYmplY3QuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBlYWNoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVGb3JJbihvYmplY3RGdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QsIGl0ZXJhdGVlLCB0aGlzQXJnKSB7XG4gICAgaWYgKHR5cGVvZiBpdGVyYXRlZSAhPSAnZnVuY3Rpb24nIHx8IHRoaXNBcmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaXRlcmF0ZWUgPSBiaW5kQ2FsbGJhY2soaXRlcmF0ZWUsIHRoaXNBcmcsIDMpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0RnVuYyhvYmplY3QsIGl0ZXJhdGVlLCBrZXlzSW4pO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUZvckluO1xuIiwidmFyIGJpbmRDYWxsYmFjayA9IHJlcXVpcmUoJy4vYmluZENhbGxiYWNrJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIGZvciBgXy5mb3JPd25gIG9yIGBfLmZvck93blJpZ2h0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gb2JqZWN0RnVuYyBUaGUgZnVuY3Rpb24gdG8gaXRlcmF0ZSBvdmVyIGFuIG9iamVjdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGVhY2ggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUZvck93bihvYmplY3RGdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QsIGl0ZXJhdGVlLCB0aGlzQXJnKSB7XG4gICAgaWYgKHR5cGVvZiBpdGVyYXRlZSAhPSAnZnVuY3Rpb24nIHx8IHRoaXNBcmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaXRlcmF0ZWUgPSBiaW5kQ2FsbGJhY2soaXRlcmF0ZWUsIHRoaXNBcmcsIDMpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0RnVuYyhvYmplY3QsIGl0ZXJhdGVlKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVGb3JPd247XG4iLCJ2YXIgYmFzZVByb3BlcnR5ID0gcmVxdWlyZSgnLi9iYXNlUHJvcGVydHknKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBcImxlbmd0aFwiIHByb3BlcnR5IHZhbHVlIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gYXZvaWQgYSBbSklUIGJ1Z10oaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE0Mjc5MilcbiAqIHRoYXQgYWZmZWN0cyBTYWZhcmkgb24gYXQgbGVhc3QgaU9TIDguMS04LjMgQVJNNjQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBcImxlbmd0aFwiIHZhbHVlLlxuICovXG52YXIgZ2V0TGVuZ3RoID0gYmFzZVByb3BlcnR5KCdsZW5ndGgnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRMZW5ndGg7XG4iLCJ2YXIgaXNOYXRpdmUgPSByZXF1aXJlKCcuLi9sYW5nL2lzTmF0aXZlJyk7XG5cbi8qKlxuICogR2V0cyB0aGUgbmF0aXZlIGZ1bmN0aW9uIGF0IGBrZXlgIG9mIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIG1ldGhvZCB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZnVuY3Rpb24gaWYgaXQncyBuYXRpdmUsIGVsc2UgYHVuZGVmaW5lZGAuXG4gKi9cbmZ1bmN0aW9uIGdldE5hdGl2ZShvYmplY3QsIGtleSkge1xuICB2YXIgdmFsdWUgPSBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICByZXR1cm4gaXNOYXRpdmUodmFsdWUpID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TmF0aXZlO1xuIiwiLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYW4gYXJyYXkgY2xvbmUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBjbG9uZS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgaW5pdGlhbGl6ZWQgY2xvbmUuXG4gKi9cbmZ1bmN0aW9uIGluaXRDbG9uZUFycmF5KGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICByZXN1bHQgPSBuZXcgYXJyYXkuY29uc3RydWN0b3IobGVuZ3RoKTtcblxuICAvLyBBZGQgYXJyYXkgcHJvcGVydGllcyBhc3NpZ25lZCBieSBgUmVnRXhwI2V4ZWNgLlxuICBpZiAobGVuZ3RoICYmIHR5cGVvZiBhcnJheVswXSA9PSAnc3RyaW5nJyAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGFycmF5LCAnaW5kZXgnKSkge1xuICAgIHJlc3VsdC5pbmRleCA9IGFycmF5LmluZGV4O1xuICAgIHJlc3VsdC5pbnB1dCA9IGFycmF5LmlucHV0O1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdENsb25lQXJyYXk7XG4iLCJ2YXIgYnVmZmVyQ2xvbmUgPSByZXF1aXJlKCcuL2J1ZmZlckNsb25lJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBib29sVGFnID0gJ1tvYmplY3QgQm9vbGVhbl0nLFxuICAgIGRhdGVUYWcgPSAnW29iamVjdCBEYXRlXScsXG4gICAgbnVtYmVyVGFnID0gJ1tvYmplY3QgTnVtYmVyXScsXG4gICAgcmVnZXhwVGFnID0gJ1tvYmplY3QgUmVnRXhwXScsXG4gICAgc3RyaW5nVGFnID0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cbnZhciBhcnJheUJ1ZmZlclRhZyA9ICdbb2JqZWN0IEFycmF5QnVmZmVyXScsXG4gICAgZmxvYXQzMlRhZyA9ICdbb2JqZWN0IEZsb2F0MzJBcnJheV0nLFxuICAgIGZsb2F0NjRUYWcgPSAnW29iamVjdCBGbG9hdDY0QXJyYXldJyxcbiAgICBpbnQ4VGFnID0gJ1tvYmplY3QgSW50OEFycmF5XScsXG4gICAgaW50MTZUYWcgPSAnW29iamVjdCBJbnQxNkFycmF5XScsXG4gICAgaW50MzJUYWcgPSAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgdWludDhUYWcgPSAnW29iamVjdCBVaW50OEFycmF5XScsXG4gICAgdWludDhDbGFtcGVkVGFnID0gJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJyxcbiAgICB1aW50MTZUYWcgPSAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgIHVpbnQzMlRhZyA9ICdbb2JqZWN0IFVpbnQzMkFycmF5XSc7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGBSZWdFeHBgIGZsYWdzIGZyb20gdGhlaXIgY29lcmNlZCBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlRmxhZ3MgPSAvXFx3KiQvO1xuXG4vKipcbiAqIEluaXRpYWxpemVzIGFuIG9iamVjdCBjbG9uZSBiYXNlZCBvbiBpdHMgYHRvU3RyaW5nVGFnYC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBvbmx5IHN1cHBvcnRzIGNsb25pbmcgdmFsdWVzIHdpdGggdGFncyBvZlxuICogYEJvb2xlYW5gLCBgRGF0ZWAsIGBFcnJvcmAsIGBOdW1iZXJgLCBgUmVnRXhwYCwgb3IgYFN0cmluZ2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBjbG9uZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGB0b1N0cmluZ1RhZ2Agb2YgdGhlIG9iamVjdCB0byBjbG9uZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRGVlcF0gU3BlY2lmeSBhIGRlZXAgY2xvbmUuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBpbml0aWFsaXplZCBjbG9uZS5cbiAqL1xuZnVuY3Rpb24gaW5pdENsb25lQnlUYWcob2JqZWN0LCB0YWcsIGlzRGVlcCkge1xuICB2YXIgQ3RvciA9IG9iamVjdC5jb25zdHJ1Y3RvcjtcbiAgc3dpdGNoICh0YWcpIHtcbiAgICBjYXNlIGFycmF5QnVmZmVyVGFnOlxuICAgICAgcmV0dXJuIGJ1ZmZlckNsb25lKG9iamVjdCk7XG5cbiAgICBjYXNlIGJvb2xUYWc6XG4gICAgY2FzZSBkYXRlVGFnOlxuICAgICAgcmV0dXJuIG5ldyBDdG9yKCtvYmplY3QpO1xuXG4gICAgY2FzZSBmbG9hdDMyVGFnOiBjYXNlIGZsb2F0NjRUYWc6XG4gICAgY2FzZSBpbnQ4VGFnOiBjYXNlIGludDE2VGFnOiBjYXNlIGludDMyVGFnOlxuICAgIGNhc2UgdWludDhUYWc6IGNhc2UgdWludDhDbGFtcGVkVGFnOiBjYXNlIHVpbnQxNlRhZzogY2FzZSB1aW50MzJUYWc6XG4gICAgICB2YXIgYnVmZmVyID0gb2JqZWN0LmJ1ZmZlcjtcbiAgICAgIHJldHVybiBuZXcgQ3Rvcihpc0RlZXAgPyBidWZmZXJDbG9uZShidWZmZXIpIDogYnVmZmVyLCBvYmplY3QuYnl0ZU9mZnNldCwgb2JqZWN0Lmxlbmd0aCk7XG5cbiAgICBjYXNlIG51bWJlclRhZzpcbiAgICBjYXNlIHN0cmluZ1RhZzpcbiAgICAgIHJldHVybiBuZXcgQ3RvcihvYmplY3QpO1xuXG4gICAgY2FzZSByZWdleHBUYWc6XG4gICAgICB2YXIgcmVzdWx0ID0gbmV3IEN0b3Iob2JqZWN0LnNvdXJjZSwgcmVGbGFncy5leGVjKG9iamVjdCkpO1xuICAgICAgcmVzdWx0Lmxhc3RJbmRleCA9IG9iamVjdC5sYXN0SW5kZXg7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbml0Q2xvbmVCeVRhZztcbiIsIi8qKlxuICogSW5pdGlhbGl6ZXMgYW4gb2JqZWN0IGNsb25lLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gY2xvbmUuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBpbml0aWFsaXplZCBjbG9uZS5cbiAqL1xuZnVuY3Rpb24gaW5pdENsb25lT2JqZWN0KG9iamVjdCkge1xuICB2YXIgQ3RvciA9IG9iamVjdC5jb25zdHJ1Y3RvcjtcbiAgaWYgKCEodHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yIGluc3RhbmNlb2YgQ3RvcikpIHtcbiAgICBDdG9yID0gT2JqZWN0O1xuICB9XG4gIHJldHVybiBuZXcgQ3Rvcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbml0Q2xvbmVPYmplY3Q7XG4iLCJ2YXIgZ2V0TGVuZ3RoID0gcmVxdWlyZSgnLi9nZXRMZW5ndGgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgaXNMZW5ndGgoZ2V0TGVuZ3RoKHZhbHVlKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheUxpa2U7XG4iLCIvKiogVXNlZCB0byBkZXRlY3QgdW5zaWduZWQgaW50ZWdlciB2YWx1ZXMuICovXG52YXIgcmVJc1VpbnQgPSAvXlxcZCskLztcblxuLyoqXG4gKiBVc2VkIGFzIHRoZSBbbWF4aW11bSBsZW5ndGhdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW51bWJlci5tYXhfc2FmZV9pbnRlZ2VyKVxuICogb2YgYW4gYXJyYXktbGlrZSB2YWx1ZS5cbiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBpbmRleC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD1NQVhfU0FGRV9JTlRFR0VSXSBUaGUgdXBwZXIgYm91bmRzIG9mIGEgdmFsaWQgaW5kZXguXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGluZGV4LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzSW5kZXgodmFsdWUsIGxlbmd0aCkge1xuICB2YWx1ZSA9ICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgfHwgcmVJc1VpbnQudGVzdCh2YWx1ZSkpID8gK3ZhbHVlIDogLTE7XG4gIGxlbmd0aCA9IGxlbmd0aCA9PSBudWxsID8gTUFYX1NBRkVfSU5URUdFUiA6IGxlbmd0aDtcbiAgcmV0dXJuIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPCBsZW5ndGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNJbmRleDtcbiIsIi8qKlxuICogVXNlZCBhcyB0aGUgW21heGltdW0gbGVuZ3RoXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1udW1iZXIubWF4X3NhZmVfaW50ZWdlcilcbiAqIG9mIGFuIGFycmF5LWxpa2UgdmFsdWUuXG4gKi9cbnZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgbGVuZ3RoLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIGJhc2VkIG9uIFtgVG9MZW5ndGhgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10b2xlbmd0aCkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBsZW5ndGgsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNMZW5ndGgodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJiB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDw9IE1BWF9TQUZFX0lOVEVHRVI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNMZW5ndGg7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3RMaWtlO1xuIiwidmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FyZ3VtZW50cycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc0luZGV4ID0gcmVxdWlyZSgnLi9pc0luZGV4JyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyksXG4gICAga2V5c0luID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXNJbicpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBBIGZhbGxiYWNrIGltcGxlbWVudGF0aW9uIG9mIGBPYmplY3Qua2V5c2Agd2hpY2ggY3JlYXRlcyBhbiBhcnJheSBvZiB0aGVcbiAqIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICovXG5mdW5jdGlvbiBzaGltS2V5cyhvYmplY3QpIHtcbiAgdmFyIHByb3BzID0ga2V5c0luKG9iamVjdCksXG4gICAgICBwcm9wc0xlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgIGxlbmd0aCA9IHByb3BzTGVuZ3RoICYmIG9iamVjdC5sZW5ndGg7XG5cbiAgdmFyIGFsbG93SW5kZXhlcyA9ICEhbGVuZ3RoICYmIGlzTGVuZ3RoKGxlbmd0aCkgJiZcbiAgICAoaXNBcnJheShvYmplY3QpIHx8IGlzQXJndW1lbnRzKG9iamVjdCkpO1xuXG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgcmVzdWx0ID0gW107XG5cbiAgd2hpbGUgKCsraW5kZXggPCBwcm9wc0xlbmd0aCkge1xuICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgaWYgKChhbGxvd0luZGV4ZXMgJiYgaXNJbmRleChrZXksIGxlbmd0aCkpIHx8IGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNoaW1LZXlzO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYW4gb2JqZWN0IGlmIGl0J3Mgbm90IG9uZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gdG9PYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHZhbHVlKSA/IHZhbHVlIDogT2JqZWN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b09iamVjdDtcbiIsInZhciBiYXNlQ2xvbmUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlQ2xvbmUnKSxcbiAgICBiaW5kQ2FsbGJhY2sgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iaW5kQ2FsbGJhY2snKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZGVlcCBjbG9uZSBvZiBgdmFsdWVgLiBJZiBgY3VzdG9taXplcmAgaXMgcHJvdmlkZWQgaXQncyBpbnZva2VkXG4gKiB0byBwcm9kdWNlIHRoZSBjbG9uZWQgdmFsdWVzLiBJZiBgY3VzdG9taXplcmAgcmV0dXJucyBgdW5kZWZpbmVkYCBjbG9uaW5nXG4gKiBpcyBoYW5kbGVkIGJ5IHRoZSBtZXRob2QgaW5zdGVhZC4gVGhlIGBjdXN0b21pemVyYCBpcyBib3VuZCB0byBgdGhpc0FyZ2BcbiAqIGFuZCBpbnZva2VkIHdpdGggdXAgdG8gdGhyZWUgYXJndW1lbnQ7ICh2YWx1ZSBbLCBpbmRleHxrZXksIG9iamVjdF0pLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBsb29zZWx5IGJhc2VkIG9uIHRoZVxuICogW3N0cnVjdHVyZWQgY2xvbmUgYWxnb3JpdGhtXShodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sNS9pbmZyYXN0cnVjdHVyZS5odG1sI2ludGVybmFsLXN0cnVjdHVyZWQtY2xvbmluZy1hbGdvcml0aG0pLlxuICogVGhlIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBgYXJndW1lbnRzYCBvYmplY3RzIGFuZCBvYmplY3RzIGNyZWF0ZWQgYnlcbiAqIGNvbnN0cnVjdG9ycyBvdGhlciB0aGFuIGBPYmplY3RgIGFyZSBjbG9uZWQgdG8gcGxhaW4gYE9iamVjdGAgb2JqZWN0cy4gQW5cbiAqIGVtcHR5IG9iamVjdCBpcyByZXR1cm5lZCBmb3IgdW5jbG9uZWFibGUgdmFsdWVzIHN1Y2ggYXMgZnVuY3Rpb25zLCBET00gbm9kZXMsXG4gKiBNYXBzLCBTZXRzLCBhbmQgV2Vha01hcHMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBkZWVwIGNsb25lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY2xvbmluZyB2YWx1ZXMuXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGN1c3RvbWl6ZXJgLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGRlZXAgY2xvbmVkIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgdXNlcnMgPSBbXG4gKiAgIHsgJ3VzZXInOiAnYmFybmV5JyB9LFxuICogICB7ICd1c2VyJzogJ2ZyZWQnIH1cbiAqIF07XG4gKlxuICogdmFyIGRlZXAgPSBfLmNsb25lRGVlcCh1c2Vycyk7XG4gKiBkZWVwWzBdID09PSB1c2Vyc1swXTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogLy8gdXNpbmcgYSBjdXN0b21pemVyIGNhbGxiYWNrXG4gKiB2YXIgZWwgPSBfLmNsb25lRGVlcChkb2N1bWVudC5ib2R5LCBmdW5jdGlvbih2YWx1ZSkge1xuICogICBpZiAoXy5pc0VsZW1lbnQodmFsdWUpKSB7XG4gKiAgICAgcmV0dXJuIHZhbHVlLmNsb25lTm9kZSh0cnVlKTtcbiAqICAgfVxuICogfSk7XG4gKlxuICogZWwgPT09IGRvY3VtZW50LmJvZHlcbiAqIC8vID0+IGZhbHNlXG4gKiBlbC5ub2RlTmFtZVxuICogLy8gPT4gQk9EWVxuICogZWwuY2hpbGROb2Rlcy5sZW5ndGg7XG4gKiAvLyA9PiAyMFxuICovXG5mdW5jdGlvbiBjbG9uZURlZXAodmFsdWUsIGN1c3RvbWl6ZXIsIHRoaXNBcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBjdXN0b21pemVyID09ICdmdW5jdGlvbidcbiAgICA/IGJhc2VDbG9uZSh2YWx1ZSwgdHJ1ZSwgYmluZENhbGxiYWNrKGN1c3RvbWl6ZXIsIHRoaXNBcmcsIDMpKVxuICAgIDogYmFzZUNsb25lKHZhbHVlLCB0cnVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZURlZXA7XG4iLCJ2YXIgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0FycmF5TGlrZScpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBwcm9wZXJ0eUlzRW51bWVyYWJsZSA9IG9iamVjdFByb3RvLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcmd1bWVudHMoWzEsIDIsIDNdKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzQXJyYXlMaWtlKHZhbHVlKSAmJlxuICAgIGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdjYWxsZWUnKSAmJiAhcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJndW1lbnRzO1xuIiwidmFyIGdldE5hdGl2ZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2dldE5hdGl2ZScpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNMZW5ndGgnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9ialRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlSXNBcnJheSA9IGdldE5hdGl2ZShBcnJheSwgJ2lzQXJyYXknKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBBcnJheWAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXkoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNMZW5ndGgodmFsdWUubGVuZ3RoKSAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBhcnJheVRhZztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheTtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIGFuZCBTYWZhcmkgd2hpY2ggcmV0dXJuICdmdW5jdGlvbicgZm9yIHJlZ2V4ZXNcbiAgLy8gYW5kIFNhZmFyaSA4IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycy5cbiAgcmV0dXJuIGlzT2JqZWN0KHZhbHVlKSAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBmdW5jVGFnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRnVuY3Rpb247XG4iLCJ2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vaXNGdW5jdGlvbicpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaG9zdCBjb25zdHJ1Y3RvcnMgKFNhZmFyaSA+IDUpLiAqL1xudmFyIHJlSXNIb3N0Q3RvciA9IC9eXFxbb2JqZWN0IC4rP0NvbnN0cnVjdG9yXFxdJC87XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZm5Ub1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZS4gKi9cbnZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gIGZuVG9TdHJpbmcuY2FsbChoYXNPd25Qcm9wZXJ0eSkucmVwbGFjZSgvW1xcXFxeJC4qKz8oKVtcXF17fXxdL2csICdcXFxcJCYnKVxuICAucmVwbGFjZSgvaGFzT3duUHJvcGVydHl8KGZ1bmN0aW9uKS4qPyg/PVxcXFxcXCgpfCBmb3IgLis/KD89XFxcXFxcXSkvZywgJyQxLio/JykgKyAnJCdcbik7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNOYXRpdmUoQXJyYXkucHJvdG90eXBlLnB1c2gpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNOYXRpdmUoXyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc05hdGl2ZSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICByZXR1cm4gcmVJc05hdGl2ZS50ZXN0KGZuVG9TdHJpbmcuY2FsbCh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIHJlSXNIb3N0Q3Rvci50ZXN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc05hdGl2ZTtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIFtsYW5ndWFnZSB0eXBlXShodHRwczovL2VzNS5naXRodWIuaW8vI3g4KSBvZiBgT2JqZWN0YC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoMSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxuICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGB1bmRlZmluZWRgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBgdW5kZWZpbmVkYCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzVW5kZWZpbmVkKHZvaWQgMCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1VuZGVmaW5lZChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVW5kZWZpbmVkO1xuIiwidmFyIGJhc2VGb3IgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlRm9yJyksXG4gICAgY3JlYXRlRm9ySW4gPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9jcmVhdGVGb3JJbicpO1xuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgb3duIGFuZCBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIGFuIG9iamVjdCBpbnZva2luZ1xuICogYGl0ZXJhdGVlYCBmb3IgZWFjaCBwcm9wZXJ0eS4gVGhlIGBpdGVyYXRlZWAgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkXG4gKiB3aXRoIHRocmVlIGFyZ3VtZW50czogKHZhbHVlLCBrZXksIG9iamVjdCkuIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdFxuICogaXRlcmF0aW9uIGVhcmx5IGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbaXRlcmF0ZWU9Xy5pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgaXRlcmF0ZWVgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogICB0aGlzLmIgPSAyO1xuICogfVxuICpcbiAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gKlxuICogXy5mb3JJbihuZXcgRm9vLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gKiAgIGNvbnNvbGUubG9nKGtleSk7XG4gKiB9KTtcbiAqIC8vID0+IGxvZ3MgJ2EnLCAnYicsIGFuZCAnYycgKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xudmFyIGZvckluID0gY3JlYXRlRm9ySW4oYmFzZUZvcik7XG5cbm1vZHVsZS5leHBvcnRzID0gZm9ySW47XG4iLCJ2YXIgYmFzZUZvck93biA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VGb3JPd24nKSxcbiAgICBjcmVhdGVGb3JPd24gPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9jcmVhdGVGb3JPd24nKTtcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgYW4gb2JqZWN0IGludm9raW5nIGBpdGVyYXRlZWBcbiAqIGZvciBlYWNoIHByb3BlcnR5LiBUaGUgYGl0ZXJhdGVlYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aFxuICogdGhyZWUgYXJndW1lbnRzOiAodmFsdWUsIGtleSwgb2JqZWN0KS4gSXRlcmF0ZWUgZnVuY3Rpb25zIG1heSBleGl0IGl0ZXJhdGlvblxuICogZWFybHkgYnkgZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBpdGVyYXRlZWAuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiAgIHRoaXMuYiA9IDI7XG4gKiB9XG4gKlxuICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAqXG4gKiBfLmZvck93bihuZXcgRm9vLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gKiAgIGNvbnNvbGUubG9nKGtleSk7XG4gKiB9KTtcbiAqIC8vID0+IGxvZ3MgJ2EnIGFuZCAnYicgKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xudmFyIGZvck93biA9IGNyZWF0ZUZvck93bihiYXNlRm9yT3duKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmb3JPd247XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvZ2V0TmF0aXZlJyksXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0FycmF5TGlrZScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpLFxuICAgIHNoaW1LZXlzID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvc2hpbUtleXMnKTtcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVLZXlzID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2tleXMnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIHRoZSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogTm9uLW9iamVjdCB2YWx1ZXMgYXJlIGNvZXJjZWQgdG8gb2JqZWN0cy4gU2VlIHRoZVxuICogW0VTIHNwZWNdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5rZXlzKVxuICogZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogICB0aGlzLmIgPSAyO1xuICogfVxuICpcbiAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gKlxuICogXy5rZXlzKG5ldyBGb28pO1xuICogLy8gPT4gWydhJywgJ2InXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICpcbiAqIF8ua2V5cygnaGknKTtcbiAqIC8vID0+IFsnMCcsICcxJ11cbiAqL1xudmFyIGtleXMgPSAhbmF0aXZlS2V5cyA/IHNoaW1LZXlzIDogZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHZhciBDdG9yID0gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3QuY29uc3RydWN0b3I7XG4gIGlmICgodHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yLnByb3RvdHlwZSA9PT0gb2JqZWN0KSB8fFxuICAgICAgKHR5cGVvZiBvYmplY3QgIT0gJ2Z1bmN0aW9uJyAmJiBpc0FycmF5TGlrZShvYmplY3QpKSkge1xuICAgIHJldHVybiBzaGltS2V5cyhvYmplY3QpO1xuICB9XG4gIHJldHVybiBpc09iamVjdChvYmplY3QpID8gbmF0aXZlS2V5cyhvYmplY3QpIDogW107XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXM7XG4iLCJ2YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzSW5kZXggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0luZGV4JyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0xlbmd0aCcpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIHRoZSBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBOb24tb2JqZWN0IHZhbHVlcyBhcmUgY29lcmNlZCB0byBvYmplY3RzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiAgIHRoaXMuYiA9IDI7XG4gKiB9XG4gKlxuICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAqXG4gKiBfLmtleXNJbihuZXcgRm9vKTtcbiAqIC8vID0+IFsnYScsICdiJywgJ2MnXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICovXG5mdW5jdGlvbiBrZXlzSW4ob2JqZWN0KSB7XG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICBvYmplY3QgPSBPYmplY3Qob2JqZWN0KTtcbiAgfVxuICB2YXIgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDtcbiAgbGVuZ3RoID0gKGxlbmd0aCAmJiBpc0xlbmd0aChsZW5ndGgpICYmXG4gICAgKGlzQXJyYXkob2JqZWN0KSB8fCBpc0FyZ3VtZW50cyhvYmplY3QpKSAmJiBsZW5ndGgpIHx8IDA7XG5cbiAgdmFyIEN0b3IgPSBvYmplY3QuY29uc3RydWN0b3IsXG4gICAgICBpbmRleCA9IC0xLFxuICAgICAgaXNQcm90byA9IHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3Rvci5wcm90b3R5cGUgPT09IG9iamVjdCxcbiAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCksXG4gICAgICBza2lwSW5kZXhlcyA9IGxlbmd0aCA+IDA7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gKGluZGV4ICsgJycpO1xuICB9XG4gIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICBpZiAoIShza2lwSW5kZXhlcyAmJiBpc0luZGV4KGtleSwgbGVuZ3RoKSkgJiZcbiAgICAgICAgIShrZXkgPT0gJ2NvbnN0cnVjdG9yJyAmJiAoaXNQcm90byB8fCAhaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpKSkge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzSW47XG4iLCIvKipcbiAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGZpcnN0IGFyZ3VtZW50IHByb3ZpZGVkIHRvIGl0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgVXRpbGl0eVxuICogQHBhcmFtIHsqfSB2YWx1ZSBBbnkgdmFsdWUuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyBgdmFsdWVgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAndXNlcic6ICdmcmVkJyB9O1xuICpcbiAqIF8uaWRlbnRpdHkob2JqZWN0KSA9PT0gb2JqZWN0O1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBpZGVudGl0eSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaWRlbnRpdHk7XG4iLCIvKipcbiAqIFN0YW1waXRcbiAqKlxuICogQ3JlYXRlIG9iamVjdHMgZnJvbSByZXVzYWJsZSwgY29tcG9zYWJsZSBiZWhhdmlvcnMuXG4gKipcbiAqIENvcHlyaWdodCAoYykgMjAxMyBFcmljIEVsbGlvdHRcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAqKi9cbid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uRm9yRWFjaCA9IHJlcXVpcmUoJ2xvZGFzaC9jb2xsZWN0aW9uL2ZvckVhY2gnKTtcblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uRm9yRWFjaDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hDb2xsZWN0aW9uRm9yRWFjaCk7XG5cbnZhciBfbG9kYXNoTGFuZ0lzRnVuY3Rpb24gPSByZXF1aXJlKCdsb2Rhc2gvbGFuZy9pc0Z1bmN0aW9uJyk7XG5cbnZhciBfbG9kYXNoTGFuZ0lzRnVuY3Rpb24yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoTGFuZ0lzRnVuY3Rpb24pO1xuXG52YXIgX2xvZGFzaExhbmdJc09iamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC9sYW5nL2lzT2JqZWN0Jyk7XG5cbnZhciBfbG9kYXNoTGFuZ0lzT2JqZWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZGFzaExhbmdJc09iamVjdCk7XG5cbnZhciBfc3VwZXJtaXhlciA9IHJlcXVpcmUoJ3N1cGVybWl4ZXInKTtcblxudmFyIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG5mdW5jdGlvbiBpc1RoZW5hYmxlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAmJiAoMCwgX2xvZGFzaExhbmdJc0Z1bmN0aW9uMlsnZGVmYXVsdCddKSh2YWx1ZS50aGVuKTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEZ1bmN0aW9ucygpIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgYXJnc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgfVxuXG4gIGlmICgoMCwgX2xvZGFzaExhbmdJc0Z1bmN0aW9uMlsnZGVmYXVsdCddKShhcmdzWzBdKSkge1xuICAgICgwLCBfbG9kYXNoQ29sbGVjdGlvbkZvckVhY2gyWydkZWZhdWx0J10pKGFyZ3MsIGZ1bmN0aW9uIChmbikge1xuICAgICAgLy8gYXNzdW1pbmcgYWxsIHRoZSBhcmd1bWVudHMgYXJlIGZ1bmN0aW9uc1xuICAgICAgaWYgKCgwLCBfbG9kYXNoTGFuZ0lzRnVuY3Rpb24yWydkZWZhdWx0J10pKGZuKSkge1xuICAgICAgICByZXN1bHQucHVzaChmbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoKDAsIF9sb2Rhc2hMYW5nSXNPYmplY3QyWydkZWZhdWx0J10pKGFyZ3NbMF0pKSB7XG4gICAgKDAsIF9sb2Rhc2hDb2xsZWN0aW9uRm9yRWFjaDJbJ2RlZmF1bHQnXSkoYXJncywgZnVuY3Rpb24gKG9iaikge1xuICAgICAgKDAsIF9sb2Rhc2hDb2xsZWN0aW9uRm9yRWFjaDJbJ2RlZmF1bHQnXSkob2JqLCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgaWYgKCgwLCBfbG9kYXNoTGFuZ0lzRnVuY3Rpb24yWydkZWZhdWx0J10pKGZuKSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGZuKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gYWRkTWV0aG9kcyhmaXhlZCkge1xuICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIG1ldGhvZHMgPSBBcnJheShfbGVuMiA+IDEgPyBfbGVuMiAtIDEgOiAwKSwgX2tleTIgPSAxOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgbWV0aG9kc1tfa2V5MiAtIDFdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgfVxuXG4gIHJldHVybiBfc3VwZXJtaXhlci5taXhpbkZ1bmN0aW9ucy5hcHBseSh1bmRlZmluZWQsIFtmaXhlZC5tZXRob2RzXS5jb25jYXQobWV0aG9kcykpO1xufVxuZnVuY3Rpb24gYWRkUmVmcyhmaXhlZCkge1xuICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIHJlZnMgPSBBcnJheShfbGVuMyA+IDEgPyBfbGVuMyAtIDEgOiAwKSwgX2tleTMgPSAxOyBfa2V5MyA8IF9sZW4zOyBfa2V5MysrKSB7XG4gICAgcmVmc1tfa2V5MyAtIDFdID0gYXJndW1lbnRzW19rZXkzXTtcbiAgfVxuXG4gIGZpeGVkLnJlZnMgPSBmaXhlZC5zdGF0ZSA9IF9zdXBlcm1peGVyLm1peGluLmFwcGx5KHVuZGVmaW5lZCwgW2ZpeGVkLnJlZnNdLmNvbmNhdChyZWZzKSk7XG4gIHJldHVybiBmaXhlZC5yZWZzO1xufVxuZnVuY3Rpb24gYWRkSW5pdChmaXhlZCkge1xuICBmb3IgKHZhciBfbGVuNCA9IGFyZ3VtZW50cy5sZW5ndGgsIGluaXRzID0gQXJyYXkoX2xlbjQgPiAxID8gX2xlbjQgLSAxIDogMCksIF9rZXk0ID0gMTsgX2tleTQgPCBfbGVuNDsgX2tleTQrKykge1xuICAgIGluaXRzW19rZXk0IC0gMV0gPSBhcmd1bWVudHNbX2tleTRdO1xuICB9XG5cbiAgdmFyIGV4dHJhY3RlZEluaXRzID0gZXh0cmFjdEZ1bmN0aW9ucy5hcHBseSh1bmRlZmluZWQsIGluaXRzKTtcbiAgZml4ZWQuaW5pdCA9IGZpeGVkLmVuY2xvc2UgPSBmaXhlZC5pbml0LmNvbmNhdChleHRyYWN0ZWRJbml0cyk7XG4gIHJldHVybiBmaXhlZC5pbml0O1xufVxuZnVuY3Rpb24gYWRkUHJvcHMoZml4ZWQpIHtcbiAgZm9yICh2YXIgX2xlbjUgPSBhcmd1bWVudHMubGVuZ3RoLCBwcm9wc2VzID0gQXJyYXkoX2xlbjUgPiAxID8gX2xlbjUgLSAxIDogMCksIF9rZXk1ID0gMTsgX2tleTUgPCBfbGVuNTsgX2tleTUrKykge1xuICAgIHByb3BzZXNbX2tleTUgLSAxXSA9IGFyZ3VtZW50c1tfa2V5NV07XG4gIH1cblxuICByZXR1cm4gX3N1cGVybWl4ZXIubWVyZ2UuYXBwbHkodW5kZWZpbmVkLCBbZml4ZWQucHJvcHNdLmNvbmNhdChwcm9wc2VzKSk7XG59XG5mdW5jdGlvbiBhZGRTdGF0aWMoZml4ZWQpIHtcbiAgZm9yICh2YXIgX2xlbjYgPSBhcmd1bWVudHMubGVuZ3RoLCBzdGF0aWNzID0gQXJyYXkoX2xlbjYgPiAxID8gX2xlbjYgLSAxIDogMCksIF9rZXk2ID0gMTsgX2tleTYgPCBfbGVuNjsgX2tleTYrKykge1xuICAgIHN0YXRpY3NbX2tleTYgLSAxXSA9IGFyZ3VtZW50c1tfa2V5Nl07XG4gIH1cblxuICByZXR1cm4gX3N1cGVybWl4ZXIubWl4aW4uYXBwbHkodW5kZWZpbmVkLCBbZml4ZWRbJ3N0YXRpYyddXS5jb25jYXQoc3RhdGljcykpO1xufVxuXG5mdW5jdGlvbiBjbG9uZUFuZEV4dGVuZChmaXhlZCwgZXh0ZW5zaW9uRnVuY3Rpb24pIHtcbiAgdmFyIHN0YW1wID0gc3RhbXBpdChmaXhlZCk7XG5cbiAgZm9yICh2YXIgX2xlbjcgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbjcgPiAyID8gX2xlbjcgLSAyIDogMCksIF9rZXk3ID0gMjsgX2tleTcgPCBfbGVuNzsgX2tleTcrKykge1xuICAgIGFyZ3NbX2tleTcgLSAyXSA9IGFyZ3VtZW50c1tfa2V5N107XG4gIH1cblxuICBleHRlbnNpb25GdW5jdGlvbi5hcHBseSh1bmRlZmluZWQsIFtzdGFtcC5maXhlZF0uY29uY2F0KGFyZ3MpKTtcbiAgcmV0dXJuIHN0YW1wO1xufVxuXG5mdW5jdGlvbiBfY29tcG9zZSgpIHtcbiAgdmFyIHJlc3VsdCA9IHN0YW1waXQoKTtcblxuICBmb3IgKHZhciBfbGVuOCA9IGFyZ3VtZW50cy5sZW5ndGgsIGZhY3RvcmllcyA9IEFycmF5KF9sZW44KSwgX2tleTggPSAwOyBfa2V5OCA8IF9sZW44OyBfa2V5OCsrKSB7XG4gICAgZmFjdG9yaWVzW19rZXk4XSA9IGFyZ3VtZW50c1tfa2V5OF07XG4gIH1cblxuICAoMCwgX2xvZGFzaENvbGxlY3Rpb25Gb3JFYWNoMlsnZGVmYXVsdCddKShmYWN0b3JpZXMsIGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlICYmIHNvdXJjZS5maXhlZCkge1xuICAgICAgYWRkTWV0aG9kcyhyZXN1bHQuZml4ZWQsIHNvdXJjZS5maXhlZC5tZXRob2RzKTtcbiAgICAgIC8vIFdlIG1pZ2h0IGVuZCB1cCBoYXZpbmcgdHdvIGRpZmZlcmVudCBzdGFtcGl0IG1vZHVsZXMgbG9hZGVkIGFuZCB1c2VkIGluIGNvbmp1bmN0aW9uLlxuICAgICAgLy8gVGhlc2UgfHwgb3BlcmF0b3JzIGVuc3VyZSB0aGF0IG9sZCBzdGFtcHMgY291bGQgYmUgY29tYmluZWQgd2l0aCB0aGUgY3VycmVudCB2ZXJzaW9uIHN0YW1wcy5cbiAgICAgIC8vICdzdGF0ZScgaXMgdGhlIG9sZCBuYW1lIGZvciAncmVmcydcbiAgICAgIGFkZFJlZnMocmVzdWx0LmZpeGVkLCBzb3VyY2UuZml4ZWQucmVmcyB8fCBzb3VyY2UuZml4ZWQuc3RhdGUpO1xuICAgICAgLy8gJ2VuY2xvc2UnIGlzIHRoZSBvbGQgbmFtZSBmb3IgJ2luaXQnXG4gICAgICBhZGRJbml0KHJlc3VsdC5maXhlZCwgc291cmNlLmZpeGVkLmluaXQgfHwgc291cmNlLmZpeGVkLmVuY2xvc2UpO1xuICAgICAgYWRkUHJvcHMocmVzdWx0LmZpeGVkLCBzb3VyY2UuZml4ZWQucHJvcHMpO1xuICAgICAgYWRkU3RhdGljKHJlc3VsdC5maXhlZCwgc291cmNlLmZpeGVkWydzdGF0aWMnXSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuICgwLCBfc3VwZXJtaXhlci5taXhpbikocmVzdWx0LCByZXN1bHQuZml4ZWRbJ3N0YXRpYyddKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBmYWN0b3J5IGZ1bmN0aW9uIHRoYXQgd2lsbCBwcm9kdWNlIG5ldyBvYmplY3RzIHVzaW5nIHRoZVxuICogY29tcG9uZW50cyB0aGF0IGFyZSBwYXNzZWQgaW4gb3IgY29tcG9zZWQuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9ucyB0byBidWlsZCBzdGFtcCBmcm9tOiBgeyBtZXRob2RzLCByZWZzLCBpbml0LCBwcm9wcyB9YFxuICogQHBhcmFtICB7T2JqZWN0fSBbb3B0aW9ucy5tZXRob2RzXSBBIG1hcCBvZiBtZXRob2QgbmFtZXMgYW5kIGJvZGllcyBmb3IgZGVsZWdhdGlvbi5cbiAqIEBwYXJhbSAge09iamVjdH0gW29wdGlvbnMucmVmc10gQSBtYXAgb2YgcHJvcGVydHkgbmFtZXMgYW5kIHZhbHVlcyB0byBiZSBtaXhlZCBpbnRvIGVhY2ggbmV3IG9iamVjdC5cbiAqIEBwYXJhbSAge09iamVjdH0gW29wdGlvbnMuaW5pdF0gQSBjbG9zdXJlIChmdW5jdGlvbikgdXNlZCB0byBjcmVhdGUgcHJpdmF0ZSBkYXRhIGFuZCBwcml2aWxlZ2VkIG1ldGhvZHMuXG4gKiBAcGFyYW0gIHtPYmplY3R9IFtvcHRpb25zLnByb3BzXSBBbiBvYmplY3QgdG8gYmUgZGVlcGx5IGNsb25lZCBpbnRvIGVhY2ggbmV3bHkgc3RhbXBlZCBvYmplY3QuXG4gKiBAcGFyYW0gIHtPYmplY3R9IFtvcHRpb25zLnN0YXRpY10gQW4gb2JqZWN0IHRvIGJlIG1peGVkIGludG8gZWFjaCBgdGhpc2AgYW5kIGRlcml2ZWQgc3RhbXBzIChub3Qgb2JqZWN0cyEpLlxuICogQHJldHVybiB7RnVuY3Rpb24ocmVmcyl9IGZhY3RvcnkgQSBmYWN0b3J5IHRvIHByb2R1Y2Ugb2JqZWN0cy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9uKHJlZnMpfSBmYWN0b3J5LmNyZWF0ZSBKdXN0IGxpa2UgY2FsbGluZyB0aGUgZmFjdG9yeSBmdW5jdGlvbi5cbiAqIEByZXR1cm4ge09iamVjdH0gZmFjdG9yeS5maXhlZCBBbiBvYmplY3QgbWFwIGNvbnRhaW5pbmcgdGhlIHN0YW1wIGNvbXBvbmVudHMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbihtZXRob2RzKX0gZmFjdG9yeS5tZXRob2RzIEFkZCBtZXRob2RzIHRvIHRoZSBzdGFtcC4gQ2hhaW5hYmxlLlxuICogQHJldHVybiB7RnVuY3Rpb24ocmVmcyl9IGZhY3RvcnkucmVmcyBBZGQgcmVmZXJlbmNlcyB0byB0aGUgc3RhbXAuIENoYWluYWJsZS5cbiAqIEByZXR1cm4ge0Z1bmN0aW9uKEZ1bmN0aW9uKGNvbnRleHQpKX0gZmFjdG9yeS5pbml0IEFkZCBhIGNsb3N1cmUgd2hpY2ggY2FsbGVkIG9uIG9iamVjdCBpbnN0YW50aWF0aW9uLiBDaGFpbmFibGUuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbihwcm9wcyl9IGZhY3RvcnkucHJvcHMgQWRkIGRlZXBseSBjbG9uZWQgcHJvcGVydGllcyB0byB0aGUgcHJvZHVjZWQgb2JqZWN0cy4gQ2hhaW5hYmxlLlxuICogQHJldHVybiB7RnVuY3Rpb24oc3RhbXBzKX0gZmFjdG9yeS5jb21wb3NlIENvbWJpbmUgc2V2ZXJhbCBzdGFtcHMgaW50byBzaW5nbGUuIENoYWluYWJsZS5cbiAqIEByZXR1cm4ge0Z1bmN0aW9uKHN0YXRpY3MpfSBmYWN0b3J5LnN0YXRpYyBBZGQgcHJvcGVydGllcyB0byB0aGUgc3RhbXAgKG5vdCBvYmplY3RzISkuIENoYWluYWJsZS5cbiAqL1xudmFyIHN0YW1waXQgPSBmdW5jdGlvbiBzdGFtcGl0KG9wdGlvbnMpIHtcbiAgdmFyIGZpeGVkID0geyBtZXRob2RzOiB7fSwgcmVmczoge30sIGluaXQ6IFtdLCBwcm9wczoge30sICdzdGF0aWMnOiB7fSB9O1xuICBmaXhlZC5zdGF0ZSA9IGZpeGVkLnJlZnM7IC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHkuICdzdGF0ZScgaXMgdGhlIG9sZCBuYW1lIGZvciAncmVmcycuXG4gIGZpeGVkLmVuY2xvc2UgPSBmaXhlZC5pbml0OyAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5LiAnZW5jbG9zZScgaXMgdGhlIG9sZCBuYW1lIGZvciAnaW5pdCcuXG4gIGlmIChvcHRpb25zKSB7XG4gICAgYWRkTWV0aG9kcyhmaXhlZCwgb3B0aW9ucy5tZXRob2RzKTtcbiAgICBhZGRSZWZzKGZpeGVkLCBvcHRpb25zLnJlZnMpO1xuICAgIGFkZEluaXQoZml4ZWQsIG9wdGlvbnMuaW5pdCk7XG4gICAgYWRkUHJvcHMoZml4ZWQsIG9wdGlvbnMucHJvcHMpO1xuICAgIGFkZFN0YXRpYyhmaXhlZCwgb3B0aW9uc1snc3RhdGljJ10pO1xuICB9XG5cbiAgdmFyIGZhY3RvcnkgPSBmdW5jdGlvbiBGYWN0b3J5KHJlZnMpIHtcbiAgICBmb3IgKHZhciBfbGVuOSA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuOSA+IDEgPyBfbGVuOSAtIDEgOiAwKSwgX2tleTkgPSAxOyBfa2V5OSA8IF9sZW45OyBfa2V5OSsrKSB7XG4gICAgICBhcmdzW19rZXk5IC0gMV0gPSBhcmd1bWVudHNbX2tleTldO1xuICAgIH1cblxuICAgIHZhciBpbnN0YW5jZSA9ICgwLCBfc3VwZXJtaXhlci5taXhpbikoY3JlYXRlKGZpeGVkLm1ldGhvZHMpLCBmaXhlZC5yZWZzLCByZWZzKTtcbiAgICAoMCwgX3N1cGVybWl4ZXIubWVyZ2VVbmlxdWUpKGluc3RhbmNlLCBmaXhlZC5wcm9wcyk7IC8vIHByb3BzIGFyZSBzYWZlbHkgbWVyZ2VkIGludG8gcmVmc1xuXG4gICAgdmFyIG5leHRQcm9taXNlID0gbnVsbDtcbiAgICBpZiAoZml4ZWQuaW5pdC5sZW5ndGggPiAwKSB7XG4gICAgICAoMCwgX2xvZGFzaENvbGxlY3Rpb25Gb3JFYWNoMlsnZGVmYXVsdCddKShmaXhlZC5pbml0LCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgaWYgKCEoMCwgX2xvZGFzaExhbmdJc0Z1bmN0aW9uMlsnZGVmYXVsdCddKShmbikpIHtcbiAgICAgICAgICByZXR1cm47IC8vIG5vdCBhIGZ1bmN0aW9uLCBkbyBub3RoaW5nLlxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgd2UgYXJlIGluIHRoZSBhc3luYyBtb2RlLlxuICAgICAgICBpZiAoIW5leHRQcm9taXNlKSB7XG4gICAgICAgICAgLy8gQ2FsbCB0aGUgaW5pdCgpLlxuICAgICAgICAgIHZhciBjYWxsUmVzdWx0ID0gZm4uY2FsbChpbnN0YW5jZSwgeyBhcmdzOiBhcmdzLCBpbnN0YW5jZTogaW5zdGFuY2UsIHN0YW1wOiBmYWN0b3J5IH0pO1xuICAgICAgICAgIGlmICghY2FsbFJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBUaGUgaW5pdCgpIHJldHVybmVkIG5vdGhpbmcuIFByb2NlZWQgdG8gdGhlIG5leHQgaW5pdCgpLlxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJldHVybmVkIHZhbHVlIGlzIG1lYW5pbmdmdWwuXG4gICAgICAgICAgLy8gSXQgd2lsbCByZXBsYWNlIHRoZSBzdGFtcGl0LWNyZWF0ZWQgb2JqZWN0LlxuICAgICAgICAgIGlmICghaXNUaGVuYWJsZShjYWxsUmVzdWx0KSkge1xuICAgICAgICAgICAgaW5zdGFuY2UgPSBjYWxsUmVzdWx0OyAvLyBzdGFtcCBpcyBzeW5jaHJvbm91cyBzbyBmYXIuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVGhpcyBpcyB0aGUgc3luYy0+YXN5bmMgY29udmVyc2lvbiBwb2ludC5cbiAgICAgICAgICAvLyBTaW5jZSBub3cgb3VyIGZhY3Rvcnkgd2lsbCByZXR1cm4gYSBwcm9taXNlLCBub3QgYW4gb2JqZWN0LlxuICAgICAgICAgIG5leHRQcm9taXNlID0gY2FsbFJlc3VsdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBBcyBsb25nIGFzIG9uZSBvZiB0aGUgaW5pdCgpIGZ1bmN0aW9ucyByZXR1cm5lZCBhIHByb21pc2UsXG4gICAgICAgICAgLy8gbm93IG91ciBmYWN0b3J5IHdpbGwgMTAwJSByZXR1cm4gcHJvbWlzZSB0b28uXG4gICAgICAgICAgLy8gTGlua2luZyB0aGUgaW5pdCgpIGZ1bmN0aW9ucyBpbnRvIHRoZSBwcm9taXNlIGNoYWluLlxuICAgICAgICAgIG5leHRQcm9taXNlID0gbmV4dFByb21pc2UudGhlbihmdW5jdGlvbiAobmV3SW5zdGFuY2UpIHtcbiAgICAgICAgICAgIC8vIFRoZSBwcmV2aW91cyBwcm9taXNlIG1pZ2h0IHdhbnQgdG8gcmV0dXJuIGEgdmFsdWUsXG4gICAgICAgICAgICAvLyB3aGljaCB3ZSBzaG91bGQgdGFrZSBhcyBhIG5ldyBvYmplY3QgaW5zdGFuY2UuXG4gICAgICAgICAgICBpbnN0YW5jZSA9IG5ld0luc3RhbmNlIHx8IGluc3RhbmNlO1xuXG4gICAgICAgICAgICAvLyBDYWxsaW5nIHRoZSBmb2xsb3dpbmcgaW5pdCgpLlxuICAgICAgICAgICAgLy8gTk9URSwgdGhhbiBgZm5gIGlzIHdyYXBwZWQgdG8gYSBjbG9zdXJlIHdpdGhpbiB0aGUgZm9yRWFjaCBsb29wLlxuICAgICAgICAgICAgdmFyIGNhbGxSZXN1bHQgPSBmbi5jYWxsKGluc3RhbmNlLCB7IGFyZ3M6IGFyZ3MsIGluc3RhbmNlOiBpbnN0YW5jZSwgc3RhbXA6IGZhY3RvcnkgfSk7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiBjYWxsIHJlc3VsdCBpcyB0cnV0aHkuXG4gICAgICAgICAgICBpZiAoIWNhbGxSZXN1bHQpIHtcbiAgICAgICAgICAgICAgLy8gVGhlIGluaXQoKSByZXR1cm5lZCBub3RoaW5nLiBUaHVzIHVzaW5nIHRoZSBwcmV2aW91cyBvYmplY3QgaW5zdGFuY2UuXG4gICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpc1RoZW5hYmxlKGNhbGxSZXN1bHQpKSB7XG4gICAgICAgICAgICAgIC8vIFRoaXMgaW5pdCgpIHdhcyBzeW5jaHJvbm91cyBhbmQgcmV0dXJuZWQgYSBtZWFuaW5nZnVsIHZhbHVlLlxuICAgICAgICAgICAgICBpbnN0YW5jZSA9IGNhbGxSZXN1bHQ7XG4gICAgICAgICAgICAgIC8vIFJlc29sdmUgdGhlIGluc3RhbmNlIGZvciB0aGUgbmV4dCBgdGhlbigpYC5cbiAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaGUgaW5pdCgpIHJldHVybmVkIGFub3RoZXIgcHJvbWlzZS4gSXQgaXMgYmVjb21pbmcgb3VyIG5leHRQcm9taXNlLlxuICAgICAgICAgICAgcmV0dXJuIGNhbGxSZXN1bHQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEF0IHRoZSBlbmQgd2Ugc2hvdWxkIHJlc29sdmUgdGhlIGxhc3QgcHJvbWlzZSBhbmRcbiAgICAvLyByZXR1cm4gdGhlIHJlc29sdmVkIHZhbHVlIChhcyBhIHByb21pc2UgdG9vKS5cbiAgICByZXR1cm4gbmV4dFByb21pc2UgPyBuZXh0UHJvbWlzZS50aGVuKGZ1bmN0aW9uIChuZXdJbnN0YW5jZSkge1xuICAgICAgcmV0dXJuIG5ld0luc3RhbmNlIHx8IGluc3RhbmNlO1xuICAgIH0pIDogaW5zdGFuY2U7XG4gIH07XG5cbiAgdmFyIHJlZnNNZXRob2QgPSBjbG9uZUFuZEV4dGVuZC5iaW5kKG51bGwsIGZpeGVkLCBhZGRSZWZzKTtcbiAgdmFyIGluaXRNZXRob2QgPSBjbG9uZUFuZEV4dGVuZC5iaW5kKG51bGwsIGZpeGVkLCBhZGRJbml0KTtcbiAgcmV0dXJuICgwLCBfc3VwZXJtaXhlci5taXhpbikoZmFjdG9yeSwge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgb2JqZWN0IGluc3RhbmNlIGZvcm0gdGhlIHN0YW1wLlxuICAgICAqL1xuICAgIGNyZWF0ZTogZmFjdG9yeSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBzdGFtcCBjb21wb25lbnRzLlxuICAgICAqL1xuICAgIGZpeGVkOiBmaXhlZCxcblxuICAgIC8qKlxuICAgICAqIFRha2UgbiBvYmplY3RzIGFuZCBhZGQgdGhlbSB0byB0aGUgbWV0aG9kcyBsaXN0IG9mIGEgbmV3IHN0YW1wLiBDcmVhdGVzIG5ldyBzdGFtcC5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgc3RhbXAgKGZhY3Rvcnkgb2JqZWN0KS5cbiAgICAgKi9cbiAgICBtZXRob2RzOiBjbG9uZUFuZEV4dGVuZC5iaW5kKG51bGwsIGZpeGVkLCBhZGRNZXRob2RzKSxcblxuICAgIC8qKlxuICAgICAqIFRha2UgbiBvYmplY3RzIGFuZCBhZGQgdGhlbSB0byB0aGUgcmVmZXJlbmNlcyBsaXN0IG9mIGEgbmV3IHN0YW1wLiBDcmVhdGVzIG5ldyBzdGFtcC5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgc3RhbXAgKGZhY3Rvcnkgb2JqZWN0KS5cbiAgICAgKi9cbiAgICByZWZzOiByZWZzTWV0aG9kLFxuXG4gICAgLyoqXG4gICAgICogQGRlcHJlY2F0ZWQgc2luY2UgdjIuMC4gVXNlIHJlZnMoKSBpbnN0ZWFkLlxuICAgICAqIEFsaWFzIHRvIHJlZnMoKS5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgc3RhbXAgKGZhY3Rvcnkgb2JqZWN0KS5cbiAgICAgKi9cbiAgICBzdGF0ZTogcmVmc01ldGhvZCxcblxuICAgIC8qKlxuICAgICAqIFRha2UgbiBmdW5jdGlvbnMsIGFuIGFycmF5IG9mIGZ1bmN0aW9ucywgb3IgbiBvYmplY3RzIGFuZCBhZGRcbiAgICAgKiB0aGUgZnVuY3Rpb25zIHRvIHRoZSBpbml0aWFsaXplcnMgbGlzdCBvZiBhIG5ldyBzdGFtcC4gQ3JlYXRlcyBuZXcgc3RhbXAuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IHN0YW1wIChmYWN0b3J5IG9iamVjdCkuXG4gICAgICovXG4gICAgaW5pdDogaW5pdE1ldGhvZCxcblxuICAgIC8qKlxuICAgICAqIEBkZXByZWNhdGVkIHNpbmNlIHYyLjAuIFVzZXIgaW5pdCgpIGluc3RlYWQuXG4gICAgICogQWxpYXMgdG8gaW5pdCgpLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBzdGFtcCAoZmFjdG9yeSBvYmplY3QpLlxuICAgICAqL1xuICAgIGVuY2xvc2U6IGluaXRNZXRob2QsXG5cbiAgICAvKipcbiAgICAgKiBUYWtlIG4gb2JqZWN0cyBhbmQgZGVlcCBtZXJnZSB0aGVtIHRvIHRoZSBwcm9wZXJ0aWVzLiBDcmVhdGVzIG5ldyBzdGFtcC5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgc3RhbXAgKGZhY3Rvcnkgb2JqZWN0KS5cbiAgICAgKi9cbiAgICBwcm9wczogY2xvbmVBbmRFeHRlbmQuYmluZChudWxsLCBmaXhlZCwgYWRkUHJvcHMpLFxuXG4gICAgLyoqXG4gICAgICogVGFrZSBuIG9iamVjdHMgYW5kIGFkZCBhbGwgcHJvcHMgdG8gdGhlIGZhY3Rvcnkgb2JqZWN0LiBDcmVhdGVzIG5ldyBzdGFtcC5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgc3RhbXAgKGZhY3Rvcnkgb2JqZWN0KS5cbiAgICAgKi9cbiAgICAnc3RhdGljJzogZnVuY3Rpb24gX3N0YXRpYygpIHtcbiAgICAgIGZvciAodmFyIF9sZW4xMCA9IGFyZ3VtZW50cy5sZW5ndGgsIHN0YXRpY3MgPSBBcnJheShfbGVuMTApLCBfa2V5MTAgPSAwOyBfa2V5MTAgPCBfbGVuMTA7IF9rZXkxMCsrKSB7XG4gICAgICAgIHN0YXRpY3NbX2tleTEwXSA9IGFyZ3VtZW50c1tfa2V5MTBdO1xuICAgICAgfVxuXG4gICAgICB2YXIgbmV3U3RhbXAgPSBjbG9uZUFuZEV4dGVuZC5hcHBseSh1bmRlZmluZWQsIFtmYWN0b3J5LmZpeGVkLCBhZGRTdGF0aWNdLmNvbmNhdChzdGF0aWNzKSk7XG4gICAgICByZXR1cm4gKDAsIF9zdXBlcm1peGVyLm1peGluKShuZXdTdGFtcCwgbmV3U3RhbXAuZml4ZWRbJ3N0YXRpYyddKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVGFrZSBvbmUgb3IgbW9yZSBmYWN0b3JpZXMgcHJvZHVjZWQgZnJvbSBzdGFtcGl0KCkgYW5kXG4gICAgICogY29tYmluZSB0aGVtIHdpdGggYHRoaXNgIHRvIHByb2R1Y2UgYW5kIHJldHVybiBhIG5ldyBmYWN0b3J5LlxuICAgICAqIENvbWJpbmluZyBvdmVycmlkZXMgcHJvcGVydGllcyB3aXRoIGxhc3QtaW4gcHJpb3JpdHkuXG4gICAgICogQHBhcmFtIHtbRnVuY3Rpb25dfC4uLkZ1bmN0aW9ufSBmYWN0b3JpZXMgU3RhbXBpdCBmYWN0b3JpZXMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IHN0YW1waXQgZmFjdG9yeSBjb21wb3NlZCBmcm9tIGFyZ3VtZW50cy5cbiAgICAgKi9cbiAgICBjb21wb3NlOiBmdW5jdGlvbiBjb21wb3NlKCkge1xuICAgICAgZm9yICh2YXIgX2xlbjExID0gYXJndW1lbnRzLmxlbmd0aCwgZmFjdG9yaWVzID0gQXJyYXkoX2xlbjExKSwgX2tleTExID0gMDsgX2tleTExIDwgX2xlbjExOyBfa2V5MTErKykge1xuICAgICAgICBmYWN0b3JpZXNbX2tleTExXSA9IGFyZ3VtZW50c1tfa2V5MTFdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gX2NvbXBvc2UuYXBwbHkodW5kZWZpbmVkLCBbZmFjdG9yeV0uY29uY2F0KGZhY3RvcmllcykpO1xuICAgIH1cbiAgfSwgZml4ZWRbJ3N0YXRpYyddKTtcbn07XG5cbi8vIFN0YXRpYyBtZXRob2RzXG5cbmZ1bmN0aW9uIGlzU3RhbXAob2JqKSB7XG4gIHJldHVybiAoMCwgX2xvZGFzaExhbmdJc0Z1bmN0aW9uMlsnZGVmYXVsdCddKShvYmopICYmICgwLCBfbG9kYXNoTGFuZ0lzRnVuY3Rpb24yWydkZWZhdWx0J10pKG9iai5tZXRob2RzKSAmJiAoXG4gIC8vIGlzU3RhbXAgY2FuIGJlIGNhbGxlZCBmb3Igb2xkIHN0YW1waXQgZmFjdG9yeSBvYmplY3QuXG4gIC8vIFdlIHNob3VsZCBjaGVjayBvbGQgbmFtZXMgKHN0YXRlIGFuZCBlbmNsb3NlKSB0b28uXG4gICgwLCBfbG9kYXNoTGFuZ0lzRnVuY3Rpb24yWydkZWZhdWx0J10pKG9iai5yZWZzKSB8fCAoMCwgX2xvZGFzaExhbmdJc0Z1bmN0aW9uMlsnZGVmYXVsdCddKShvYmouc3RhdGUpKSAmJiAoKDAsIF9sb2Rhc2hMYW5nSXNGdW5jdGlvbjJbJ2RlZmF1bHQnXSkob2JqLmluaXQpIHx8ICgwLCBfbG9kYXNoTGFuZ0lzRnVuY3Rpb24yWydkZWZhdWx0J10pKG9iai5lbmNsb3NlKSkgJiYgKDAsIF9sb2Rhc2hMYW5nSXNGdW5jdGlvbjJbJ2RlZmF1bHQnXSkob2JqLnByb3BzKSAmJiAoMCwgX2xvZGFzaExhbmdJc0Z1bmN0aW9uMlsnZGVmYXVsdCddKShvYmpbJ3N0YXRpYyddKSAmJiAoMCwgX2xvZGFzaExhbmdJc09iamVjdDJbJ2RlZmF1bHQnXSkob2JqLmZpeGVkKTtcbn1cblxuZnVuY3Rpb24gY29udmVydENvbnN0cnVjdG9yKENvbnN0cnVjdG9yKSB7XG4gIHZhciBzdGFtcCA9IHN0YW1waXQoKTtcbiAgc3RhbXAuZml4ZWQucmVmcyA9IHN0YW1wLmZpeGVkLnN0YXRlID0gKDAsIF9zdXBlcm1peGVyLm1lcmdlQ2hhaW5Ob25GdW5jdGlvbnMpKHN0YW1wLmZpeGVkLnJlZnMsIENvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gICgwLCBfc3VwZXJtaXhlci5taXhpbikoc3RhbXAsICgwLCBfc3VwZXJtaXhlci5taXhpbikoc3RhbXAuZml4ZWRbJ3N0YXRpYyddLCBDb25zdHJ1Y3RvcikpO1xuXG4gICgwLCBfc3VwZXJtaXhlci5taXhpbkNoYWluRnVuY3Rpb25zKShzdGFtcC5maXhlZC5tZXRob2RzLCBDb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuICBhZGRJbml0KHN0YW1wLmZpeGVkLCBmdW5jdGlvbiAoX3JlZikge1xuICAgIHZhciBpbnN0YW5jZSA9IF9yZWYuaW5zdGFuY2U7XG4gICAgdmFyIGFyZ3MgPSBfcmVmLmFyZ3M7XG4gICAgcmV0dXJuIENvbnN0cnVjdG9yLmFwcGx5KGluc3RhbmNlLCBhcmdzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHN0YW1wO1xufVxuXG5mdW5jdGlvbiBzaG9ydGN1dE1ldGhvZChleHRlbnNpb25GdW5jdGlvbikge1xuICB2YXIgc3RhbXAgPSBzdGFtcGl0KCk7XG5cbiAgZm9yICh2YXIgX2xlbjEyID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4xMiA+IDEgPyBfbGVuMTIgLSAxIDogMCksIF9rZXkxMiA9IDE7IF9rZXkxMiA8IF9sZW4xMjsgX2tleTEyKyspIHtcbiAgICBhcmdzW19rZXkxMiAtIDFdID0gYXJndW1lbnRzW19rZXkxMl07XG4gIH1cblxuICBleHRlbnNpb25GdW5jdGlvbi5hcHBseSh1bmRlZmluZWQsIFtzdGFtcC5maXhlZF0uY29uY2F0KGFyZ3MpKTtcblxuICByZXR1cm4gc3RhbXA7XG59XG5cbmZ1bmN0aW9uIG1peGluV2l0aENvbnNvbGVXYXJuaW5nKCkge1xuICBjb25zb2xlLmxvZygnc3RhbXBpdC5taXhpbigpLCAubWl4SW4oKSwgLmV4dGVuZCgpLCBhbmQgLmFzc2lnbigpIGFyZSBkZXByZWNhdGVkLicsICdVc2UgT2JqZWN0LmFzc2lnbiBvciBfLmFzc2lnbiBpbnN0ZWFkJyk7XG4gIHJldHVybiBfc3VwZXJtaXhlci5taXhpbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSAoMCwgX3N1cGVybWl4ZXIubWl4aW4pKHN0YW1waXQsIHtcblxuICAvKipcbiAgICogVGFrZSBuIG9iamVjdHMgYW5kIGFkZCB0aGVtIHRvIHRoZSBtZXRob2RzIGxpc3Qgb2YgYSBuZXcgc3RhbXAuIENyZWF0ZXMgbmV3IHN0YW1wLlxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgc3RhbXAgKGZhY3Rvcnkgb2JqZWN0KS5cbiAgICovXG4gIG1ldGhvZHM6IHNob3J0Y3V0TWV0aG9kLmJpbmQobnVsbCwgYWRkTWV0aG9kcyksXG5cbiAgLyoqXG4gICAqIFRha2UgbiBvYmplY3RzIGFuZCBhZGQgdGhlbSB0byB0aGUgcmVmZXJlbmNlcyBsaXN0IG9mIGEgbmV3IHN0YW1wLiBDcmVhdGVzIG5ldyBzdGFtcC5cbiAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IHN0YW1wIChmYWN0b3J5IG9iamVjdCkuXG4gICAqL1xuICByZWZzOiBzaG9ydGN1dE1ldGhvZC5iaW5kKG51bGwsIGFkZFJlZnMpLFxuXG4gIC8qKlxuICAgKiBUYWtlIG4gZnVuY3Rpb25zLCBhbiBhcnJheSBvZiBmdW5jdGlvbnMsIG9yIG4gb2JqZWN0cyBhbmQgYWRkXG4gICAqIHRoZSBmdW5jdGlvbnMgdG8gdGhlIGluaXRpYWxpemVycyBsaXN0IG9mIGEgbmV3IHN0YW1wLiBDcmVhdGVzIG5ldyBzdGFtcC5cbiAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IHN0YW1wIChmYWN0b3J5IG9iamVjdCkuXG4gICAqL1xuICBpbml0OiBzaG9ydGN1dE1ldGhvZC5iaW5kKG51bGwsIGFkZEluaXQpLFxuXG4gIC8qKlxuICAgKiBUYWtlIG4gb2JqZWN0cyBhbmQgZGVlcCBtZXJnZSB0aGVtIHRvIHRoZSBwcm9wZXJ0aWVzLiBDcmVhdGVzIG5ldyBzdGFtcC5cbiAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IHN0YW1wIChmYWN0b3J5IG9iamVjdCkuXG4gICAqL1xuICBwcm9wczogc2hvcnRjdXRNZXRob2QuYmluZChudWxsLCBhZGRQcm9wcyksXG5cbiAgLyoqXG4gICAqIFRha2UgbiBvYmplY3RzIGFuZCBhZGQgYWxsIHByb3BzIHRvIHRoZSBmYWN0b3J5IG9iamVjdC4gQ3JlYXRlcyBuZXcgc3RhbXAuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBzdGFtcCAoZmFjdG9yeSBvYmplY3QpLlxuICAgKi9cbiAgJ3N0YXRpYyc6IGZ1bmN0aW9uIF9zdGF0aWMoKSB7XG4gICAgZm9yICh2YXIgX2xlbjEzID0gYXJndW1lbnRzLmxlbmd0aCwgc3RhdGljcyA9IEFycmF5KF9sZW4xMyksIF9rZXkxMyA9IDA7IF9rZXkxMyA8IF9sZW4xMzsgX2tleTEzKyspIHtcbiAgICAgIHN0YXRpY3NbX2tleTEzXSA9IGFyZ3VtZW50c1tfa2V5MTNdO1xuICAgIH1cblxuICAgIHZhciBuZXdTdGFtcCA9IHNob3J0Y3V0TWV0aG9kLmFwcGx5KHVuZGVmaW5lZCwgW2FkZFN0YXRpY10uY29uY2F0KHN0YXRpY3MpKTtcbiAgICByZXR1cm4gKDAsIF9zdXBlcm1peGVyLm1peGluKShuZXdTdGFtcCwgbmV3U3RhbXAuZml4ZWRbJ3N0YXRpYyddKTtcbiAgfSxcblxuICAvKipcbiAgICogVGFrZSB0d28gb3IgbW9yZSBmYWN0b3JpZXMgcHJvZHVjZWQgZnJvbSBzdGFtcGl0KCkgYW5kXG4gICAqIGNvbWJpbmUgdGhlbSB0byBwcm9kdWNlIGEgbmV3IGZhY3RvcnkuXG4gICAqIENvbWJpbmluZyBvdmVycmlkZXMgcHJvcGVydGllcyB3aXRoIGxhc3QtaW4gcHJpb3JpdHkuXG4gICAqIEBwYXJhbSB7W0Z1bmN0aW9uXXwuLi5GdW5jdGlvbn0gZmFjdG9yaWVzIFN0YW1wcyBwcm9kdWNlZCBieSBzdGFtcGl0KCkuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBzdGFtcGl0IGZhY3RvcnkgY29tcG9zZWQgZnJvbSBhcmd1bWVudHMuXG4gICAqL1xuICBjb21wb3NlOiBfY29tcG9zZSxcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgU2luY2UgdjIuMi4gVXNlIE9iamVjdC5hc3NpZ24gb3IgXy5hc3NpZ24gaW5zdGVhZC5cbiAgICogQWxpYXMgdG8gT2JqZWN0LmFzc2lnbi5cbiAgICovXG4gIG1peGluOiBtaXhpbldpdGhDb25zb2xlV2FybmluZyxcbiAgZXh0ZW5kOiBtaXhpbldpdGhDb25zb2xlV2FybmluZyxcbiAgbWl4SW46IG1peGluV2l0aENvbnNvbGVXYXJuaW5nLFxuICBhc3NpZ246IG1peGluV2l0aENvbnNvbGVXYXJuaW5nLFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBvYmplY3QgaXMgYSBzdGFtcC5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBBbiBvYmplY3QgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgaXNTdGFtcDogaXNTdGFtcCxcblxuICAvKipcbiAgICogVGFrZSBhbiBvbGQtZmFzaGlvbmVkIEpTIGNvbnN0cnVjdG9yIGFuZCByZXR1cm4gYSBzdGFtcGl0IHN0YW1wXG4gICAqIHRoYXQgeW91IGNhbiBmcmVlbHkgY29tcG9zZSB3aXRoIG90aGVyIHN0YW1wcy5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IENvbnN0cnVjdG9yXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIGNvbXBvc2FibGUgc3RhbXBpdCBmYWN0b3J5IChha2Egc3RhbXApLlxuICAgKi9cbiAgY29udmVydENvbnN0cnVjdG9yOiBjb252ZXJ0Q29uc3RydWN0b3Jcbn0pO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX21peGVyID0gcmVxdWlyZSgnLi9taXhlcicpO1xuXG52YXIgX21peGVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX21peGVyKTtcblxudmFyIF9sb2Rhc2hMYW5nSXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2xvZGFzaC9sYW5nL2lzRnVuY3Rpb24nKTtcblxudmFyIF9sb2Rhc2hMYW5nSXNGdW5jdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hMYW5nSXNGdW5jdGlvbik7XG5cbnZhciBpc05vdEZ1bmN0aW9uID0gZnVuY3Rpb24gaXNOb3RGdW5jdGlvbih2YWwpIHtcbiAgcmV0dXJuICEoMCwgX2xvZGFzaExhbmdJc0Z1bmN0aW9uMlsnZGVmYXVsdCddKSh2YWwpO1xufTtcblxuLyoqXG4gKiBSZWd1bGFyIG1peGluIGZ1bmN0aW9uLlxuICovXG52YXIgbWl4aW4gPSAoMCwgX21peGVyMlsnZGVmYXVsdCddKSgpO1xuXG4vKipcbiAqIE1peGluIGZ1bmN0aW9ucyBvbmx5LlxuICovXG52YXIgbWl4aW5GdW5jdGlvbnMgPSAoMCwgX21peGVyMlsnZGVmYXVsdCddKSh7XG4gIGZpbHRlcjogX2xvZGFzaExhbmdJc0Z1bmN0aW9uMlsnZGVmYXVsdCddXG59KTtcblxuLyoqXG4gKiBNaXhpbiBmdW5jdGlvbnMgaW5jbHVkaW5nIHByb3RvdHlwZSBjaGFpbi5cbiAqL1xudmFyIG1peGluQ2hhaW5GdW5jdGlvbnMgPSAoMCwgX21peGVyMlsnZGVmYXVsdCddKSh7XG4gIGZpbHRlcjogX2xvZGFzaExhbmdJc0Z1bmN0aW9uMlsnZGVmYXVsdCddLFxuICBjaGFpbjogdHJ1ZVxufSk7XG5cbi8qKlxuICogUmVndWxhciBvYmplY3QgbWVyZ2UgZnVuY3Rpb24uIElnbm9yZXMgZnVuY3Rpb25zLlxuICovXG52YXIgbWVyZ2UgPSAoMCwgX21peGVyMlsnZGVmYXVsdCddKSh7XG4gIGRlZXA6IHRydWVcbn0pO1xuXG4vKipcbiAqIFJlZ3VsYXIgb2JqZWN0IG1lcmdlIGZ1bmN0aW9uLiBJZ25vcmVzIGZ1bmN0aW9ucy5cbiAqL1xudmFyIG1lcmdlVW5pcXVlID0gKDAsIF9taXhlcjJbJ2RlZmF1bHQnXSkoe1xuICBkZWVwOiB0cnVlLFxuICBub092ZXJ3cml0ZTogdHJ1ZVxufSk7XG5cbi8qKlxuICogTWVyZ2Ugb2JqZWN0cyBpbmNsdWRpbmcgcHJvdG90eXBlIGNoYWluIHByb3BlcnRpZXMuXG4gKi9cbnZhciBtZXJnZUNoYWluTm9uRnVuY3Rpb25zID0gKDAsIF9taXhlcjJbJ2RlZmF1bHQnXSkoe1xuICBmaWx0ZXI6IGlzTm90RnVuY3Rpb24sXG4gIGRlZXA6IHRydWUsXG4gIGNoYWluOiB0cnVlXG59KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gX21peGVyMlsnZGVmYXVsdCddO1xuZXhwb3J0cy5taXhpbiA9IG1peGluO1xuZXhwb3J0cy5taXhpbkZ1bmN0aW9ucyA9IG1peGluRnVuY3Rpb25zO1xuZXhwb3J0cy5taXhpbkNoYWluRnVuY3Rpb25zID0gbWl4aW5DaGFpbkZ1bmN0aW9ucztcbmV4cG9ydHMubWVyZ2UgPSBtZXJnZTtcbmV4cG9ydHMubWVyZ2VVbmlxdWUgPSBtZXJnZVVuaXF1ZTtcbmV4cG9ydHMubWVyZ2VDaGFpbk5vbkZ1bmN0aW9ucyA9IG1lcmdlQ2hhaW5Ob25GdW5jdGlvbnM7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IG1peGVyO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfbG9kYXNoT2JqZWN0Rm9yT3duID0gcmVxdWlyZSgnbG9kYXNoL29iamVjdC9mb3JPd24nKTtcblxudmFyIF9sb2Rhc2hPYmplY3RGb3JPd24yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoT2JqZWN0Rm9yT3duKTtcblxudmFyIF9sb2Rhc2hPYmplY3RGb3JJbiA9IHJlcXVpcmUoJ2xvZGFzaC9vYmplY3QvZm9ySW4nKTtcblxudmFyIF9sb2Rhc2hPYmplY3RGb3JJbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hPYmplY3RGb3JJbik7XG5cbnZhciBfbG9kYXNoTGFuZ0Nsb25lRGVlcCA9IHJlcXVpcmUoJ2xvZGFzaC9sYW5nL2Nsb25lRGVlcCcpO1xuXG52YXIgX2xvZGFzaExhbmdDbG9uZURlZXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoTGFuZ0Nsb25lRGVlcCk7XG5cbnZhciBfbG9kYXNoTGFuZ0lzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoL2xhbmcvaXNPYmplY3QnKTtcblxudmFyIF9sb2Rhc2hMYW5nSXNPYmplY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoTGFuZ0lzT2JqZWN0KTtcblxudmFyIF9sb2Rhc2hMYW5nSXNVbmRlZmluZWQgPSByZXF1aXJlKCdsb2Rhc2gvbGFuZy9pc1VuZGVmaW5lZCcpO1xuXG52YXIgX2xvZGFzaExhbmdJc1VuZGVmaW5lZDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hMYW5nSXNVbmRlZmluZWQpO1xuXG4vKipcbiAqIEZhY3RvcnkgZm9yIGNyZWF0aW5nIG1peGluIGZ1bmN0aW9ucyBvZiBhbGwga2luZHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdHMuZmlsdGVyIEZ1bmN0aW9uIHdoaWNoIGZpbHRlcnMgdmFsdWUgYW5kIGtleS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdHMudHJhbnNmb3JtIEZ1bmN0aW9uIHdoaWNoIHRyYW5zZm9ybXMgZWFjaCB2YWx1ZS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0cy5jaGFpbiBMb29wIHRocm91Z2ggcHJvdG90eXBlIHByb3BlcnRpZXMgdG9vLlxuICogQHBhcmFtIHtCb29sZWFufSBvcHRzLmRlZXAgRGVlcCBsb29waW5nIHRocm91Z2ggdGhlIG5lc3RlZCBwcm9wZXJ0aWVzLlxuICogQHBhcmFtIHtCb29sZWFufSBvcHRzLm5vT3ZlcndyaXRlIERvIG5vdCBvdmVyd3JpdGUgYW55IGV4aXN0aW5nIGRhdGEgKGFrYSBmaXJzdCBvbmUgd2lucykuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgbWl4IGZ1bmN0aW9uLlxuICovXG5cbmZ1bmN0aW9uIG1peGVyKCkge1xuICB2YXIgb3B0cyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cbiAgLy8gV2Ugd2lsbCBiZSByZWN1cnNpdmVseSBjYWxsaW5nIHRoZSBleGFjdCBzYW1lIGZ1bmN0aW9uIHdoZW4gd2Fsa2luZyBkZWVwZXIuXG4gIGlmIChvcHRzLmRlZXAgJiYgIW9wdHMuX2lubmVyTWl4ZXIpIHtcbiAgICBvcHRzLl9pbm5lck1peGVyID0gdHJ1ZTsgLy8gYXZvaWRpbmcgaW5maW5pdGUgcmVjdXJzaW9uLlxuICAgIG9wdHMuX2lubmVyTWl4ZXIgPSBtaXhlcihvcHRzKTsgLy8gY3JlYXRlIHNhbWUgbWl4ZXIgZm9yIHJlY3Vyc2lvbiBwdXJwb3NlLlxuICB9XG5cbiAgLyoqXG4gICAqIENvbWJpbmUgcHJvcGVydGllcyBmcm9tIHRoZSBwYXNzZWQgb2JqZWN0cyBpbnRvIHRhcmdldC4gVGhpcyBtZXRob2QgbXV0YXRlcyB0YXJnZXQsXG4gICAqIGlmIHlvdSB3YW50IHRvIGNyZWF0ZSBhIG5ldyBPYmplY3QgcGFzcyBhbiBlbXB0eSBvYmplY3QgYXMgZmlyc3QgcGFyYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXQgVGFyZ2V0IE9iamVjdFxuICAgKiBAcGFyYW0gey4uLk9iamVjdH0gb2JqZWN0cyBPYmplY3RzIHRvIGJlIGNvbWJpbmVkICgwLi4ubiBvYmplY3RzKS5cbiAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgbWl4ZWQgb2JqZWN0LlxuICAgKi9cbiAgcmV0dXJuIGZ1bmN0aW9uIG1peCh0YXJnZXQpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgc291cmNlcyA9IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIHNvdXJjZXNbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIGl0J3MgdXMgd2hvIGNhbGxlZCB0aGUgZnVuY3Rpb24uIFNlZSByZWN1cnNpb24gY2FsbHMgYXJlIGJlbG93LlxuICAgIGlmICgoMCwgX2xvZGFzaExhbmdJc1VuZGVmaW5lZDJbJ2RlZmF1bHQnXSkodGFyZ2V0KSB8fCAhb3B0cy5ub092ZXJ3cml0ZSAmJiAhKDAsIF9sb2Rhc2hMYW5nSXNPYmplY3QyWydkZWZhdWx0J10pKHRhcmdldCkpIHtcbiAgICAgIGlmIChzb3VyY2VzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgLy8gV2VpcmQsIGJ1dCBzb21lb25lIChub3QgdXMhKSBjYWxsZWQgdGhpcyBtaXhlciB3aXRoIGFuIGluY29ycmVjdCBmaXJzdCBhcmd1bWVudC5cbiAgICAgICAgcmV0dXJuIG9wdHMuX2lubmVyTWl4ZXIuYXBwbHkob3B0cywgW3t9XS5jb25jYXQoc291cmNlcykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICgwLCBfbG9kYXNoTGFuZ0Nsb25lRGVlcDJbJ2RlZmF1bHQnXSkoc291cmNlc1swXSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMubm9PdmVyd3JpdGUpIHtcbiAgICAgIGlmICghKDAsIF9sb2Rhc2hMYW5nSXNPYmplY3QyWydkZWZhdWx0J10pKHRhcmdldCkgfHwgISgwLCBfbG9kYXNoTGFuZ0lzT2JqZWN0MlsnZGVmYXVsdCddKShzb3VyY2VzWzBdKSkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGl0ZXJhdGVlKHNvdXJjZVZhbHVlLCBrZXkpIHtcbiAgICAgIHZhciB0YXJnZXRWYWx1ZSA9IHRhcmdldFtrZXldO1xuICAgICAgaWYgKG9wdHMuZmlsdGVyICYmICFvcHRzLmZpbHRlcihzb3VyY2VWYWx1ZSwgdGFyZ2V0VmFsdWUsIGtleSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmVzdWx0ID0gb3B0cy5kZWVwID8gb3B0cy5faW5uZXJNaXhlcih0YXJnZXRWYWx1ZSwgc291cmNlVmFsdWUpIDogc291cmNlVmFsdWU7XG4gICAgICB0YXJnZXRba2V5XSA9IG9wdHMudHJhbnNmb3JtID8gb3B0cy50cmFuc2Zvcm0ocmVzdWx0LCB0YXJnZXRWYWx1ZSwga2V5KSA6IHJlc3VsdDtcbiAgICB9XG5cbiAgICB2YXIgbG9vcCA9IG9wdHMuY2hhaW4gPyBfbG9kYXNoT2JqZWN0Rm9ySW4yWydkZWZhdWx0J10gOiBfbG9kYXNoT2JqZWN0Rm9yT3duMlsnZGVmYXVsdCddO1xuICAgIHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG4gICAgICBsb29wKG9iaiwgaXRlcmF0ZWUpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfc3RhbXBpdCA9IHJlcXVpcmUoJ3N0YW1waXQnKTtcblxudmFyIF9zdGFtcGl0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3N0YW1waXQpO1xuXG52YXIgX2N1aWQgPSByZXF1aXJlKCdjdWlkJyk7XG5cbnZhciBfY3VpZDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jdWlkKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLy9jb25zdGFudHNcbnZhciBBTllfVFJBTlNJVElPTiA9ICdBTlknO1xuXG52YXIgRVZFTlRTID0ge1xuICAgIElOVkFMSURfVFJBTlNJVElPTjogJ2ludmFsaWRUcmFuc2l0aW9uJyxcbiAgICBOT19IQU5ETEVSOiAnbm9IYW5kbGVyJyxcbiAgICBIQU5ETElORzogJ2hhbmRsaW5nJyxcbiAgICBIQU5ETEVEOiAnaGFuZGxlZCcsXG4gICAgSU5WT0tFRDogJ2ludm9rZWQnLFxuICAgIERFRkVSUkVEOiAnZGVmZXJyZWQnLFxuICAgIFRSQU5TSVRJT05FRDogJ3RyYW5zaXRpb25lZCdcbn07XG5cbnZhciBldmVudGVkID0gKDAsIF9zdGFtcGl0Mi5kZWZhdWx0KSgpLmluaXQoZnVuY3Rpb24gKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgZXZlbnRNb2RlbCA9ICgwLCBfc3RhbXBpdDIuZGVmYXVsdCkoKS5yZWZzKHtcbiAgICAgICAgdG9waWM6IHVuZGVmaW5lZCxcbiAgICAgICAgcGF5bG9hZDogdW5kZWZpbmVkLFxuICAgICAgICBzdGF0ZTogdW5kZWZpbmVkLFxuICAgICAgICB0aW1lc3RhbXA6IHVuZGVmaW5lZCxcbiAgICAgICAgaWQ6IHVuZGVmaW5lZCxcbiAgICAgICAgbmFtZXNwYWNlOiB1bmRlZmluZWRcbiAgICB9KS5pbml0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCk7XG4gICAgICAgIHRoaXMuaWQgPSAoMCwgX2N1aWQyLmRlZmF1bHQpKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmNyZWF0ZUV2ZW50ID0gZXZlbnRNb2RlbDtcbiAgICB0aGlzLmNvcHlFdmVudCA9IGZ1bmN0aW9uIChlLCB0b3BpYykge1xuICAgICAgICByZXR1cm4gX3RoaXMuY3JlYXRlRXZlbnQoe1xuICAgICAgICAgICAgdG9waWM6IHRvcGljIHx8IGUudG9waWMsXG4gICAgICAgICAgICBwYXlsb2FkOiBlLnBheWxvYWQsXG4gICAgICAgICAgICBzdGF0ZTogZS5zdGF0ZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b1VUQ1N0cmluZygpLFxuICAgICAgICAgICAgbmFtZXNwYWNlOiBlLm5hbWVzcGFjZSxcbiAgICAgICAgICAgIGlkOiAoMCwgX2N1aWQyLmRlZmF1bHQpKClcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICB0aGlzLm5hbWVzcGFjZWQgPSBmdW5jdGlvbiAodmFsdWUsIG5hbWVzcGFjZSkge1xuICAgICAgICBuYW1lc3BhY2UgPSBuYW1lc3BhY2UgfHwgX3RoaXMubmFtZXNwYWNlO1xuICAgICAgICB2YXIgZGVsaW1pdGVyID0gX3RoaXMuZW1pdHRlck9wdHMuZGVsaW1pdGVyIHx8ICcuJztcbiAgICAgICAgdmFyIHByZSA9ICcnO1xuICAgICAgICBpZiAobmFtZXNwYWNlKSB7XG4gICAgICAgICAgICBwcmUgPSAnJyArIG5hbWVzcGFjZSArIGRlbGltaXRlcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJycgKyBwcmUgKyB2YWx1ZTtcbiAgICB9O1xufSk7XG5cbi8qKlxuKiBwb3NzdW1zIGFyZSBldmVudCBlbWl0dGVyc1xuKiBQcm92aWRlIGVpdGhlciBhIGBlbWl0RXZlbnRgIGZ1bmN0aW9uIGZvciB0b3RhbCBjb250cm9sIG9mIHRoZSBtZXRob2Qgb2YgcHVibGljYXRpb247XG4qIG9yLCBwcm92aWRlIGEgYGVtaXRgIGV2ZW50IChzdXBwb3J0ZWQgYnkgYW55IG5vZGVqcyBFdmVudEVtaXR0ZXIgY2xvbmUpXG4qICovXG52YXIgZW1pdHRlciA9ICgwLCBfc3RhbXBpdDIuZGVmYXVsdCkoKS5pbml0KGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgIC8vZGVmYXVsdCBpbXBsXG4gICAgdGhpcy5lbWl0RXZlbnQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoIV90aGlzMi5lbWl0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BsZWFzZSBwcm92aWRlIGFuIGBlbWl0YCBvciBhbiBgZW1pdEV2ZW50YCBpbXBsZW1lbnRhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGUuZXZlbnQgPSBfdGhpczIubmFtZXNwYWNlZChlLnRvcGljKTtcbiAgICAgICAgX3RoaXMyLmVtaXQoZS5ldmVudCwgZSk7XG4gICAgICAgIHJldHVybiBfdGhpczI7XG4gICAgfTtcbn0pO1xuXG4vKipcbiAqIHJlcHJlc2VudHMgYSBzaW5nbGUgc3RhdGUgaW4gY29uZmlnIHBhc3NlZCBieSBgc3RhdGVzYFxuICpcbiAqICovXG52YXIgc3RhdGVNb2RlbCA9ICgwLCBfc3RhbXBpdDIuZGVmYXVsdCkoKS5yZWZzKHtcbiAgICBuYW1lOiB1bmRlZmluZWRcbn0pLmluaXQoZnVuY3Rpb24gKCkge1xuICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgaWYgKCF0aGlzLm5hbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdgbmFtZWAgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG4gICAgdmFyIGVudGVyID0gdm9pZCAwO1xuICAgIHZhciBleGl0ID0gdm9pZCAwO1xuICAgIHZhciBoYW5kbGVycyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gbm9vcCgpIHt9XG5cbiAgICB0aGlzLmVudHJ5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZW50ZXIgfHwgbm9vcDtcbiAgICB9O1xuICAgIHRoaXMuZXhpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGV4aXQgfHwgbm9vcDtcbiAgICB9O1xuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGlucHV0VHlwZSkge1xuICAgICAgICByZXR1cm4gaGFuZGxlcnNbaW5wdXRUeXBlXTtcbiAgICB9O1xuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaGFuZGxlcnMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgICBmb3IgKHZhciBpbnB1dFR5cGUgaW4gaGFuZGxlcnMpIHtcbiAgICAgICAgICAgIF90aGlzMy5oYW5kbGVyKGlucHV0VHlwZSwgaGFuZGxlcnNbaW5wdXRUeXBlXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuaGFuZGxlciA9IGZ1bmN0aW9uIChpbnB1dFR5cGUsIGZuKSB7XG4gICAgICAgIHN3aXRjaCAoaW5wdXRUeXBlKSB7XG4gICAgICAgICAgICBjYXNlICdfZW50ZXInOlxuICAgICAgICAgICAgICAgIGVudGVyID0gZm47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdfZXhpdCc6XG4gICAgICAgICAgICAgICAgZXhpdCA9IGZuO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBoYW5kbGVyc1tpbnB1dFR5cGVdID0gZm47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzMztcbiAgICB9O1xufSk7XG5cbi8qKlxuICogbWFwcyBzdGF0ZSBuYW1lcyB0byB0aGVpciBjb25maWcgYW5kIGV4cG9zZXNcbiAqIGFwaSBmb3IgcmV0cmlldmluZyBhbmQgc2V0dGluZyB0aGVtXG4gKlxuICogKi9cbnZhciBzdGF0ZXNDb2xsZWN0aW9uID0gKDAsIF9zdGFtcGl0Mi5kZWZhdWx0KSgpLmluaXQoZnVuY3Rpb24gKCkge1xuICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgdmFyIG1hcCA9IHt9O1xuXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAoc3RhdGVzKSB7XG4gICAgICAgIGZvciAodmFyIHN0YXRlTmFtZSBpbiBzdGF0ZXMpIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IHN0YXRlTW9kZWwoeyBuYW1lOiBzdGF0ZU5hbWUgfSk7XG4gICAgICAgICAgICBzdGF0ZS5zZXQoc3RhdGVzW3N0YXRlTmFtZV0pO1xuICAgICAgICAgICAgbWFwW3N0YXRlTmFtZV0gPSBzdGF0ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3RoaXM0O1xuICAgIH07XG4gICAgdGhpcy5nZXQgPSBmdW5jdGlvbiAoc3RhdGVOYW1lLCBpbnB1dFR5cGUpIHtcbiAgICAgICAgdmFyIGNmZyA9IG1hcFtzdGF0ZU5hbWVdO1xuICAgICAgICBpZiAoIWNmZykge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaGFuZGxlciA9IGNmZy5nZXQoaW5wdXRUeXBlKTtcbiAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoYW5kbGVyO1xuICAgIH07XG4gICAgdGhpcy5nZXRFbnRyeSA9IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgdmFyIGNmZyA9IG1hcFtzdGF0ZU5hbWVdO1xuICAgICAgICByZXR1cm4gY2ZnLmVudHJ5KCk7XG4gICAgfTtcbiAgICB0aGlzLmdldEV4aXQgPSBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgIHZhciBjZmcgPSBtYXBbc3RhdGVOYW1lXTtcbiAgICAgICAgcmV0dXJuIGNmZy5leGl0KCk7XG4gICAgfTtcbiAgICB0aGlzLmhhcyA9IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1hcCwgc3RhdGVOYW1lKTtcbiAgICB9O1xufSk7XG5cbi8qKlxuICogcG9zc3VtIGFwaVxuICpcbiAqICovXG52YXIgYXBpID0gKDAsIF9zdGFtcGl0Mi5kZWZhdWx0KSgpLnJlZnMoe1xuICAgIGVtaXR0ZXJPcHRzOiB7XG4gICAgICAgIHdpbGRjYXJkczogdHJ1ZSxcbiAgICAgICAgZGVsaW1pdGVyOiAnLicsXG4gICAgICAgIG5ld0xpc3RlbmVyOiB0cnVlLFxuICAgICAgICBtYXhMaXN0ZW5lcnM6IDEwXG4gICAgfVxufSkuc3RhdGljKHtcbiAgICAvKipcbiAgICAgKiBBc3NpZ24gc3RhdGVzIGNvbmZpZyB0byBpbnN0YW5jZVxuICAgICAqXG4gICAgICogQG1ldGhvZCBzdGF0ZXNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2ZnIHN0YXRlIDogaW5wdXRIYW5kbGVycyBwYWlyc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogcC5zdGF0ZXMoe1xuICAgICAqICAndW5pbml0aWFsaXplZCc6IHtcbiAgICAgKiAgICAgICdpbml0aWFsaXplZCc6IGZ1bmN0aW9uKGlucHV0VHlwZSwgYXJncykgeyAuLi59XG4gICAgICogICAgICAnYW5vdGhlcic6IGZ1bmN0aW9uKGlucHV0VHlwZSwgYXJncykgeyAuLi59XG4gICAgICogIH1cbiAgICAgKiB9KVxuICAgICAqIEByZXR1cm4ge3N0YW1wfVxuICAgICAqICovXG5cbiAgICBzdGF0ZXM6IGZ1bmN0aW9uIHN0YXRlcyhjZmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMoe1xuICAgICAgICAgICAgc3RhdGVzOiBjZmdcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc3RhdGUgdGFyZ2V0LiBVc2VzIGB0aGlzYCBpZiBub3QgcHJvdmlkZWQuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHRhcmdldFxuICAgICAqIEBwYXJhbSB7QW55fSBvYmogdGhlIG9iamVjdCBmb3Igc3RhdGUgdHJhY2tpbmdcbiAgICAgKiBAcmV0dXJuIHtzdGFtcH1cbiAgICAgKi9cbiAgICAsXG4gICAgdGFyZ2V0OiBmdW5jdGlvbiB0YXJnZXQob2JqKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3BzKHtcbiAgICAgICAgICAgIHRhcmdldDogb2JqXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb25maWd1cmUgdGhlIGluc3RhbmNlXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGNvbmZpZ1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhcmdzIGFueSBudW1iZXIgb2YgYXJncyB0byBjb25maWd1cmVcbiAgICAgKiBAcmV0dXJuIHtzdGFtcH1cbiAgICAgKiAqL1xuICAgICxcbiAgICBjb25maWc6IGZ1bmN0aW9uIGNvbmZpZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59KS5jb21wb3NlKGV2ZW50ZWQsIGVtaXR0ZXIpLmluaXQoZnVuY3Rpb24gKCkge1xuICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG4gICAgaWYgKCF0aGlzLmluaXRpYWxTdGF0ZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FuIGBpbml0aWFsU3RhdGVgIGNvbmZpZyBpcyByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIHZhciBoYW5kbGVycyA9IHN0YXRlc0NvbGxlY3Rpb24oKTtcbiAgICBoYW5kbGVycy5zZXQodGhpcy5zdGF0ZXMpO1xuXG4gICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0IHx8IHRoaXM7XG5cbiAgICB2YXIgaW52b2NhdGlvbnMgPSBbXTtcblxuICAgIHZhciBkZWZlcnJhbHMgPSB7fTtcblxuICAgIHZhciByZXBsYXkgPSBmdW5jdGlvbiByZXBsYXkoZGVmZXJyZWQsIGxhc3RSZXN1bHQpIHtcbiAgICAgICAgaWYgKCFkZWZlcnJlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBsYXN0UmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZXh0ID0gZGVmZXJyZWQuc2hpZnQoKTtcbiAgICAgICAgaWYgKGxhc3RSZXN1bHQgJiYgbGFzdFJlc3VsdC50aGVuKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFzdFJlc3VsdC50aGVuKF90aGlzNS5oYW5kbGUuYmluZChfdGhpczUsIG5leHQuaW5wdXRUeXBlLCBuZXh0LmFyZ3MpKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwbGF5KGRlZmVycmVkLCByZXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcGxheShkZWZlcnJlZCwgX3RoaXM1LmhhbmRsZShuZXh0LmlucHV0VHlwZSwgbmV4dC5hcmdzKSk7XG4gICAgfTtcblxuICAgIHZhciBkb25lID0gZnVuY3Rpb24gZG9uZShsZW4sIGNvbXBsZXRlZCwgcmVzdWx0KSB7XG4gICAgICAgIC8vcmVtb3ZlIHRoZSBpbnZvY2F0aW9uXG4gICAgICAgIGlmIChpbnZvY2F0aW9ucy5sZW5ndGggPj0gbGVuKSB7XG4gICAgICAgICAgICBpbnZvY2F0aW9ucy5zcGxpY2UobGVuIC0gMSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgX3RoaXM1LmVtaXRFdmVudChjb21wbGV0ZWQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY3VycmVudCBzdGF0ZVxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtTdHJpbmd9IGN1cnJlbnRTdGF0ZSB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgcG9zc3VtXG4gICAgICogKi9cbiAgICB0aGlzLmN1cnJlbnRTdGF0ZSA9IHRoaXMuaW5pdGlhbFN0YXRlO1xuICAgIC8qKlxuICAgICAqIFRoZSBwcmlvciBzdGF0ZVxuICAgICAqXG4gICAgICogQHByb3BlcnR5IHtTdHJpbmd9IHByaW9yU3RhdGUgdGhlIHByaW9yIHN0YXRlIG9mIHRoZSBwb3NzdW1cbiAgICAgKiAqL1xuICAgIHRoaXMucHJpb3JTdGF0ZSA9IHVuZGVmaW5lZDtcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBhbiBgaW5wdXRUeXBlYCB3aXRoIHRoZSBjb25maWd1cmUgc3RhdGVzIGhhbmRsZXJzXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGhhbmRsZSAtIHRoZSBwcmltYXJ5IGludGVyYWN0aW9uIHBvaW50IGZvciBjYWxsZXJzXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlucHV0VHlwZVxuICAgICAqIEBwYXJhbSB7QW55fSBbYXJnc11cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogbXlQb3NzdW0uaGFuZGxlKCdpbml0aWFsaXplJyx7IGlkOiAnMTIzJ30pXG4gICAgICogQHJldHVybiB7QW55fSB0aGUgcmVzdWx0IG9mIHRoZSBoYW5kbGVyIGNvbmZpZ3VyZWQgYnkgYHN0YXRlc2BcbiAgICAgKiAqL1xuICAgIHRoaXMuaGFuZGxlID0gZnVuY3Rpb24gKGlucHV0VHlwZSwgYXJncykge1xuICAgICAgICB2YXIgbGVuID0gaW52b2NhdGlvbnMucHVzaCh7IGlucHV0VHlwZTogaW5wdXRUeXBlLCBhcmdzOiBhcmdzIH0pO1xuICAgICAgICB2YXIgaGFuZGxlciA9IGhhbmRsZXJzLmdldChfdGhpczUuY3VycmVudFN0YXRlLCBpbnB1dFR5cGUpO1xuICAgICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgICAgIHZhciBub0hhbmRsZXIgPSBfdGhpczUuY3JlYXRlRXZlbnQoe1xuICAgICAgICAgICAgICAgIHRvcGljOiBFVkVOVFMuTk9fSEFORExFUixcbiAgICAgICAgICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIGlucHV0VHlwZTogaW5wdXRUeXBlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6IF90aGlzNS5uYW1lc3BhY2UsXG4gICAgICAgICAgICAgICAgc3RhdGU6IF90aGlzNS5jdXJyZW50U3RhdGVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgX3RoaXM1LmVtaXRFdmVudChub0hhbmRsZXIpO1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzNTtcbiAgICAgICAgfVxuICAgICAgICAvL2NyZWF0ZSBldmVudHNcbiAgICAgICAgdmFyIGhhbmRsaW5nID0gX3RoaXM1LmNyZWF0ZUV2ZW50KHtcbiAgICAgICAgICAgIHRvcGljOiBFVkVOVFMuSEFORExJTkcsXG4gICAgICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgICAgICAgYXJnczogYXJncyxcbiAgICAgICAgICAgICAgICBpbnB1dFR5cGU6IGlucHV0VHlwZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hbWVzcGFjZTogX3RoaXM1Lm5hbWVzcGFjZSxcbiAgICAgICAgICAgIHN0YXRlOiBfdGhpczUuY3VycmVudFN0YXRlXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgaW52b2tlZCA9IF90aGlzNS5jb3B5RXZlbnQoaGFuZGxpbmcsIEVWRU5UUy5JTlZPS0VEKTtcbiAgICAgICAgdmFyIGhhbmRsZWQgPSBfdGhpczUuY29weUV2ZW50KGhhbmRsaW5nLCBFVkVOVFMuSEFORExFRCk7XG5cbiAgICAgICAgLy9kbyBpdFxuICAgICAgICBfdGhpczUuZW1pdEV2ZW50KGhhbmRsaW5nKTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGhhbmRsZXIuY2FsbChfdGhpczUsIGFyZ3MsIHRhcmdldCk7XG4gICAgICAgIF90aGlzNS5lbWl0RXZlbnQoaW52b2tlZCk7XG5cbiAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQudGhlbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC50aGVuKGRvbmUuYmluZChfdGhpczUsIGxlbiwgaGFuZGxlZCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkb25lKGxlbiwgaGFuZGxlZCwgcmVzdWx0KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGVmZXJzIHRoZSBpbnZvY2F0aW9uIGZvciByZXBsYXkgYWZ0ZXIgdHJhbnNpdGlvblxuICAgICAqXG4gICAgICogQG1ldGhvZCBkZWZlclVudGlsVHJhbnNpdGlvblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbdG9TdGF0ZV0gb3B0aW9uYWxseSBwcm92aWRlIGEgdHJhbnNpdGlvblxuICAgICAqIGFmdGVyIHdoaWNoIHRvIHJlcGxheSB0aGlzIGludm9jYXRpb24uXG4gICAgICogQHJldHVybiB7UG9zc3VtfSB0aGUgcG9zc3VtIGluc3RhbmNlXG4gICAgICogKi9cbiAgICB0aGlzLmRlZmVyVW50aWxUcmFuc2l0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9TdGF0ZSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IEFOWV9UUkFOU0lUSU9OIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgIHZhciBjb2xsID0gZGVmZXJyYWxzW3RvU3RhdGVdIHx8IFtdO1xuICAgICAgICB2YXIgaW52b2NhdGlvbiA9IGludm9jYXRpb25zLnBvcCgpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBfdGhpczUuY3JlYXRlRXZlbnQoe1xuICAgICAgICAgICAgdG9waWM6ICdkZWZlcnJlZCcsXG4gICAgICAgICAgICBzdGF0ZTogX3RoaXM1LmN1cnJlbnRTdGF0ZSxcbiAgICAgICAgICAgIHBheWxvYWQ6IGludm9jYXRpb24sXG4gICAgICAgICAgICBuYW1lc3BhY2U6IF90aGlzNS5uYW1lc3BhY2VcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbGwucHVzaChpbnZvY2F0aW9uKTtcbiAgICAgICAgZGVmZXJyYWxzW3RvU3RhdGVdID0gY29sbDtcblxuICAgICAgICBfdGhpczUuZW1pdEV2ZW50KGRlZmVycmVkKTtcbiAgICAgICAgcmV0dXJuIF90aGlzNTtcbiAgICB9O1xuXG4gICAgdmFyIGRvVHJhbnNpdGlvbiA9IGZ1bmN0aW9uIGRvVHJhbnNpdGlvbih0b1N0YXRlLCB0YXJnZXQpIHtcbiAgICAgICAgX3RoaXM1LnByaW9yU3RhdGUgPSBfdGhpczUuY3VycmVudFN0YXRlO1xuICAgICAgICBfdGhpczUuY3VycmVudFN0YXRlID0gdG9TdGF0ZTtcbiAgICAgICAgdmFyIHRyYW5zaXRpb25lZCA9IF90aGlzNS5jcmVhdGVFdmVudCh7XG4gICAgICAgICAgICB0b3BpYzogJ3RyYW5zaXRpb25lZCcsXG4gICAgICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgICAgICAgdG9TdGF0ZTogX3RoaXM1LmN1cnJlbnRTdGF0ZSxcbiAgICAgICAgICAgICAgICBmcm9tU3RhdGU6IF90aGlzNS5wcmlvclN0YXRlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdGU6IF90aGlzNS5jdXJyZW50U3RhdGUsXG4gICAgICAgICAgICBuYW1lc3BhY2U6IF90aGlzNS5uYW1lc3BhY2VcbiAgICAgICAgfSk7XG4gICAgICAgIF90aGlzNS5lbWl0RXZlbnQodHJhbnNpdGlvbmVkKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gKGRlZmVycmFsc1t0b1N0YXRlXSB8fCBbXSkuY29uY2F0KGRlZmVycmFsc1tBTllfVFJBTlNJVElPTl0gfHwgW10pO1xuICAgICAgICBkZWxldGUgZGVmZXJyYWxzW3RvU3RhdGVdO1xuICAgICAgICBkZWxldGUgZGVmZXJyYWxzW0FOWV9UUkFOU0lUSU9OXTtcbiAgICAgICAgcmV0dXJuIHJlcGxheShkZWZlcnJlZCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUcmFuc2l0aW9uIHRvIGFub3RoZXIgc3RhdGUuXG4gICAgICogUHJlZmVyIGNhbGxpbmcgdGhpcyBpbnRlcm5hbGx5OyBlZyBpbnNpZGUgYSBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQG1ldGhvZCB0cmFuc2l0aW9uXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRvU3RhdGUgLSB0aGUgdGFyZ2V0IHRyYW5zaXRpb25cbiAgICAgKiBAcmV0dXJuIHtBbnl9IHRoZSByZXN1bHQgb2YgYW55IGRlZmVycmVkIGhhbmRsZXJzLCBpZiBhbnlcbiAgICAgKiAqL1xuICAgIHRoaXMudHJhbnNpdGlvbiA9IGZ1bmN0aW9uICh0b1N0YXRlKSB7XG4gICAgICAgIGlmICghaGFuZGxlcnMuaGFzKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICBfdGhpczUuZW1pdEV2ZW50KF90aGlzNS5jcmVhdGVFdmVudCh7XG4gICAgICAgICAgICAgICAgdG9waWM6IEVWRU5UUy5JTlZBTElEX1RSQU5TSVRJT04sXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBfdGhpczUubmFtZXNwYWNlLFxuICAgICAgICAgICAgICAgIHBheWxvYWQ6IHsgdG9TdGF0ZTogdG9TdGF0ZSwgZnJvbVN0YXRlOiBfdGhpczUuY3VycmVudFN0YXRlIH0sXG4gICAgICAgICAgICAgICAgc3RhdGU6IF90aGlzNS5jdXJyZW50U3RhdGVcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpczU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZmlyc3QgZXhpdCBjdXJyZW50IHN0YXRlXG4gICAgICAgIHZhciBleGl0ID0gaGFuZGxlcnMuZ2V0RXhpdChfdGhpczUuY3VycmVudFN0YXRlKTtcbiAgICAgICAgdmFyIGVudGVyID0gaGFuZGxlcnMuZ2V0RW50cnkodG9TdGF0ZSk7XG4gICAgICAgIHZhciByZXN1bHQgPSBleGl0LmNhbGwoX3RoaXM1LCB0YXJnZXQpO1xuICAgICAgICB2YXIgZG9UcmFuc2l0aW9uQm91bmQgPSBkb1RyYW5zaXRpb24uYmluZChfdGhpczUsIHRvU3RhdGUsIHRhcmdldCk7XG4gICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnRoZW4pIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQudGhlbihlbnRlci5iaW5kKF90aGlzNSkpLnRoZW4oZG9UcmFuc2l0aW9uQm91bmQpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IGVudGVyLmNhbGwoX3RoaXM1LCB0YXJnZXQpO1xuICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC50aGVuKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LnRoZW4oZG9UcmFuc2l0aW9uQm91bmQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkb1RyYW5zaXRpb25Cb3VuZCgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBHZXR0ZXIvc2V0dGVyIGZvciB0aGUgc3RhdGUgdGFyZ2V0IHRvIHBhc3NcbiAgICAgKiBpbnRvIGVhY2ggaGFuZGxlclxuICAgICAqXG4gICAgICogQG1ldGhvZCB0YXJnZXRcbiAgICAgKiBAcGFyYW0ge0FueX0gW29ial0gaWYgcHJvdmlkZWQsIFNFVCB0aGUgdGFyZ2V0XG4gICAgICogd2l0aCBgb2JqYDsgb3RoZXJ3aXNlLCBHRVQgdGhlIHRhcmdldFxuICAgICAqIEByZXR1cm4ge0FueX0gdGhlIHRhcmdldFxuICAgICAqICovXG4gICAgdGhpcy50YXJnZXQgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIGlmIChvYmopIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQgPSBvYmo7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9O1xufSk7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGFwaTsiXX0=
