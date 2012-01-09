var nodeunit = require('nodeunit');
var same = require('../index.js')

module.exports = nodeunit.testCase({

    setUp: function (setUpFinished) {
    	setUpFinished();
    },

    tearDown: function (teardownFinished) {
        teardownFinished();
    },

    'Test ignoring property that is missing in one object': function(test) {
        var obj1 = {
            name: 'Navin Johnson'
        };

        var obj2 = {
            id: 1234,
            name: 'Navin Johnson'
        };

        areEqual = same.same(obj1, obj2, { ignorePaths: ['id'] /*, logFcn: console.log*/ });
        test.equal(areEqual, true);

        test.done();
    },

    'Test ignoring paths when both objects have same property names': function(test) {
        var obj1 = {
            id: 1234,
            name: 'Navin Johnson',
            homeTown: { city: 'Portland',  state: 'ME' },
            currTown: { city: 'St. Louis', state: 'MO' }
        };

        var obj2 = {
            id: 5678,
            name: 'Navin Johnson',
            homeTown: { city: 'Portland', state: 'OR' },
            currTown: { city: 'Brooklyn', state: 'NY'}
        };

        var areEqual = same.same(obj1, obj2 /*, { logFcn: console.log }*/);
        test.equal(areEqual, false, 'currTown.city should have been detected as inequal');

        areEqual = same.same(obj1, obj2, { ignorePaths: ['id', 'homeTown.state', 'currTown'] /*, logFcn: console.log*/ });
        test.equal(areEqual, true);

        test.done();
    },

    'Test comparing objects with ignore paths that apply to array elements': function(test) {
        var obj1 = {
            name: 'Navin Johnson',
            kids: [ { firstName: 'Willy', lastName: 'Johnson' }, { firstName: 'Billy', lastName: 'Johnson' } ]
        };

        var obj2 = {
            name: 'Navin Johnson',
            kids: [ { lastName: 'Johnson', id: 123, firstName: 'Billy' }, { id: 456, firstName: 'Willy', lastName: 'Johnson' } ]
        };

        var areEqual = same.same(obj1, obj2 /*, { logFcn: console.log }*/);
        test.equal(areEqual, false, 'kids.id should have been detected as inequal');

        areEqual = same.same(obj1, obj2, { ignorePaths: ['kids.id'] , logFcn: console.log});
        test.equal(areEqual, true);

        test.done();
    },

    'Test comparing arrays with same contents but in different order': function(test) {
        var arr = [ { name: 'Steve Martin' }, { name: 'M. Emmet Walsh' }, { name: 'Steve Martin' } ];
        var sameArrInDiffOrder = [{ name: 'M. Emmet Walsh' }, { name: 'Steve Martin' }, { name: 'Steve Martin' }];

        var areEqual = same.same(arr, sameArrInDiffOrder);
        test.equal(areEqual, true);

        areEqual = same.same(arr, sameArrInDiffOrder, { strictArrOrder: true });
        test.equal(areEqual, false);

        test.done();
    },

    'Test comparing objects with same contents but properties in different order': function(test) {
        var obj = { a: 1, b: true, c: new Date(1922, 2, 20) };
        var reorderedPropsObj = { b: true, c: new Date(1922, 2, 20), a: 1 };

        var areEqual = same.same(obj, reorderedPropsObj);
        test.equal(areEqual, true);

        areEqual = same.same(obj, reorderedPropsObj, { strictObjPropsOrder: true });
        test.equal(areEqual, false);

        test.done();
    },

    'areEqual is true with properties and array element in diff order': function (test) {
        var movie1 = {
            name: 'The Jerk',
            year: 1979,
            director: { name: 'Carl Reiner', born: new Date(1922, 2, 20) },
            wonOscar: false,
            cast: [
                { name: 'Steve Martin', character: 'Navin', quotes: ['He hates these cans!', 'The new phone book\'s here!'] },
                { name: 'M. Emmet Walsh', character: 'Sniper', quotes: ['Die, you random son of a bitch.'] },
                { name: 'Steve Martin', character: 'Cat Juggler' }
            ]
        };

        var movie2 = {
            director: { born: new Date(1922, 2, 20), name: 'Carl Reiner' },
            cast: [
                { name: 'Steve Martin', character: 'Cat Juggler' },
                { name: 'Steve Martin', character: 'Navin', quotes: ['He hates these cans!', 'The new phone book\'s here!'] },
                { name: 'M. Emmet Walsh', character: 'Sniper', quotes: ['Die, you random son of a bitch.'] }
            ],
            wonOscar: false,
            name: 'The Jerk',
            year: 1979
        };

        test.ok(same.same(movie1, movie2));
        test.done();
    },

    'areEqual is false when a property is different': function (test) {
        var movie1 = {
            name: 'The Jerk',
            year: 1979,
            director: { name: 'Carl Reiner', born: new Date(1922, 2, 20) },
            wonOscar: false,
            cast: [
                {
                    name: 'Steve Martin',
                    character: 'Navin',
                    quotes: ['He hates these cans!', 'The new phone book\'s here!']
                },
                {
                    name: 'M. Emmet Walsh',
                    character: 'Sniper',
                    quotes: ['Die, you random son of a bitch.']
                },
                {
                    name: 'Steve Martin',
                    character: 'Cat Juggler'
                }
            ]
        };

        var movie2 = {
            director: { born: new Date(1922, 2, 20), name: 'Carl Reiner' },
            cast: [
                {
                    name: 'Steve Martin',
                    character: 'Cat Juggler'
                },
                {
                    name: 'Steve Martin',
                    character: 'Navin',
                    quotes: ['The new phone book\'s here!', 'He hates these cans!']
                },
                {
                    name: 'M. Emmet Walsh',
                    character: 'Sniper',
                    quotes: ['Die, you random son of a bitch.']
                }
            ],
            wonOscar: false,
            name: 'The Jerk',
            year: 1978
        };

        test.equal(same.same(movie1, movie2), false);
        test.done();
    }
});