/*

	WARNING: this is a locally hacked copy of supergroup.js so it will work in
		 a require.js context


 * # supergroup.js
 * Author: [Sigfried Gold](http://sigfried.org)  
 * License: [MIT](http://sigfried.mit-license.org/)  
 * Version: 1.0.13
 *
 * usage examples at [http://sigfried.github.io/blog/supergroup](http://sigfried.github.io/blog/supergroup)
 */
; // jshint -W053

'use strict';

define(['lodash'], function(_) {

	var supergroup = (function() {
	    // @description local reference to supergroup namespace 
	    var sg = {};

	    /* @exported function supergroup.group(recs, dim, opts)
	     * @param {Object[]} recs list of records to be grouped
	     * @param {string or Function} dim either the property name to
		group by or a function returning a group by string or number
	     * @param {Object} [opts]
	     * @param {String} opts.childProp='children' If group ends up being
		* hierarchical, this will be the property name of any children
	     * @param {String[]} [opts.excludeValues] to exlude specific group values
	     * @param {function} [opts.preListRecsHook] run recs through this
		* function before continuing processing
	     * @param {function} [opts.dimName] defaults to the value of `dim`.
		* If `dim` is a function, the dimName will be ugly.
	     * @param {function} [opts.truncateBranchOnEmptyVal] 
	     * @return {Array of Values} enhanced with all the List methods
	     *
	     * Avaailable as _.supergroup, Underscore mixin
	     */
	    sg.supergroup = function(recs, dim, opts) {
		// if dim is an array, use multiDimList to create hierarchical grouping
		opts = opts || {};
		if (_(dim).isArray()) return sg.multiDimList(recs, dim, opts);
		recs = opts.preListRecsHook ? opts.preListRecsHook(recs) : recs;
		childProp = opts.childProp || childProp;

		if (opts.multiValuedGroup || opts.multiValuedGroups) {
		    if (opts.wasMultiDim) {
			if (opts.multiValuedGroups) {
			    if (_(opts.multiValuedGroups).contains(dim)) {
				var groups = _.multiValuedGroupBy(recs, dim);
			    } else {
				if (opts.truncateBranchOnEmptyVal)
				  recs = recs.filter(r => !_.isEmpty(r[dim]) || (_.isNumber(r[dim]) && isFinite(r[dim])));
				var groups = _.groupBy(recs, dim);
			    }
			} else {
			    throw new Error("If you want multValuedGroups on multi-level groupings, you have to say which dims get multiValued: opts: { multiValuedGroups:[dim1,dim2] }");
			}
		    } else {
			var groups = _.multiValuedGroupBy(recs, dim);
		    }
		} else {
		    if (opts.truncateBranchOnEmptyVal)
		      recs = recs.filter(r => !_.isEmpty(r[dim]) || (_.isNumber(r[dim]) && isFinite(r[dim])));
		    var groups = _.groupBy(recs, dim); // use Underscore's groupBy: http://underscorejs.org/#groupBy
		}
		if (opts.excludeValues) {
		    _.each(opts.excludeValues, function(d) {
			delete groups[d];
		    });
		}
		var isNumeric = _(opts).has('isNumeric') ? 
				    opts.isNumeric :
				    wholeListNumeric(groups); // does every group Value look like a number or a missing value?
		var groups = _.map(_.pairs(groups), function(pair, i) { // setup Values for each group in List
		    var rawVal = pair[0];
		    var val;
		    if(isNumeric) {
			val = makeNumberValue(rawVal); // either everything's a Number
		    } else {
			val = makeStringValue(rawVal); // or everything's a String
		    }
		    /* The original records in this group are stored as an Array in 
		     * the records property (should probably be a getter method).
		     */
		    val.records = pair[1];
		    /* val.records is enhanced with Underscore methods for
		     * convenience, but also with the supergroup method that's
		     * been mixed in to Underscore. So you can group this specific
		     * subset like: val.records.supergroup
		     * on                                       FIX!!!!!!
		     */

		    sg.addSupergroupMethods(val.records);

		    val.dim = (opts.dimName) ? opts.dimName : dim;
		    val.records.parentVal = val; // NOT TESTED, NOT USED, PROBABLY WRONG
		    if (opts.parent)
			val.parent = opts.parent;
		    if (val.parent) {
			if ('depth' in val.parent) {
			    val.depth = val.parent.depth + 1;
			} else {
			    val.parent.depth = 0;
			    val.depth = 1;
			}
		    } else {
			val.depth = 0;
		    }
		    return val;
		});
		//groups = makeList(groups); // turns groups into a List object
		groups = sg.addListMethods(groups); // turns groups into a List object
		groups.records = recs; // NOT TESTED, NOT USED, PROBABLY WRONG
		groups.dim = (opts.dimName) ? opts.dimName : dim;
		groups.isNumeric = isNumeric;

		_.each(groups, function(group, i) { 
		    group.parentList = groups;
		    //group.idxInParentList = i; // maybe a good idea, but don't need it yet
		});
		// pointless without recursion
		//if (opts.postListListHook) groups = opts.postListListHook(groups);
		return groups;
	    };
	    // nested groups, each dim is a level in hierarchy
	    sg.multiDimList = function(recs, dims, opts) {
		opts.wasMultiDim = true;  // pretty kludgy
		var groups = sg.supergroup(recs, dims[0], opts);
		_.chain(dims).rest().each(function(dim) {
		    groups.addLevel(dim, opts);
		}).value();
		return groups;
	    };
	    // @class List
	    // @description Native Array of groups with various added methods and properties.
	    // Methods described below.
	    function List() {}
	    // @class Value
	    // @description Supergroup Lists are composed of Values which are
	    // String or Number objects representing group values.
	    // Methods described below.
	    function Value() {}

	    List.prototype.isSupergroupList = true;
	    // sometimes a root value is needed as the top of a hierarchy
	    List.prototype.asRootVal = function(name, dimName) {
		var val = makeValue(name || 'Root');
		val.dim = dimName || 'root';
		val.depth = 0;
		val.records = this.records;
		val[childProp]= this;
		_.each(val[childProp], function(d) { d.parent = val; });
		_.each(val.descendants(), function(d) { d.depth = d.depth + 1; });
		return val;
	    };
	    List.prototype.leafNodes = function(level) {
		return _.chain(this).invoke('leafNodes').flatten()
		    .addSupergroupMethods()
		    .value();
	    };
	    List.prototype.rawValues = function() {
		return _.chain(this).map(function(d) { return d.valueOf(); }).value();
	    };
	    // lookup a value in a list, or, if query is an array
	    //      it is interpreted as a path down the group hierarchy
	    List.prototype.lookup = function(query) {
		if (_.isArray(query)) {
		    // if group has children, can search down the tree
		    var values = query.slice(0);
		    var list = this;
		    var ret;
		    while(values.length) {
			ret = list.singleLookup(values.shift());
			list = ret[childProp];
		    }
		    return ret;
		} else {
		    return this.singleLookup(query);
		}
	    };

	    List.prototype.getLookupMap = function() {
		var self = this;
		if (! ('lookupMap' in self)) {
		    self.lookupMap = {};
		    self.forEach(function(d) {
			if (d in self.lookupMap)
			    console.warn('multiple occurrence of ' + d + 
				' in list. Lookup will only get the last');
			self.lookupMap[d] = d;
		    });
		}
		return self.lookupMap;
	    };
	    List.prototype.singleLookup = function(query) {
		return this.getLookupMap()[query];
	    };

	    // lookup more than one thing at a time
	    List.prototype.lookupMany = function(query) {
		var list = this;
		return sg.addSupergroupMethods(_.chain(query).map(function(d) { 
		    return list.singleLookup(d)
		}).compact().value());
	    };
	    List.prototype.flattenTree = function() {
		return _.chain(this)
			    .map(function(d) {
				var desc = d.descendants();
				return [d].concat(desc);
			    })
			    .flatten()
			    .filter(_.identity) // expunge nulls
			    .tap(sg.addListMethods)
			    .value();
	    };
	    List.prototype.addLevel = function(dim, opts) {
		_.each(this, function(val) {
		    val.addLevel(dim, opts);
		});
		return this;
	    };
	    List.prototype.namePaths = function(opts) {
		return _.map(this, function(d) {
		    return d.namePath(opts);
		});
	    };
	    // apply a function to the records of each group
	    // 
	    List.prototype.aggregates = function(func, field, ret) {
		var results = _.map(this, function(val) {
		    return val.aggregate(func, field);
		});
		if (ret === 'dict')
		    return _.object(this, results);
		return results;
	    };

	    List.prototype.d3NestEntries = function() {
		return _.map(this, function(val) {
		    if (childProp in val)
			return {key: val.toString(), values: val[childProp].d3NestEntries()};
		    return {key: val.toString(), values: val.records};
		});
	    };
	    List.prototype.d3NestMap = function() {
		return _.chain(this).map(
		    function(val) {
			if (val.children)
			    return [val+'', val.children.d3NestMap()];
			return [val+'', val.records];
		    }).object().value();
	    }
	    List.prototype._sort = Array.prototype.sort;
	    List.prototype.sort = function(func) {
		return sg.addListMethods(this._sort(func));
	    };
	    List.prototype.sortBy = function(func) {
		return sg.addListMethods(_.sortBy(this, func));
	    };
	    List.prototype.rootList = function(func) {
		if ('parentVal' in this)
		  return this.parentVal.rootList();
		return this;
	    };

	    function makeValue(v_arg) {
		if (isNaN(v_arg)) {
		    return makeStringValue(v_arg);
		} else {
		    return makeNumberValue(v_arg);
		}
	    }
	    function StringValue() {}
	    //StringValue.prototype = new String;
	    function makeStringValue(s_arg) {
		var S = new String(s_arg);
		//S.__proto__ = StringValue.prototype; // won't work in IE10
		for(var method in StringValue.prototype) {
		    Object.defineProperty(S, method, {
			value: StringValue.prototype[method]
		    });
		}
		return S;
	    }
	    function NumberValue() {}
	    //NumberValue.prototype = new Number;
	    function makeNumberValue(n_arg) {
		var N = new Number(n_arg);
		//N.__proto__ = NumberValue.prototype;
		for(var method in NumberValue.prototype) {
		    Object.defineProperty(N, method, {
			value: NumberValue.prototype[method]
		    });
		}
		return N;
	    }
	    function wholeListNumeric(groups) {
		var isNumeric = _.every(_.keys(groups), function(k) {
		    return      k === null ||
				k === undefined ||
				(!isNaN(Number(k))) ||
				["null", ".", "undefined"].indexOf(k.toLowerCase()) > -1;
		});
		if (isNumeric) {
		    _.each(_.keys(groups), function(k) {
			if (isNaN(k)) {
			    delete groups[k];        // getting rid of NULL values in dim list!!
			}
		    });
		}
		return isNumeric;
	    }
	    var childProp = 'children';

	    Value.prototype.extendGroupBy = // backward compatibility
	    Value.prototype.addLevel = function(dim, opts) {
		opts = opts || {};
		_.each(this.leafNodes() || [this], function(d) {
		    opts.parent = d;
		    if (!('in' in d)) { // d.in means it's part of a diffList
			d[childProp] = sg.supergroup(d.records, dim, opts);
		    } else { // allows adding levels to diffLists. haven't used for a long time
			if (d['in'] === "both") {
			    d[childProp] = sg.diffList(d.from, d.to, dim, opts);
			} else {
			    d[childProp] = sg.supergroup(d.records, dim, opts);
			    _.each(d[childProp], function(c) {
				c['in'] = d['in'];
				c[d['in']] = d[d['in']];
			    });
			}
		    }
		    d[childProp].parentVal = d; // NOT TESTED, NOT USED, PROBABLY WRONG!!!
		});
	    };
	    Value.prototype.leafNodes = function(level) {
		// until commit 31278a35b91a8f4bd4ddc4376c840fb14d2723f9
		// supported level param, to only go down so many levels
		// not supporting that any more. wasn't using it

		if (!(childProp in this)) return;

		return _.chain(this.descendants()).filter(
			function(d){
			    return _.isEmpty(d.children);
			}).addSupergroupMethods().value();

		var ret = [this];
		if (typeof level === "undefined") {
		    level = Infinity;
		}
		if (level !== 0 && this[childProp] && this[childProp].length && (!level || this.depth < level)) {
		    ret = _.flatten(_.map(this[childProp], function(c) {
			return c.leafNodes(level);
		    }), true);
		}
		//return makeList(ret);
		return sg.addListMethods(ret);
	    };
	    Value.prototype.addRecordsAsChildrenToLeafNodes = function(truncateEmpty) {
		function fixLeaf(node) {
		    node.children = node.records;
		    _.each(node.children, function(rec) {
			rec.parent = node;
			rec.depth = node.depth + 1;
			for(var method in Value.prototype) {
			    Object.defineProperty(rec, method, {
				value: Value.prototype[method]
			    });
			}
		    });
		}
		if (typeof truncateEmpty === "undefined")
		    truncateEmpty = true;
		if (truncateEmpty) {
		    var self = this;
		    self.descendants().forEach(function(node) {
			if (self.parent && self.parent.children.length === 1) {
			  fixLeaf(node);
			}
		    });
		} else {
		  _.each(this.leafNodes(), function(node) {
		      fixLeaf(node);
		  });
		}
		return this;
	    };
	    /*  didn't make this yet, just copied from above
	    Value.prototype.descendants = function(level) {
		var ret = [this];
		if (level !== 0 && this[childProp] && (!level || this.depth < level))
		    ret = _.flatten(_.map(this[childProp], function(c) {
			return c.leafNodes(level);
		    }), true);
		return makeList(ret);
	    };
	    */
	    function delimOpts(opts) {
		if (typeof opts === "string") opts = {delim: opts};
		opts = opts || {};
		if (!_(opts).has('delim')) opts.delim = '/';
		return opts;
	    }
	    Value.prototype.dimPath = function(opts) {
		opts = delimOpts(opts);
		opts.dimName = true;
		return this.namePath(opts);
	    };
	    Value.prototype.namePath = function(opts) {
		opts = delimOpts(opts);
		var path = this.pedigree(opts);
		if (opts.dimName) path = _.pluck(path, 'dim');
		if (opts.asArray) return path;
		return path.join(opts.delim);
		/*
		var delim = opts.delim || '/';
		return (this.parent ? 
			this.parent.namePath(_.extend({},opts,{notLeaf:true})) : '') +
		    ((opts.noRoot && this.depth===0) ? '' : 
			(this + (opts.notLeaf ? delim : ''))
		     )
		*/
	    };
	    Value.prototype.path =  // better than 'pedigree', right?
	    Value.prototype.pedigree = function(opts) {
		opts = opts || {};
		var path = [];
		if (!opts.notThis) path.push(this);
		var ptr = this;
		while ((ptr = ptr.parent)) {
		    path.unshift(ptr);
		}
		if (opts.noRoot) path.shift();
		if (opts.backwards || this.backwards) path.reverse(); //kludgy?
		return path;
		// CHANGING -- HOPE THIS DOESN'T BREAK STUFF (pedigree isn't
		// documented yet)
		if (!opts.asValues) return _.chain(path).invoke('valueOf').value();
		return path;
	    };
	    Value.prototype.descendants = function(opts) {
		// these two lines fix a treelike bug, hope they don't do harm
		this[childProp] = this[childProp] || [];
		_.addSupergroupMethods(this[childProp]);

		return this[childProp] ? this[childProp].flattenTree() : undefined;
	    };
	    Value.prototype.lookup = function(query) {
		if (_.isArray(query)) {
		    if (this.valueOf() == query[0]) { // allow string/num comparison to succeed?
			query = query.slice(1);
			if (query.length === 0)
			    return this;
		    }
		} else if (_.isString(query)) {
		    if (this.valueOf() == query) {
			return this;
		    }
		} else {
		    throw new Error("invalid param: " + query);
		}
		if (!this[childProp])
		    throw new Error("can only call lookup on Values with kids");
		return this[childProp].lookup(query);
	    };
	    Value.prototype.pct = function() {
		return this.records.length / this.parentList.records.length;
	    };
	    Value.prototype.previous = function() {
		if (this.parentList) {
		    // could store pos on each value, but not doing that now
		    var pos = this.parentList.indexOf(this);
		    if (pos > 0) {
			return this.parentList[pos - 1];
		    }
		}
	    };
	    Value.prototype.aggregate = function(func, field) {
		if (_.isFunction(field))
		    return func(_.map(this.records, field));
		return func(_.pluck(this.records, field));
	    };
	    Value.prototype.rootList = function() {
		return this.parentList.rootList();
	    };

	    /** Summarize records by a dimension
	     *
	     * @param {list} Records to be summarized
	     * @param {numericDim} Dimension to summarize by
	     *
	     * @memberof supergroup
	     */
	    sg.aggregate = function(list, numericDim) { 
		if (numericDim) {
		    list = _.pluck(list, numericDim);
		}
		return _.reduce(list, function(memo,num){
			    memo.sum+=num;
			    memo.cnt++;
			    memo.avg=memo.sum/memo.cnt; 
			    memo.max = Math.max(memo.max, num);
			    return memo;
			},{sum:0,cnt:0,max:-Infinity});
	    }; 
	    /** Compare groups across two similar root nodes
	     *
	     * @param {from} ...
	     * @param {to} ...
	     * @param {dim} ...
	     * @param {opts} ...
	     *
	     * used by treelike and some earlier code
	     *
	     * @memberof supergroup
	     */
	    sg.diffList = function(from, to, dim, opts) {
		var fromList = sg.supergroup(from.records, dim, opts);
		var toList = sg.supergroup(to.records, dim, opts);
		//var list = makeList(sg.compare(fromList, toList, dim));
		var list = sg.addListMethods(sg.compare(fromList, toList, dim));
		list.dim = (opts && opts.dimName) ? opts.dimName : dim;
		return list;
	    };

	    /** Compare two groups by a dimension
	     *
	     * @param {A} ...
	     * @param {B} ...
	     * @param {dim} ...
	     *
	     * @memberof supergroup
	     */
	    sg.compare = function(A, B, dim) {
		var a = _.chain(A).map(function(d) { return d+''; }).value();
		var b = _.chain(B).map(function(d) { return d+''; }).value();
		var comp = {};
		_.each(A, function(d, i) {
		    comp[d+''] = {
			name: d+'',
			'in': 'from',
			from: d,
			fromIdx: i,
			dim: dim
		    };
		});
		_.each(B, function(d, i) {
		    if ((d+'') in comp) {
			var c = comp[d+''];
			c['in'] = "both";
			c.to = d;
			c.toIdx = i;
		    } else {
			comp[d+''] = {
			    name: d+'',
			    'in': 'to',
			    to: d,
			    toIdx: i,
			    dim: dim
			};
		    }
		});
		var list = _.chain(comp).values().sort(function(a,b) {
		    return (a.fromIdx - b.fromIdx) || (a.toIdx - b.toIdx);
		}).map(function(d) {
		    var val = makeValue(d.name);
		    _.extend(val, d);
		    val.records = [];
		    if ('from' in d)
			val.records = val.records.concat(d.from.records);
		    if ('to' in d)
			val.records = val.records.concat(d.to.records);
		    return val;

		}).value();
		_.chain(list).map(function(d) {
		    d.parentList = list; // NOT TESTED, NOT USED, PROBABLY WRONG
		    d.records.parentVal = d; // NOT TESTED, NOT USED, PROBABLY WRONG
		}).value();

		return list;
	    };

	    /** Concatenate two Values into a new one (??)
	     *
	     * @param {from} ...
	     * @param {to} ...
	     *
	     * @memberof supergroup
	     */
	    sg.compareValue = function(from, to) { // any reason to keep this?
		if (from.dim !== to.dim) {
		    throw new Error("not sure what you're trying to do");
		}
		var name = from + ' to ' + to;
		var val = makeValue(name);
		val.from = from;
		val.to = to;
		val.depth = 0;
		val['in'] = "both";
		val.records = [].concat(from.records,to.records);
		val.records.parentVal = val; // NOT TESTED, NOT USED, PROBABLY WRONG
		val.dim = from.dim;
		return val;
	    };
	    _.extend(StringValue.prototype, Value.prototype);
	    _.extend(NumberValue.prototype, Value.prototype);

	    /** Sometimes a List gets turned into a standard array,
	     *  sg.g., through slicing or sorting or filtering. 
	     *  addListMethods turns it back into a List
	     *
	     * `List` would be a constructor if IE10 supported
	     * \_\_proto\_\_, so it pretends to be one instead.
	     *
	     * @param {Array} Array to be extended
	     *
	     * @memberof supergroup
	     */

	    sg.addSupergroupMethods =

	    sg.addListMethods = function(arr) {
		arr = arr || []; // KLUDGE for treelike
		if (arr.isSupergroupList) return arr;
		for(var method in List.prototype) {
		    Object.defineProperty(arr, method, {
			value: List.prototype[method]
		    });
		}
		return arr;
	    };
	    
	    // can't easily subclass Array, so this explicitly puts the List
	    // methods on an Array that's supposed to be a List
	    function makeList(arr_arg) {
		var arr = [ ];
		arr.push.apply(arr, arr_arg);
		sg.addListMethods(arr);
		/*
		//arr.__proto__ = List.prototype;
		for(var method in List.prototype) {
		    Object.defineProperty(arr, method, {
			value: List.prototype[method]
		    });
		}
		*/
		return arr;
	    }

	    sg.hierarchicalTableToTree = function(data, parentProp, childProp) {
		// does not do the right thing if a value has two parents
		// also, does not yet fix depth numbers
		var parents = sg.supergroup(data,[parentProp, childProp]); // 2-level grouping with all parent/child pairs
		var children = parents.leafNodes();
		var topParents = _.filter(parents, function(parent) { 
		    var adoptiveParent = children.lookup(parent); // is this parent also a child?
		    if (adoptiveParent) { // if so, make it the parent
			adoptiveParent.children = sg.addSupergroupMethods([]);
			_.each(parent.children, function(c) { 
			    c.parent = adoptiveParent; 
			    adoptiveParent.children.push(c)
			});  
		    } else { // if not, this is a top parent
			return parent;
		    }
		    // if so, make use that child node, move this parent node's children over to it
		});
		return sg.addSupergroupMethods(topParents);
	    };
	    return sg;
	}());


	// allows grouping by a field that contains an array of values rather than just a single value
	if (_.createAggregator) {
	    var multiValuedGroupBy = _.createAggregator(function(result, value, keys) {
		_.each(keys, function(key) {
		    if (hasOwnProperty.call(result, key)) {
			result[key].push(value);
		    } else {
			result[key] = [value];
		    }
		});
	    });
	} else {
	    var multiValuedGroupBy = function() { throw new Error("couldn't install multiValuedGroupBy") };
	}

	_.mixin({
	    supergroup: supergroup.supergroup, 
	    addSupergroupMethods: supergroup.addSupergroupMethods,
	    multiValuedGroupBy: multiValuedGroupBy,
	    sgDiffList: supergroup.diffList,
	    sgCompare: supergroup.compare,
	    sgCompareValue: supergroup.compareValue,
	    sgAggregate: supergroup.aggregate,
	    hierarchicalTableToTree: supergroup.hierarchicalTableToTree,

	    // FROM https://gist.github.com/AndreasBriese/1670507
	    // Return aritmethic mean of the elements
	    // if an iterator function is given, it is applied before
	    sum : function(obj, iterator, context) {
		if (!iterator && _.isEmpty(obj)) return 0;
		var result = 0;
		if (!iterator && _.isArray(obj)){
		for(var i=obj.length-1;i>-1;i-=1){
		    result += obj[i];
		};
		return result;
		};
		each(obj, function(value, index, list) {
		var computed = iterator ? iterator.call(context, value, index, list) : value;
		result += computed;
		});
		return result;
	    },
	    mean : function(obj, iterator, context) {
		if (!iterator && _.isEmpty(obj)) return Infinity;
		if (!iterator && _.isArray(obj)) return _.sum(obj)/obj.length;
		if (_.isArray(obj) && !_.isEmpty(obj)) return _.sum(obj, iterator, context)/obj.length;
	    },
	    
	    // Return median of the elements 
	    // if the object element number is odd the median is the 
	    // object in the "middle" of a sorted array
	    // in case of an even number, the arithmetic mean of the two elements
	    // in the middle (in case of characters or strings: obj[n/2-1] ) is returned.
	    // if an iterator function is provided, it is applied before
	    median : function(obj, iterator, context) {
		if (_.isEmpty(obj)) return Infinity;
		var tmpObj = [];
		if (!iterator && _.isArray(obj)){
		tmpObj = _.clone(obj);
		tmpObj.sort(function(f,s){return f-s;});
		}else{
		_.isArray(obj) && each(obj, function(value, index, list) {
		    tmpObj.push(iterator ? iterator.call(context, value, index, list) : value);
		    tmpObj.sort();
		});
		};
		return tmpObj.length%2 ? tmpObj[Math.floor(tmpObj.length/2)] : (_.isNumber(tmpObj[tmpObj.length/2-1]) && _.isNumber(tmpObj[tmpObj.length/2])) ? (tmpObj[tmpObj.length/2-1]+tmpObj[tmpObj.length/2]) /2 : tmpObj[tmpObj.length/2-1];
	    },
	});

	return _;
});

