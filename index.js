var primitives = ['boolean', 'number', 'undefined', 'string', 'object'];
var canOverwriteTypes = false;

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
      var result;
      try {
        result = type(obj);
      } catch(e) {
        throw new Error (pretty(obj) + ' failed ' + type);
      }
      if (result === false) throw new Error(pretty(obj) + ' failed ' + type);
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
        if (!types[type](obj)) {
          throw new Error(pretty(obj) + ' should be a ' + pretty(type));
        }
      }
      // arrays : "[type]"
      else if (type.charAt(0) === '[' &&
          type.charAt(type.length-1) === ']') {
        var typeName = type.slice(1, -1);
        var checkType = userTypes[typeName] || types[typeName] ||
          (primitives.indexOf(typeName) !== -1 && typeName);

        // if not a known type and not an optional type, then pass thru
        if (!checkType) { checkType = typeName; }
        if (!Array.isArray(obj)) {
          throw new Error(pretty(obj) +
              ' should be an array of ' + typeName);
        }
        if (obj.length === 0) {
          return;
        }
        for (var i = 0; i < obj.length; i++) {
          is(obj[i], checkType);
        }
      }
      // primitive types
      else if (typeof(obj) !== type) {
        throw new Error(pretty(obj) + ' should be ' + type);
      }
      break;

    case 'object':
      if (typeof obj !== 'object') {
        throw new Error(pretty(obj) + ' should be an object');
      }
      if (obj === null) {
        throw new Error(pretty(obj) + ' is not of type ' + pretty(type));
      }
      // {} case
      for (var e in type) {
        if (!type.hasOwnProperty(e)) { continue; }
        if (typeof obj[e] === undefined && type[e].charAt &&
            type[e].charAt(type[e].length - 1) !== '?') {
          throw new Error(pretty(obj) + ' does not contain field ' + e +
            ' for requirement ' + pretty(type));
        }
        is(obj[e], type[e]);
      }

      break;
      default:
        throw new Error('Not a valid requirement: ' + pretty(type) +
            ' for ' + pretty(obj));
    }
}

function check(obj) {
  return {
    is: function(type, msg) {
      try {
        is(obj, type);
      } catch(e) {
        console.error(e.stack);
        if (msg) { throw new Error(msg); }
        throw new Error(pretty(obj) + ' is NOT ' + pretty(type));
      }
      return true;
    },
    isnot: function(type, msg) {
      var isIt = true;
      try {
        is(obj, type);
      } catch(e) {
        isIt = false;
      }
      if (isIt) {
        if (msg) { throw new Error(msg); }
        throw new Error(pretty(obj) + ' IS ' + pretty(type));
      }
    }
  };
}

function addType(key, checker) {
  check(key).is('string');
  if (!canOverwriteTypes) {
    check(userTypes[key]).is('undefined',
      'Overwriting existing types not allowed: ' + key);
  }
  userTypes[key] = checker;
  return check;
}

function addTypes(obj) {
  check(obj).is('object');
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      addType(key, obj[key]);
    }
  }
  return check;
}

function clearTypes() {
  userTypes = {};
}

function allowOverwritingTypes() {
  canOverwriteTypes = true;
}

check.addType = addType;
check.addTypes = addTypes;
check.clearTypes = clearTypes;
check.allowOverwritingTypes = allowOverwritingTypes;

module.exports = check;
