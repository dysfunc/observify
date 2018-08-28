import Observify from './index';
// use custom deep compare since Symbols
import { deepCompare } from '../tests/utils/objects';

describe('Observify', function(){
  const object = {
    name: 'Bobert',
    age: 21,
    drink: true,
    smoke: false,
    description: {
      eyes: 'blue',
      hair: 'brown',
      skin: 'purple',
      weight: 180,
      height: 73,
      tattoos: {
        arm: 'mariokart',
        leg: 'i love mom heart',
        back: 'japanese waves'
      }
    },
    nicknames: [
      'shorty',
      'tiny',
      'smalls'
    ]
  };

  describe('Basics', function(){
    it('should be defined', function(){
      expect(Observify).toBeDefined();
    });

    const person = Observify(object);

    it('should return a new Proxy object', function(){
      // verify lib methods exist at the root of the object
      expect(person.listen).toBeDefined();
      expect(person.unlisten).toBeDefined();
      expect(person.on).toBeDefined();
      expect(person.off).toBeDefined();
      expect(person.lock).toBeDefined();
      expect(person.unlock).toBeDefined();
    });

    it('should have an identical object structure', function(){
      const keys = Object.keys(person);

      expect(keys).toEqual(Object.keys(object));

      expect(deepCompare(person, object)).toBe(true);
    });
  });
});
