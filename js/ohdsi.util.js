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
	function d3AddIfNeeded({parentElement, data, tag, classes, addCb, updateCb, 
												  cbParams} = {}) {
		var el = getContainer(parentElement, "d3");
		var selection = el.selectAll([tag].concat(classes).join('.'));
		if (Array.isArray(data)) {
			selection = selection.data(data);
		} else {
			selection = selection.datum(data);
			// or? selection = selection.data([data]);
		}
		selection.exit().remove();
		selection.enter().append(tag)
				.each(function(d) {
					var newNode = d3.select(this);
					classes.forEach(cls => {
						newNode.classed(cls, true);
					});
				})
				.call(addCb||function(){}, cbParams);
		selection = el.selectAll([tag].concat(classes).join('.'));
		selection.call(updateCb||function(){}, cbParams);
		return selection;
	}
	
	// END module functions
	
	utilModule.dirtyFlag = dirtyFlag;
	utilModule.d3AddIfNeeded = d3AddIfNeeded;
	utilModule.getContainer = getContainer;
	
	return utilModule;
	
});
