var _ = require('underscore');

exports.same = function(thing1, thing2, cfg) {
    cfg = cfg || {};
    var log = cfg.logFcn || function(){};

    if( _.isArray(thing1) && _.isArray(thing2) ) {
        // If BOTH things are arrays, we should use a special function to compare
        return exports.arraysHaveSameContents(thing1, thing2, cfg);
    }
    else if( typeof thing1 === 'object' && typeof thing2 === 'object' ) {
        // If BOTH things are objects, we should use a special function to compare
        return exports.objectsAreEqual(thing1, thing2, cfg);
    }
    else {
        var areEqual = (thing1 == thing2);
        if( !areEqual ) {
            log('Inequality: '+JSON.stringify(thing1)+' ('+typeof thing1+')'
                + ' != ' +JSON.stringify(thing2)+' ('+typeof thing2+')');
        }

        return areEqual;
    }
};

/**
 * This tries to see if two arrays have the same contents. Note that it tries to
 * sort the arrays so that it won't matter of the contents are in different order.
 * For example, the following two arrays have the same objects, even though the
 * objects are in different order (and their properties are in different order):
 *
 *   Array 1:  [ { name: 'object1', type: 5 }, 'foobar', { name: 'object2' } ]
 *   Array 2:  [ 'foobar', { name: 'object2' }, { type: 5, name: 'object1' } ]
 *
 * If an element in the array is an object, This function will make sure that the
 * properties inside the object are sorted by property name. For example, both
 * 'object1' objects above should be sorted to { name: xxx, type: xxx } (because
 * "n" comes before "t").
 *
 * Next, the function will make sure the elements in each array are sorted the
 * same way. If the element is an object, it will be converted into a JSON string
 * (a kind of simplistic hash) and then sorting based on that string.
 */
exports.arraysHaveSameContents = function(objArr1, objArr2, cfg) {
    cfg = cfg || {};
    var log = cfg.logFcn || function(){};
    
    if( objArr1.length != objArr2.length ) {
        log('Inequality: arrays have differing lengths');
        return false;
    }

    if( !cfg.strictArrOrder ) {
        // Create a function that can be used to sort the arrays
        var arraySortFcn = function(obj) {
            return isPrimitiveOrDate(obj) ? obj : JSON.stringify( sortOrderOfPropsInObj(obj) );
        };

        var objArr1 = _.sortBy(objArr1, arraySortFcn);
        var objArr2 = _.sortBy(objArr2, arraySortFcn);
    }

    // Compare each pair of elements in the arrays
    for(var i = 0; i < objArr1.length; i++) {
        if( !exports.same(objArr1[i], objArr2[i], cfg) ) {
            // If the current pair of array elements aren't equal we don't need
            // too keep comparing the rest of the arrays.
            return false;
        }
    }

    return true;
};

exports.objectsAreEqual = function(obj1, obj2, cfg) {
    cfg = cfg || {};
    var log = cfg.logFcn || function(){};

    // If the caller has specified that some paths should be ignored, we
    // need to ensure that property is converted into an object.
    if( cfg.ignorePaths && _.isArray(cfg.ignorePaths) ) {
        cfg.ignorePaths = convertIgnorePathsArrToObj(cfg.ignorePaths);
    }

    // Get a list of each object's property names. Note if the user wants to
    // ensure both objects have the same properties in the same order, we
    // won't bother sorting the property names (because by sorting them we
    // are effectively ignoring the order).
    var obj1PropNamesArr = cfg.strictObjPropsOrder ? _.keys(obj1) : _.keys(obj1).sort();
    var obj2PropNamesArr = cfg.strictObjPropsOrder ? _.keys(obj2) : _.keys(obj2).sort();

    if( cfg.ignorePaths ) {
        obj1PropNamesArr = filterIgnoredProperties(obj1PropNamesArr, cfg.ignorePaths);
        obj2PropNamesArr = filterIgnoredProperties(obj2PropNamesArr, cfg.ignorePaths);
    }
    else {
        cfg.ignorePaths = {};
    }

    if( obj1PropNamesArr.length !== obj2PropNamesArr.length ) {
        log('Inequality: Objects have differing number of properties');
        log('obj1: '+JSON.stringify(obj1)+' obj2:'+JSON.stringify(obj2));
        return false;
    }

    // Go through each property name on obj1 and compare it to the corresponding
    // property in obj2.
    for( var i = 0; i < obj1PropNamesArr.length; i++ ) {
        var obj1PropertyName = obj1PropNamesArr[i];
        var obj2PropertyName = obj2PropNamesArr[i];

        // Ensure obj2 has a property with the same name
        if( obj1PropertyName != obj2PropertyName ) {
            log('Inequality: Objects have different properties or properties in differing order.')
            log('obj1: '+JSON.stringify(obj1)+' obj2:'+JSON.stringify(obj2));
            return false;
        }
        // Ensure the property values are the same
        else {
            var cfgClone = _.clone(cfg);
            cfgClone.ignorePaths = {};

            // If ignores exist for children of the current object
            if( cfg.ignorePaths[obj1PropertyName] != undefined && cfg.ignorePaths[obj1PropertyName] != null ) {
                cfgClone.ignorePaths = cfg.ignorePaths[obj1PropertyName];
            }

            var areEqual = exports.same( obj1[obj1PropertyName], obj2[obj2PropertyName], cfgClone );

            if( !areEqual ) {
                return false;
            }
            // else, next loop iteration
        }
    }

    return true;
};

function convertIgnorePathsArrToObj(ignorePathsArr) {
    var ignorePathsObj = null;
    for(var i = 0; i < ignorePathsArr.length; i++) {
        if( ignorePathsObj == null ) {
            ignorePathsObj = convertPathStrToObj( ignorePathsArr[i] );
        }
        else {
            convertPathStrToObj( ignorePathsArr[i], ignorePathsObj );
        }
    }

    return ignorePathsObj;
}

function convertPathStrToObj(pathStr, obj) {
    if( pathStr == null || pathStr == '' )
        return null;

    obj = obj || {};
    var pathPartsArr = pathStr.split('.'); // 'one.two'->['one', 'two']. 'one'->['one'].
    var propertyName = pathPartsArr.splice(0, 1); // ['one','two']->['two']. ['one']->[].
    obj[propertyName] = convertPathStrToObj( pathPartsArr.join('.') );
    return obj;
}

function sortOrderOfPropsInObj(unsortedObj) {
    var sortedObj = {};
    var sortedPropertyNamesArr = _.keys(unsortedObj).sort();
    for( var i = 0; i < sortedPropertyNamesArr.length; i++ ) {
        var propertyName = sortedPropertyNamesArr[i];
        sortedObj[propertyName] = unsortedObj[propertyName];
    }
    
    return sortedObj;
}

function isPrimitiveOrDate(obj) {
    return ( _.isString(obj) || _.isNumber(obj) || _.isBoolean(obj) || _.isDate(obj) );
}

/**
 * The purpose of this function is to take an array of property names and remove
 * any names which should be ignored. For example, given the following ignorePropsObj:
 * { 
 *    name: null, 
 *    homeTown: { 
 *       city: null
 *    } 
 *  }
 *
 *  and the following array of property names:
 *
 *  ['name', 'age', 'homeTown']
 *
 * The returned array should be ['age', 'homeTown']
 */
function filterIgnoredProperties(propertyNamesArr, ignorePropsObj) {

    var propertyNamesToIgnore = [];
    for( ignoreProperty in ignorePropsObj ) {
        if( ignorePropsObj[ignoreProperty] == null ) {
            propertyNamesToIgnore.push(ignoreProperty);
        }
    }

    // Remove all properties that should be ignored
    return _.difference(propertyNamesArr, propertyNamesToIgnore);
}