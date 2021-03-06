var check = require('.');

function Something() {}
var types = {
  myCrazyObject: {
    // Primitive type checking.
    a: 'string',
    b: 'number',
    c: 'boolean',
    d: 'function',
    e: 'object',
    // Defined types
    f: 'int',
    g: 'null',
    h: 'buffer',
    i: 'date',
    // Functions
    j: function(e){ return e === 42; },
    // Arrays
    k: '[int]',
    // User defined types
    l: 'otherObj',
    // Arrays with optional type
    m: '[string?]',
    // Arrays of user defined types
    n: '[otherObj]',
    // Optional types
    o: 'number?',
    // Optional user defined types
    p: '[otherObj?]',
    // Constructors
    q: Something,
    // Arrays with primitive types
    r: '[number]'
  },

  otherObj : {
    a : 'int',
    b : 'otherObj?'
  },

  dummyVals: '[dummyType?]',
  someVal: 'someType',
  boolArrArr: '[[boolean]]'
};

// can add multiple types
check.addTypes(types);
check.addType('dummyType', function(val) {
  return val === 'dummy';
});
check.addTypes({
  someType: function(val) {
    return val !== undefined;
  }
});

var toCheck = {
  a: 'domo arigato',
  b: 3.14159,
  c: false,
  d: function(){},
  e: {},
  f: 42,
  g: null,
  h: new Buffer(1),
  i: new Date(),
  j: 42,
  k: [1,2,3,4],
  l: {a:1, b: {a:1, b:undefined}},
  m: ['abc', undefined, 'def'],
  n: [{a:1, b:undefined}, {a:1, b:undefined}],
  p: [undefined, {a:1, b:undefined}],
  q: new Something(),
  r: [0, 12.5, -13],
  otherObj: {a: 1, b: {a: 2, b: {a: 3, b: null}}},
  dummyVals: ['dummy', undefined, 'dummy'],
  someVal: true,
  boolArrArr: [[true]],
};

check(toCheck).is('myCrazyObject');
check({ prop: [[true], [false]] }).is({ prop: '[[boolean]]' });
check([[]]).is('[[]]');

check(toCheck).isnot('string');
check({ prop: true }).isnot('array');

console.log('verified');
