var fs = require("fs");

var async = require('async');
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

async.parallel({
    minifiedCode: function(callback){
    	fs.readFile('./lib/same-same.js', "utf8", function(err, text){
		    var ast = jsp.parse(text);
		    ast = pro.ast_mangle(ast);
		    ast = pro.ast_squeeze(ast);
		    var gen = pro.gen_code(ast, false);
		    callback(err, gen);
		});
    },
    minifiedHeader: function(callback){
    	fs.readFile('package.json', "utf8", function(err, text){
		    var pkg = JSON.parse(text);

		    var minifiedHeader = '// '+pkg.name+' '+pkg.version+'\n';
		    minifiedHeader += '// '+pkg.description+'\n';
		    minifiedHeader += '// Source code and documentation available at '+pkg.repository.url+'\n';
		    minifiedHeader += '// Copyright (c) 2012 Clint Harris\n';
		    minifiedHeader += '// Freely distributable under MIT license. For full license see '+pkg.licenses[0].url+'\n';
		    minifiedHeader += '// Depends on Underscore.js (tested with v'+pkg.dependencies['underscore']+'): http://documentcloud.github.com/underscore/\n';
		    callback(err, minifiedHeader);
		});
    },
},
function(err, results) {
	fs.writeFile('same-same-min.js', results.minifiedHeader+results.minifiedCode, "utf8");
});