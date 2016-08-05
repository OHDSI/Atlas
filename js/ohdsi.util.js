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
		}
		if (target.jquery) { // it's a jquery selection
			if (type === "jquery") return target;
			return getContainer(target[0], type); // call again with dom node
		}
		if (typeof target === "string") {
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
	 * warning: if your enterCb appends further elements (or if you add more
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
	 *												 enterCb: function(el, params) {
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
	function d3AddIfNeeded({parentElement, data, tag, classes=[], enterCb=()=>{}, updateCb=()=>{}, 
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
				.call(enterCb, cbParams);
		selection = el.selectAll([tag].concat(classes).join('.'));
		selection.call(updateCb, cbParams);
		return selection;
	}
	/*
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
	 *												  updateCb:			 // code to run on creation and
	 *																				 // after possible data changes
	 *																		function(selection, cbParams) {
	 *																			selection
	 *																				.attr('x', function(d) {
	 *																					return cbParams.scale(cbParams.xVal(d))
	 *																				})
	 *																		},
	 *												  cbParams: null,// will be passed to all callbacks
	 *																				 // along with d3 selection
	 *													children: null,// k/v obj with child descriptors (need to document)
	 *													dataPropogationSelectors: null, // document when implemented
	 *												});
	 * el.run();
	 *
	 * el.run() returns a d3 selection you can continue operating on, or you can 
	 * put all code to be run on all added/updated elements into the updateCb
	 *
	 * you shouldn't have to worry about whether you use (i.e., el.run()) 
	 *	the same D3Element repeatedly or instantiate a new one.
	 *	the effects should be the same either way
	 */
	class D3Element {
		constructor(props) {
			this.parentElement = props.parentElement; // any form ok: d3, jq, dom, id
			this.el = getContainer(this.parentElement, "d3");
			this.data = Array.isArray(props.data) || typeof props.data === 'function'
										? props.data : [props.data];
			this.tag = props.tag;
			this.classes = props.classes || [];
			this.enterCb = props.enterCb || (()=>{});
			this.updateCb = props.updateCb || (()=>{});
			this.exitCb = props.exitCb || (()=>{});
			this.cbParams = props.cbParams;
			this._childDescs = props.children || {}; // k/v obj with child descriptors (document)
			this._children = {};
			this.dataPropogationSelectors = props.dataPropogationSelectors; // not implemented yet
			_.each(this._childDescs, (desc, name) => {
				this.childDesc(name, desc);
			});
		}
		selectAll() {
		 return this.el.selectAll([this.tag].concat(this.classes).join('.'));
		}
		as(type) {
			return getContainer(this.selectAll(), type);
		}
		data(data) {
			if (typeof data === "undefined")
				return this.selectAll().data();
			return this.selectAll().data(data);
		}
		run(enter=true, exit=true, update=true) {
			var self = this;
			var selection = self.selectAll().data(self.data);
			if (exit) {
				selection.exit()
						.call(self.exitCb, self.cbParams)
						.each(function(d) {
							_.each(self.children(), (c, name) => {
								self.child(name).exit();
							});
						})
						.remove();
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
						.call(self.enterCb, self.cbParams)
						.each(function(d) {
							// make children
							_.each(self.children(), (c, name) => {
								var child = self.makeChild(name, this); // 'this' is the dom element we just appended
								child.enter();
							});
						});
			}
			selection = self.selectAll().data(self.data);
			if (update) {
				selection
						.call(self.updateCb, self.cbParams)
						.each(function(d) {
							_.each(self.children(), (c, name) => {
								self.child(name).update();
							});
						})
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
		makeChild(name, parentElement) {
			var desc = this.childDesc(name);
			var params = $.extend(
				{ parentElement,
					data: d=>[d],	// pass data down to child unless desc provides
											// its own data function
				}, desc);
			return this.child(name, new D3Element(params));
		}
		children() {
			return this._children;
		}
		exit() {
			return this.run(false, true, false);
		}
		enter() {
			return this.run(true, false, false);
		}
		update() {
			return this.run(false, false, true);
		}
	}
	
	// END module functions
	
	utilModule.dirtyFlag = dirtyFlag;
	utilModule.d3AddIfNeeded = d3AddIfNeeded;
	utilModule.getContainer = getContainer;
	utilModule.D3Element = D3Element;
	
	return utilModule;
	
});
