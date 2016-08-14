var types = {
  posInt: function(i) {
    return ((typeof i === 'number') && (i % 1 === 0) && (i >= 0));
  },
  int: function(i) {
    return ((typeof i === 'number') && (i % 1 === 0));
  },
  date: function(d) {
    return Object.prototype.toString.call(d) === '[object Date]';
  },
  array: function(a) {
    return Array.isArray(a);
  },
  null: function(e) {
    return e === null;
  },
  object: function(obj) {
    return typeof obj === 'object';
  },
  buffer: function(b) {
    return Buffer.isBuffer(b);
  }
};

var primitiveTypes = ['boolean', 'number', 'undefined', 'string', 'object'];

function pretty(obj) {
  var serialized;
  try {
    serialized = JSON.stringify(obj, null, 2);
  } catch(e) {
    serialized = 'object';
  }
  return serialized;
}

var userTypes = {};
function is(obj, type) {
  switch (typeof type) {
    // Check for constructor, or arbitrary function to apply to obj
    case 'function':
      if (obj instanceof type) { return; }
      if (!type(obj)) throw pretty(obj) + ' failed ' + type;
      break;

    case 'string':
      // optional types
      var optType = type.charAt(type.length - 1) === '?' ?
        type.slice(0, -1) :
        undefined;
      // success if optional type and undefined value
      if (optType) {
        if (obj === undefined) return;
        type = optType;
      }
      // user defined types
      if (userTypes[type]) {
        is(obj, userTypes[type]);
      }
      // default types
      else if (types[type]) {
        if (! types[type](obj)) {
          throw pretty(obj) + ' should be a ' + pretty(type);
        }
      }
      // arrays : "[type]"
      else if (type.charAt(0) === '[' && type.charAt(type.length-1) === ']') {
        if (type.length === 2) throw 'Empty type array, should be "[type]".';
        var typeName = type.slice(1, -1);
        var checkType = userTypes[typeName] || types[typeName] ||
          (primitiveTypes.indexOf(typeName) && typeName);

        // optional type arrays
        var optTypeName;
        if (!checkType && typeName.charAt(typeName.length - 1) === '?') {
          optTypeName = typeName.slice(0, -1);
          checkType = userTypes[optTypeName] || types[optTypeName] ||
            // arrays with optional primitive types
            (primitiveTypes.indexOf(optTypeName) !== -1 && optTypeName);
        }
        if (!checkType) throw 'Nonexistent type, ' + typeName;
        if (!Array.isArray(obj)) {
          throw pretty(obj) + ' should be an array of ' + typeName;
        }
        if (obj.length === 0) {
          return;
        }
        for (var i = 0; i < obj.length; i++) {
          if (optTypeName && obj[i] === undefined) continue;
          is(obj[i], checkType);
        }
      }
      // primitive types
      else if (typeof(obj) !== type) {
        throw pretty(obj) + ' should be ' + type;
      }
      break;

    case 'object':
      if (typeof obj !== 'object') throw pretty(obj) + ' should be an object';
      if (obj === null) throw pretty(obj) + ' is not of type ' + pretty(type);
      // {} case
      for (var e in type) {
        if (!type.hasOwnProperty(e)) { continue; }
        if (typeof obj[e] === undefined && type[e].charAt &&
            type[e].charAt(type[e].length - 1) !== '?') {
          throw pretty(obj) + ' does not contain field ' + e +
            ' for requirement ' + pretty(type);
        }
        is(obj[e], type[e]);
      }

      break;
      default:
        throw 'Not a valid requirement: ' + pretty(type) + ' for ' + pretty(obj);
    }
}

function check(obj) {
  return {
    is: function(type, err) {
      try {
        is(obj, type);
      } catch(e) {
        if (err) { throw err; }
        console.error(e);
        throw new Error(pretty(obj) + ' fails to meet ' + pretty(type));
      }
      return true;
    }
  };
}

function addTypes(obj) {
  check(obj).is('object');
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      check(userTypes[key]).is('undefined',
          'Overwriting existing types not allowed');

      userTypes[key] = obj[key];
    }
  }
  return check;
}

function addType(key, checker) {
  check(key).is('string');
  check(checker).is('function');
  check(userTypes[key]).is('undefined',
      'Overwriting existing types not allowed');

  userTypes[key] = checker;
  return module.exports;
}

module.exports = check;
module.exports.addTypes = addTypes;
module.exports.addType = addType;
