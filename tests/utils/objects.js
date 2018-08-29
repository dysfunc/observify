/**
 * Custom object compare instead of Jasmine deep compare matchers
 * since they stringify which results in Symbol to string issues.
 */
export const compareObjects = function(){
  let i, l, leftChain, rightChain;

  function compare2Objects(x, y){
    let p;

    // avoid NaN check here since it will throw on Symbol
    if(typeof x === 'number' && typeof y === 'number'){
      return true;
    }

    // Compare primitives and functions.
    // Check if both arguments link to the same object.
    // Especially useful on the step where we compare prototypes
    if(x === y){
      return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if(
      (typeof x === 'function' && typeof y === 'function') ||
      (x instanceof Date && y instanceof Date) ||
      (x instanceof RegExp && y instanceof RegExp) ||
      (x instanceof String && y instanceof String) ||
      (x instanceof Number && y instanceof Number)
    ){
      return x.toString() === y.toString();
    }

    // Check for infinitive linking loops
    if(leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1){
      return false;
    }

    // Quick checking of one object being a subset of another.
    // todo: cache the structure of arguments[0] for performance
    for(p in y){
      if(y.hasOwnProperty(p) !== x.hasOwnProperty(p)){
        return false;
      }

      if(typeof y[p] !== typeof x[p]){
        return false;
      }
    }

    for(p in x){
      if(y.hasOwnProperty(p) !== x.hasOwnProperty(p)){
        return false;
      }

      if(typeof y[p] !== typeof x[p]){
        return false;
      }

      switch (typeof (x[p])){
        case 'object':
        case 'function':

          leftChain.push(x);
          rightChain.push(y);

          if(!compare2Objects (x[p], y[p])){
            return false;
          }

          leftChain.pop();
          rightChain.pop();
          break;

        default:
          if(x[p] !== y[p]){
            return false;
          }
          break;
      }
    }

    return true;
  }

  if(arguments.length < 1){
    return true;
  }

  for(i = 1, l = arguments.length; i < l; i++){
    leftChain = []; //Todo: this can be cached
    rightChain = [];

    if(!compare2Objects(arguments[0], arguments[i])){
      return false;
    }
  }

  return true;
}
