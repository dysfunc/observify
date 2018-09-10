import Observify from './index';
import sinon from 'sinon';
import { expect } from 'chai';

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

  const person = Observify(object);

  describe('Basics', function(){
    it('should be defined', function(){
      expect(Observify).to.not.be.undefined;
    });

    it('should return a new Proxy object', function(){
      // verify lib methods exist at the root of the object
      expect(person.listen).to.not.be.undefined;
      expect(person.unlisten).to.not.be.undefined;
      expect(person.on).to.not.be.undefined;
      expect(person.off).to.not.be.undefined;
      expect(person.lock).to.not.be.undefined;
      expect(person.unlock).to.not.be.undefined;
    });

    it('should match the source object', function(){
      expect(person).to.eql(object);
    });
  });

  describe('#listen / #unlisten', function(){
    const sandbox = sinon.createSandbox();

    afterEach(function() {
      sandbox.restore();
    });

    it('should trigger the callback on the property change (integer)', function(){
      const ageChange = sandbox.stub();

      person.listen('age', ageChange);

      person.age++;

      expect(ageChange.getCall(0).args).to.eql([ 22, 21, 'age' ]);
      expect(ageChange.calledOnce).to.be.true;

      person.unlisten('age', ageChange);
    });

    it('should trigger the callback on the property change (array)', function(){

      const nicknamesChange = sandbox.stub();

      person.listen('nicknames', nicknamesChange);

      // .pop()
      const popped = person.nicknames.pop();

      expect(nicknamesChange.getCall(0).args).to.eql([['shorty','tiny'], ['shorty', 'tiny', 'smalls'], 'nicknames']);
      expect(nicknamesChange.calledOnce).to.be.true;
      expect(person.nicknames.length).to.equal(2);
      expect(popped).to.equal('smalls');


      // .shift()
      const shifted = person.nicknames.shift();

      expect(nicknamesChange.getCall(1).args).to.eql([['tiny'], ['shorty', 'tiny'], 'nicknames']);
      expect(person.nicknames.length).to.equal(1);
      expect(shifted).to.equal('shorty');

      // .push()

      const pushed = person.nicknames.push('who dis');
      expect(person.nicknames.length).to.equal(2);

      expect(nicknamesChange.getCall(2).args).to.eql([['tiny', 'who dis'], ['tiny'], 'nicknames']);

      // .unshift()

      const unshift = person.nicknames.unshift('who dat');
      expect(person.nicknames.length).to.equal(3);

      expect(nicknamesChange.getCall(3).args).to.eql([['who dat','tiny', 'who dis'], ['tiny', 'who dis'], 'nicknames']);

      person.unlisten('nicknames', nicknamesChange);
    });

    it('should trigger the callback on the property change (object)', function(){

      // single property

      const descriptionChange = sandbox.stub();

      person.listen('description', descriptionChange);

      person.description.eyes = 'green';

      expect(descriptionChange.getCall(0).args).to.eql(['green', 'blue', 'description.eyes']);

      // entire object

      person.description = { hello: 'world' };

      expect(descriptionChange.getCall(1).args).to.eql([{
        hello: 'world'
      },{
        eyes: 'green',
        hair: 'brown',
        skin: 'purple',
        weight: 180,
        height: 73,
        tattoos: {
          arm: 'mariokart',
          leg: 'i love mom heart',
          back: 'japanese waves'
        }
      }, 'description']);

      person.unlisten('description', descriptionChange);

      person.description = {
        eyes: 'green',
        hair: 'brown',
        skin: 'purple',
        weight: 180,
        height: 73,
        tattoos: {
          arm: 'mariokart',
          leg: 'i love mom heart',
          back: 'japanese waves'
        }
      };
    });

    it('should trigger the callback on the property change (nested objects)', function(){

      const armChange = sandbox.stub();

      person.listen('description.tattoos.arm', armChange);

      person.description.tattoos.arm = 'butterfly';

      expect(armChange.getCall(0).args).to.eql(['butterfly', 'mariokart', 'description.tattoos.arm']);

      person.unlisten('description.tattoos.arm');
    });

    it('should NOT trigger the callback when the new value is the same as the old value', function(){
      const ageChange = sandbox.stub();

      person.listen('age', ageChange);

      person.age = 22;

      expect(ageChange.calledOnce).to.be.false;
    });
  });

  describe('#lock / #unlock', function(){
    const sandbox = sinon.createSandbox();

    afterEach(function() {
      sandbox.restore();
    });

    it('should prevent any writes to the locked property (root-level property)', function(){

      person.lock('age');

      expect(person.age).to.equal(22);

      person.age++;

      expect(person.age).to.equal(22);
    });

    it('should allow writes after unlocking property (root-level - integer)', function(){

      expect(person.age).to.equal(22);

      person.unlock('age');

      person.age++;

      expect(person.age).to.equal(23);
    });

    it('should prevent any writes to the locked property (nested property - integer)', function(){
      person.lock('description.height');

      expect(person.description.height).to.equal(73);

      person.description.height++;

      expect(person.description.height).to.equal(73);
    });

    it('should allow writes after unlocking property (nested property - integer)', function(){
      expect(person.description.height).to.equal(73);

      person.unlock('description.height');

      person.description.height++;

      expect(person.description.height).to.equal(74);
    });

    it('should lock and unlock the entire object', function(){
      expect(person.age).to.equal(23);

      person.lock();
      person.age++;
      person.unlock();

      person.age++;

      expect(person.age).to.equal(24);
    });

    // ISSUE - Arrays need to lock properly :|
    // it('should prevent any writes to the locked property (root-level array)', function(){
    //   person.lock('nicknames');
    //
    //   expect(person.nicknames.length).to.equal(3);
    //
    //   person.nicknames.pop();
    //
    //   expect(person.nicknames.length).to.equal(3);
    // });
  });

  describe('#DOM Nodes', function(){
    const video = document.createElement('video');

    const proxy = Observify(video);

    const sandbox = sinon.createSandbox();

    afterEach(function() {
      sandbox.restore();
    });

    it('should returned a wrapped DOM node', function(){
      expect(proxy.play).to.not.be.undefined;
      expect(proxy.currentTime).to.not.be.undefined;
      expect(proxy.muted).to.not.be.undefined;
      expect(proxy.listen).to.not.be.undefined;
      expect(proxy.unlisten).to.not.be.undefined;
      expect(proxy.on).to.not.be.undefined;
      expect(proxy.off).to.not.be.undefined;
      expect(proxy.lock).to.not.be.undefined;
      expect(proxy.unlock).to.not.be.undefined;
    });

    it('should prevent changes to the element styles (pseudo locking)', function(){

      proxy.lock('style');

      proxy.style.width = '100px';

      expect(proxy.style.width).to.equal('');

      proxy.style.height = '100px';

      expect(proxy.style.height).to.equal('');

      proxy.unlock('style.height');

      proxy.style.height = '100px';

      expect(proxy.style.height).to.equal('100px');

      proxy.unlock('style');

      proxy.style.width = '100px';

      expect(proxy.style.width).to.equal('100px');
      expect(proxy.style.height).to.equal('100px');
    });

    it('should prevent changes to the element props (prop locking)', function(){
      proxy.lock('innerHTML');

      proxy.innerHTML = '<div id="hello">world</div>';

      expect(proxy.innerHTML).to.equal('');

      proxy.unlock('innerHTML');

      proxy.innerHTML = '<div id="hello">world</div>';

      expect(proxy.querySelectorAll('#hello').length).to.equal(1);
    });
  });
});
