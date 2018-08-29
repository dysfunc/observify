[![Build Status](https://travis-ci.com/dysfunc/observify.svg?branch=master)](https://travis-ci.com/dysfunc/observify) [![Coverage Status](https://coveralls.io/repos/github/dysfunc/observify/badge.svg)](https://coveralls.io/github/dysfunc/observify) [![npm version](https://badge.fury.io/js/observify-js.svg)](https://badge.fury.io/js/observify-js) [![dependencies Status](https://david-dm.org/dysfunc/observify.svg)](https://david-dm.org/dysfunc/observify)

# Observify JS

Observify is a bare-bones observable and eventing library using Proxies. This library enables you to attach event handlers to your objects so you can be notified when specific properties change. This will also allow you to lock and unlock write access to any property of an object.

* [Babel 7](https://babeljs.io/)
* [Webpack 4](https://webpack.github.io/)
* [Jasmine](http://jasmine.github.io/)
* [Chai](http://www.chaijs.com/)
* [Sinon](https://sinonjs.org/)
* [Karma](http://karma-runner.github.io/)
* [Istanbul](https://github.com/deepsweet/istanbul-instrumenter-loader)

## Install
You can install via NPM or Bower

**NPM**
```js
npm i observify-js --save
```

**Bower**
```js
bower i observify-js
```

## Importing

**Browser**
```html
<script type="text/javascript" src="_your_modules_path/observify.min.js"></script>
```

**Module**
```js
import Observify from 'Observify';
```

**Require**
```js
const Observify = require('Observify');
```

**RequireJS**
```js
require("Observify", function(Observify){
  ...
});
```
## Examples
### .listen
You can bind change listeners to any prop regardless of its type. Deeply nested props can be bound using dot notation.

#### Listen to root level object property changes
```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

person.listen('age', function(newValue, oldValue, propName, eventname) {
  console.log(newValue, oldValue);
});

person.age++;

>> 15, 14
```

#### Listen to nested object property changes
```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

person.listen('tshirt.logo.brand', function(newValue, oldValue, propPath) {
  console.log(newValue, oldValue);
});

person.tshirt.logo.brand = 'rvca';

>> rvca, volcom
```

### .unlisten
You can unbind one or all listeners bound to an object property

#### Remove a single listener
```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

const ageChangeCallback = function(newValue, oldValue) {
  console.log('The persons age was changed from:', oldValue, ' to ', newValue);
};

person.listen('age', ageChangeCallback);

person.listen('age', function(newValue, oldValue) {
  console.log('Secondary callback', oldValue, ' to ', newValue);
});

person.age++;

>> The persons age was changed from: 14 to 15
>> Secondary callback 14 to 15

// remove listener
person.unlisten('age', ageChangeCallback);

person.age++;

>> Secondary callback 14 to 15
```

#### Remove all listeners
```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

const ageChangeCallback = function(newValue, oldValue) {
  console.log('The persons age was changed from:', oldValue, ' to ', newValue);
};

person.listen('age', ageChangeCallback);

person.listen('age', function(newValue, oldValue) {
  console.log('Secondary callback', oldValue, ' to ', newValue);
});

person.age++;

>> The persons age was changed from: 14 to 15
>> Secondary callback 14 to 15

// remove listener
person.unlisten('age');

person.age++;

>>
```

### .on
You can create and dispatch custom events to control object updates and/or handle any additional logic needed.

### Creating a custom event
```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

person.on('changeAge', function(){ this.age++ });

person.listen('age', function(newValue, oldValue) {
  console.log('The persons age was changed from:', oldValue, ' to ', newValue);
});

person.trigger('changeAge');

>> The persons age was changed from: 14 to 15
```

### .off
You can unbind one or all namespaced event callbacks

#### Remove a single callback
```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

const onChanegAge = function(){ this.age++ };

person.on('changeAge', onChanegAge);

person.trigger('changeAge');

>> 15

person.off('changeAge', onChanegAge);

person.trigger('changeAge');

>>
```

#### Remove all callbacks

```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

person.on('changeAge', function(){
   console.log('callback 1');
});

person.on('changeAge', function(){
   console.log('callback 2');
});

person.on('changeAge', function(){
   console.log('callback 3');
});

person.trigger('changeAge');

>> callback 1
>> callback 2
>> callback 2

person.off('changeAge');

person.trigger('changeAge');

>>
```

### .trigger
Once you've created some custom events you can invoke them using `.trigger`

#### Invoking a custom event
```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

person.on('changeAge', function(){
   console.log('callback 1');
});

person.trigger('changeAge');

>> callback 1
```

### .lock
You can prevent writes (aka lock) to the entire object or specific properties. Any associated listeners will be ignored once a property has been locked.

#### Invoking a custom event
```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

person.lock('tshirt.logo');

person.tshirt.logo.brand = 'rvca';

>> person.tshirt.logo.brand is still 'volcom'

```

### .unlock

You can unlock a property to make changes and lock it again (if needed). Once a property has been unlocked all property listeners will be restored.
```js
const person = Observify({
  eyes: 'green',
  age: 14,
  hair: 'brown',
  tshirt: {
    color: 'white',
    logo: {
      brand: 'volcom'
    }
  }
});

person.lock('tshirt.logo');

person.tshirt.logo.brand = 'rvca';

>> person.tshirt.logo.brand is still 'volcom'

person.unlock('tshirt.logo');

person.tshirt.logo.brand = 'rvca';

>> person.tshirt.logo.brand is now 'rvca';
```


### Setup
```
npm install
```

### Tests
To start Karma and execute all unit tests, run:

```
npm test
```

### Coverage
To start Karma and generate a coverage report after executing all unit tests, run:

```
npm run coverage
```
