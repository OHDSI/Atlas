define(['jquery','knockout'], function($,ko) {
	
	var utilModule = { version: '1.0.0' };
	
	// private functions 	
	function _pruneJSON(key, value) {
		if (value === 0 || value) {
			return value;
		} else {
			return
		}
	}
	
	// END private functions
	
	// module functions
	function dirtyFlag(root, isInitiallyDirty) {
		var result = function () {},
			_initialState = ko.observable(ko.toJSON(root, _pruneJSON)),
			_isInitiallyDirty = ko.observable(isInitiallyDirty);

		result.isDirty = ko.pureComputed(function () {
			return _isInitiallyDirty() || _initialState() !== ko.toJSON(root, _pruneJSON);
		}).extend({
			rateLimit: 200
		});;

		result.reset = function () {
			_initialState(ko.toJSON(root, _pruneJSON));
			_isInitiallyDirty(false);
		};

		return result;
	}	

	/* getContainer
	 * call with css id (with or without #)
	 *				or dom node or d3 selection or jquery selection
	 *
	 * returns type requested ("dom", "d3", "jquery", "id")
	 */
	function getContainer(target, type = "dom") {
		if (target.selectAll) { // it's a d3 selection
			if (type === "d3") return target;
			return getContainer(target.node(), type); // call again with dom node
																						    // (first in selection, that is)
		}
		if (target.jquery) { // it's a jquery selection
			if (type === "jquery") return target;
			return getContainer(target[0], type); // call again with dom node
		}
		if (typeof target === "string") { // only works with ids for now, not other css selectors
			var id = target[0] === '#' ? target.slice(1) : target;
			var dom = document.getElementById(id);
			if (dom) return getContainer(dom, type); // call again with dom node
			throw new Error(`not a valid element id: ${target}`);
		}
		// target ought to be a dom node
		if (!target.tagName) {
			throw new Error(`invalid target`);
		}
		switch (type) {
			case "dom":
				return target;
			case "id":
				return target.getAttribute('id');
			case "d3":
				return d3.select(target);
			case "jquery":
				return $(target);
		}
		throw new Error(`invalid type: ${type}`);
	}
	/* d3AddIfNeeded
	 *	call with parent element (can be selector, dom, jquery or d3 item), 
	 *						data (scalar uses selection.datum(), array uses selection.data())
	 *						tag of element(s) to be appended to parent
	 *						array of class names 
	 *						callback to use on enter selection
	 *						callback to use for update
	 *						(could also add remove callback but don't have it yet)
	 *						and array of params to send to callbacks
	 * returns d3 selection with data appropriately attached
	 * warning: if your addCb appends further elements (or if you add more
	 *					using the returned selection, i think),
	 *					they will also have data appropriately attached, but that
	 *					data may end up stale for the updateCb if you call this again 
	 *					with new data unless you explicitly d3.select it
	 *					for example:
	 *					(is this really true? check before finishing example)
	 *
	 *					d3AddIfNeeded({parentElement: pdiv, 
	 *												 data: [1,2,3], // three items appended (if they
	 *												                // don't already exist) as children of pdiv
	 *												 tag: 'div',		// they are divs
	 *												 classes: [],
	 *												 addCb: function(el, params) {
	 *																	// each div will have an svg appended
	 *																	el.append('svg');
	 *															  },
	 *												 updateCb: function(el, params) {
	 *                                    // this will force new data to attach
	 *                                    // to previously appended svg
	 *                                    // if this d3AddIfNeeded is called
	 *                                    // a second time with new data
	 *																		el.select('svg');
	 *                                    // more selects may be necessary to propogate
	 *                                    // data to svg's children
	 *																	 },
	 *												 cbParams: []});
	 */
	function d3AddIfNeeded({parentElement, data, tag, classes=[], addCb=()=>{}, updateCb=()=>{}, 
												  cbParams} = {}) {
		var el = getContainer(parentElement, "d3");
		var selection = el.selectAll([tag].concat(classes).join('.'));
		if (Array.isArray(data)) {
			selection = selection.data(data);
		} else {
			selection = selection.data([data]);
			// might want this? : selection = selection.datum(data);
		}
		selection.exit().remove();
		selection.enter().append(tag)
				.each(function(d) {
					var newNode = d3.select(this);
					classes.forEach(cls => {
						newNode.classed(cls, true);
					});
				})
				.call(addCb, cbParams);
		selection = el.selectAll([tag].concat(classes).join('.'));
		selection.call(updateCb, cbParams);
		return selection;
	}
	/* D3Element
	 * this is an OO class to replace the d3AddIfNeeded function above
	 *
	 * making a new D3Element instance (el) will add <tag> elements to the
	 * parentElement using a D3 join to the data param. but if elements
	 * already exist, they elements will be appropriately joined to the
	 * data: extras will be removed (after running an exit callback if
	 * you specify one), entering items will be appended, and the update
	 * callback will be run on everything remaining after the join.
	 *
	 * you could also just say: el.data(newData); el.run(). that will
	 * also perform the appropriate join and run the callbacks.
	 *
	 * so you do not need to keep track of whether you've already created
	 * the elements. if you have and you still have a reference to the
	 * D3Element instance, el.data(d); el.run(); works. but calling the
	 * same code that created it originally and sending new data will
	 * work as well.
	 *
	 * if you also create child elements like:
	 *    var el = new D3Element(params);
	 *    el.addChild(params);
	 * then calling el.data(newData); el.run(); will not only update el,
	 * it will also rejoin and update its children with newData.
	 *
	 * var el = new D3Element({parentElement:p, 
	 *													data:arrOrObj, // data to be joined to selection
	 *																				 // if it's scalar, will be turned
	 *																				 // into single-item array
	 *													tag: 'div',		 // tag of element to be appended 
	 *																				 // if necessary to parent
	 *													classes: ['big','bright'], 
	 *																				 // to add to element
	 *																				 // should also insure that 
	 *																				 // parent.selectAll('tag.classes')
	 *																				 // only returns elements elements
	 *																				 // created here
	 *													enterCb: null, // only needed if you want to
	 *																				 // run extra code when el is
	 *																				 // first created
	 *												  exitCb: null,  // only needed if you want
	 *																				 // to run extra code (transition?)
	 *																				 // when el is removed
	 *												  cbParams: null,// will be passed to all callbacks
	 *																				 // along with d3 selection
	 *												  updateCb:			 // code to run on creation and
	 *																				 // after possible data changes
	 *																		function(selection, cbParams, updateOpts) {
	 *																			// updateOpts are set by calling
	 *																			// el.run(opts) or el.update(opts)
	 *																			// and they are sent to the updateCb not
	 *																			// just for the el in question, but to
	 *																			// all its children
	 *																			selection
	 *																				.attr('x', function(d) {
	 *																					return cbParams.scale(cbParams.xVal(d))
	 *																				})
	 *																		},
	 *													children: null,// k/v obj with child descriptors (need to document)
	 *																				 // should only allow children with explicite el.addChild
	 *													dataPropogationSelectors: null, // document when implemented
	 *												});
	 *
	 * el.run() returns the d3 selection after performing joins and running callbacks.
	 * you can also get the d3 selection with el.selectAll();
	 *
	 * there are many ways to add child elements (using the addChild method, using
	 * the d3 selection returned from run and selectAll methods, or in the add or
	 * update callbacks). I recommend:
	 *
	 *		add using el.addChild()
	 *		set attributes in the update callback
	 *		don't use the d3 selections at all
	 *		you probably don't need to do anything in the enterCb
	 *		(because that would probably mean creating some nested dom nodes
	 *		below the one you're adding, and then how would you access those?)
	 */
	function combineFuncs(funcs) {
		return (...args) => { return funcs.map(function(f) { return f.apply(this, args) }) }
	}
	class D3Element {
		constructor(props, transitionOpts) {
			this.parentElement = props.parentElement; // any form ok: d3, jq, dom, id
			this.el = getContainer(this.parentElement, "d3");
			this._data = Array.isArray(props.data) || typeof props.data === 'function'
										? props.data : [props.data];
			this.tag = props.tag;
			this.classes = props.classes || [];
			this.enterCb = props.enterCb || (()=>{});
			this.updateCb = props.updateCb || (()=>{});
			this.updateCbs = props.updateCbs || [this.updateCb]; // in case you want to run more than one callback on update
			this.updateCbsCombined = combineFuncs(this.updateCbs);
			this.exitCb = props.exitCb || (()=>{});
			this.cbParams = props.cbParams;
			this._children = {};
			this.dataPropogationSelectors = props.dataPropogationSelectors; // not implemented yet
			if (!props.stub)
				this.run(transitionOpts);
		}
		selectAll(data) {
		 var selection = this.el.selectAll([this.tag].concat(this.classes).join('.'));
		 if (data)
			 selection = selection.data(data);
		 //if (duration||delay) return selection.transition().delay(delay||0).duration(duration||0);
		 return selection;
		}
		as(type) {
			return getContainer(this.selectAll(), type);
		}
		data(data) {
			if (typeof data === "undefined")
				return this.selectAll().data();
			this._data = data;
			return this.selectAll(data);
		}
		run(opts={}, enter=true, exit=true, update=true) {
			// fix opts: split up data and transition
			var self = this;
			var data = opts.data || self._data;
			var selection = self.selectAll(data);

			var transitionOpts = _.omit(opts, ['data']); // delay, duration
			var {delay=0, duration=0} = transitionOpts;

			if (exit) {
				selection.exit()
						.transition()
						.delay(delay).duration(duration)
						.each(function(d) {
							_.each(self.children(), (c, name) => {
								self.child(name).exit(transitionOpts);
								// allow enter/update on children of exiting elements? probably no reason to
							});
						})
						.call(self.exitCb, self.cbParams, opts, self)
						.remove()
			}
			if (enter) {
				selection.enter()
						.append(self.tag)
							.each(function(d) { // add classes
								var newNode = d3.select(this);
								self.classes.forEach(cls => {
									newNode.classed(cls, true);
								});
							})
						.call(self.enterCb, self.cbParams, opts, self)
						.each(function(d) {
							// make children
							_.each(self.children(), (c, name) => {
								var child = self.makeChild(name, this, transitionOpts); // 'this' is the dom element we just appended
								child.enter();
								// allow exit/update on children of entering elements? probably no reason to
							});
						});
			}
			selection = self.selectAll(data);
			if (update) {
				selection
						.each(function(d) {
							_.each(self.children(), (c, name) => {
								self.child(name).run(transitionOpts, enter, exit, update);
								// data will be passed down to children don't override it with data from opts
							});
						})
						.call(self.updateCbsCombined, self.cbParams, opts, self)
			}
			return selection;
		}
		childDesc(name, desc) {
			if (desc)
				this._children[name] = {desc};
			else if (!this._children[name])
				throw new Error(`${name} child not created yet`);
			return this._children[name].desc;
		}
		child(name, el) {
			if (!this._children[name])
				throw new Error(`${name} child not created yet`);
			if (el)
				this._children[name].el = el;
			return this._children[name].el;
		}
		addChild(name, desc, transitionOpts) {
			this.childDesc(name, desc);
			return this.makeChild(name, this.selectAll(), transitionOpts);
		}
		// should we attempt to send selectAll options (for transition durations)
		// through addChild/makeChild? not doing this yet. but update calls will
		// send these options down the D3Element tree
		makeChild(name, parentElement, transitionOpts) {
			var desc = this.childDesc(name);
			var params = $.extend(
				{ parentElement,
					data: d=>[d],	// pass data down to child unless desc provides
											// its own data function
				}, desc);
			return this.child(name, new D3Element(params, transitionOpts));
			// it sort of doesn't matter because if you repeatedly create D3Elements
			// with the same parameters, d3 enter and exit selections will be empty
			// and update won't have a visible effect since data is the same,
			// but maybe if makeChild (or addChild) is called repeatedly with the
			// same exact parameters, we should avoid actually creating a new
			// D3Element instance
		}
		children() {
			return this._children;
		}
		implicitChild(selectorFunc) {
		}
		exit(opts) {
			return this.run(opts, false, true, false);
		}
		enter(opts) {
			return this.run(opts, true, false, false);
		}
		update(opts) {
			return this.run(opts, false, false, true);
		}
	}
	
	// END module functions
	
	utilModule.dirtyFlag = dirtyFlag;
	utilModule.d3AddIfNeeded = d3AddIfNeeded;
	utilModule.getContainer = getContainer;
	utilModule.D3Element = D3Element;
	
	return utilModule;
	
});
