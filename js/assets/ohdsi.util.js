/* assets/ohdsi.util version 1.1.0
 *
 * Author: Chris Knoll (I think)
 *			AMD setup
 *			_pruneJSON
 *			dirtyFlag
 *
 * Author: Sigfried Gold
 *			elementConvert
 *			d3AddIfNeeded
 *			D3Element
 *			shapePath
 *				ResizableSvgContainer extends D3Element
 *			  SvgLayout
 *			  SvgElement
 *			  ChartLabel extends SvgElement
 *			  ChartLabelLeft extends ChartLabel
 *			  ChartLabelBottom extends ChartLabel
 *			  ChartAxis extends SvgElement
 *			  ChartAxisY extends ChartAxis
 *			  ChartAxisX extends ChartAxis
 *			  ChartChart extends SvgElement
 *			  ChartProps
 *			  getState, setState, deleteState, hasState, onStateChange
 *			  Field
 *			  cachedAjax
 *			  storagePut
 *			  storageExists
 *			  storageGet
 *				SharedCrossfilter
 */
define(['jquery', 'knockout', 'lz-string', 'lodash', 'crossfilter'], function ($, ko, LZString, _, crossfilter) {

	var DEBUG = true;
	var ALLOW_CACHING = [
		//'.*',
		//'/WebAPI/[^/]+/person/',
	];

	var utilModule = {
		version: '1.0.0'
	};

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

		let origState = new Map();
		let changedObservablesCount = ko.observable();
		let changedCount = ko.observable();

		const getObjectObservables = function (obj, res, currentPath = '') {
			if (typeof obj === 'object') {
				for (let key in obj)
				{
					if (obj.hasOwnProperty(key)) {
						let path = `${currentPath}.${key}`.replace(/^\./, '');
						if (typeof obj[key] !== 'undefined' && obj[key] !== null && typeof obj[key].subscribe === 'function') {
							res[path] = obj[key].extend({ childChanges: true });
						}
						let variable = ko.utils.unwrapObservable(obj[key]);
						if (typeof variable === 'object') {
							getObjectObservables(variable, res, path);
						}
					}
				}
			}
			return res;
		};

		const addObservablesToState = function (state, observables) {
			for (let i in observables) {
				(function(key) {
					let subscription = observables[key].subscribe(newVal => {
						changedCount(changedCount() + 1);
						const stateEntry = state.get(key);
						const isTypeChanged = ko.toJSON(newVal) === '""' && stateEntry.origVal === 'null';
						if (ko.toJSON(newVal) !== stateEntry.origVal && !isTypeChanged && !stateEntry.wasChanged) {
							stateEntry.wasChanged = true;
							changedObservablesCount(changedObservablesCount() + 1);
							addObservablesToState(state, getObjectObservables(newVal, {}));
						} else if ((ko.toJSON(newVal) === stateEntry.origVal || isTypeChanged) && stateEntry.wasChanged) {
							stateEntry.wasChanged = false;
							changedObservablesCount(changedObservablesCount() - 1);
						}
					});
					state.set(key, { subscription, wasChanged: false, origVal: ko.toJSON(observables[key]) });
				})(i);
			}
		};

		const setNewState = function (newState) {
			// clean up prev data
			origState.forEach(entry => entry.subscription.dispose());

			// setup new data
			let observables = getObjectObservables(newState, {});
			origState = new Map();
			addObservablesToState(origState, observables);
			changedObservablesCount(0);
			changedCount(0);
		};

		const result = function () {},
			_isInitiallyDirty = ko.observable(isInitiallyDirty);

		setNewState(root);

		result.isDirty = ko.pureComputed(function () {
			return _isInitiallyDirty() || changedObservablesCount();
		}).extend({
			rateLimit: 200
		});

		result.isChanged = ko.pureComputed(function () {
			return changedCount();
		}).extend({
			rateLimit: {
				timeout: 1000,
				method: "notifyWhenChangesStop"
			}
		});

		result.reset = function () {
			_isInitiallyDirty(false);
			setNewState(root);
		};

		return result;
	}

	/* elementConvert
	 * call with css id (with or without #)
	 *				or dom node or d3 selection or jquery selection
	 *
	 * returns type requested ("dom", "d3", "jquery", "id")
	 */
	function elementConvert(target, type = "dom") {
		if (target.selectAll) { // it's a d3 selection
			if (type === "d3") return target;

			//console.warn("this should't return target.node(), it should return target[0]");
			//   but i haven't been able to get that to work yet
			return elementConvert(target.node(), type); // call again with dom node
			// (first in selection, that is)
		}
		if (target.jquery) { // it's a jquery selection
			if (type === "jquery") return target;
			return elementConvert(target[0], type); // call again with dom node
		}
		if (typeof target === "string") { // only works with ids for now, not other css selectors
			var id = target[0] === '#' ? target.slice(1) : target;
			var dom = document.getElementById(id);
			if (dom) return elementConvert(dom, type); // call again with dom node
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
	function d3AddIfNeeded({
		parentElement,
		data,
		tag,
		classes = [],
		addCb = () => {},
		updateCb = () => {},
		cbParams
	} = {}) {
		var el = elementConvert(parentElement, "d3");
		var selection = el.selectAll([tag].concat(classes).join('.'));
		if (Array.isArray(data)) {
			selection = selection.data(data);
		} else {
			selection = selection.data([data]);
			// might want this? : selection = selection.datum(data);
		}
		selection.exit().remove();
		selection.enter().append(tag)
			.each(function (d) {
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
	 * making a new D3Element instance (d3El) will add <tag> elements to the
	 * parentElement using a D3 join to the data param. but if elements
	 * already exist, they elements will be appropriately joined to the
	 * data: extras will be removed (after running an exit callback if
	 * you specify one), entering items will be appended, and the update
	 * callback will be run on everything remaining after the join.
	 *
	 * you could also just say: d3El.data(newData); d3El.run(). that will
	 * also perform the appropriate join and run the callbacks.
	 *
	 * so you do not need to keep track of whether you've already created
	 * the elements. if you have and you still have a reference to the
	 * D3Element instance, d3El.data(d); d3El.run(); works. but calling the
	 * same code that created it originally and sending new data will
	 * work as well.
	 *
	 * if you also create child elements like:
	 *    var d3El = new D3Element(params);
	 *    d3El.addChild(params);
	 * then calling d3El.data(newData); d3El.run(); will not only update d3El,
	 * it will also rejoin and update its children with newData.
	 *
	 * var d3El = new D3Element({parentElement:p,
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
	 *																				 // run extra code when d3El is
	 *																				 // first created
	 *												  exitCb: null,  // only needed if you want
	 *																				 // to run extra code (transition?)
	 *																				 // when d3El is removed
	 *												  cbParams: null,// will be passed to all callbacks
	 *																				 // along with d3 selection
	 *												  updateCb:			 // code to run on creation and
	 *																				 // after possible data changes
	 *																		function(selection, cbParams, updateOpts) {
	 *																			// updateOpts are set by calling
	 *																			// d3El.run(opts) or d3El.update(opts)
	 *																			// and they are sent to the updateCb not
	 *																			// just for the d3El in question, but to
	 *																			// all its children
	 *																			selection
	 *																				.attr('x', function(d) {
	 *																					return cbParams.scale(cbParams.xVal(d))
	 *																				})
	 *																		},
	 *													children: null,// k/v obj with child descriptors (need to document)
	 *																				 // should only allow children with explicit d3El.addChild
	 *													dataPropogationSelectors: null, // document when implemented
	 *												});
	 *
	 * d3El.run() returns the d3 selection after performing joins and running callbacks.
	 * you can also get the d3 selection with d3El.selectAll();
	 *
	 * there are many ways to add child elements (using the addChild method, using
	 * the d3 selection returned from run and selectAll methods, or in the add or
	 * update callbacks). I recommend:
	 *
	 *		add using d3El.addChild()
	 *		set attributes in the update callback
	 *		don't use the d3 selections at all
	 *		you probably don't need to do anything in the enterCb
	 *		(because that would probably mean creating some nested dom nodes
	 *		below the one you're adding, and then how would you access those?)
	 */
	function combineFuncs(funcs) {
		return (...args) => {
			return funcs.map(function (f) {
				return f.apply(this, args)
			})
		}
	}
	class D3Element {
		constructor(props, passParams = {}, parentSelection, parentD3El) {
			// really need to change (simplify) the way data and opts are
			// handled...  this whole thing is a bit of a monstrosity
			this.parentD3El = parentD3El;
			/* not using anymore:
			this.parentElement = props.parentElement // any form ok: d3, jq, dom, id
														|| this.parentD3El.selectAll();
			this.el = elementConvert(this.parentElement, "d3");
			*/
			this.parentSelection = parentSelection;
			this.tag = props.tag;
			this.classes = props.classes || [];
			this.enterCb = props.enterCb || (() => {});
			this.updateCb = props.updateCb || (() => {});
			this.updateCb = props.updateCbs ? combineFuncs(props.updateCbs) // in case you want to run more than one callback on update
				:
				this.updateCb;
			this.exitCb = props.exitCb || (() => {});
			this.cbParams = props.cbParams;
			this._children = {};
			//this.dataPropogationSelectors = props.dataPropogationSelectors; // not implemented yet
			if (typeof props.data === "function")
				/*
				console.warn(`d3 is supposed to handle selectAll().data(fn) nicely,
										 but it doesn't. so you can pass a func that accepts its
										 d3El and returns a data array`);
				*/
				this.dataKey = props.dataKey;
			if (!props.stub) {
				// props.data can be array or function that accepts this.parentD3El
				// or it will default to parent's data
				// but it can be overridden later:
				//	 permanently by calling this.data(parentD3El, newData)
				//	 or temporarily by calling this.selectAll(newData)
				this._data = props.data || this.parentD3El._data;
				if (!(Array.isArray(this._data) || typeof this._data === 'function'))
					throw new Error("data must be array or function");
				this.run(passParams);
			}
		}
		selectAll() {
			var cssSelector = [this.tag].concat(this.classes).join('.');
			return this.parentSelection.selectAll(cssSelector);
		}
		selectAllJoin(data) {
			data = data || this._data;
			if (typeof data === "function") {
				// the function should accept 'this' and return the join selection
				return data(this);
				/*
				return this.dataKey ?
								this.selectAll().data(data(this.parentD3El._data), this.dataKey) :
								this.selectAll().data(data(this.parentD3El._data));
				*/
			} else {
				return this.dataKey ?
					this.selectAll().data(data, this.dataKey) :
					this.selectAll().data(data);
			}
		}
		as(type) {
			return elementConvert(this.selectAll(), type);
		}
		data(data) {
			//bad idea:
			//if (typeof data === "undefined") return this.selectAll().data();
			//hope i'm not breaking anything by doing the more expectable:
			if (typeof data === "undefined") return this._data;
			if (!(Array.isArray(data) || typeof data === 'function'))
				throw new Error("data must be array or function");
			this._data = data;
			//return this.selectAll(data);  same here... don't think this was being used
			return this;
		}
		run(passParams = {}, enter = true, exit = true, update = true) {
			// fix opts: split up data and transition
			let self = this;
			var data = passParams.data || self._data;
			var selection = self.selectAllJoin(data);

			var passParamsForChildren = _.omit(passParams, ['data']); // data gets passed automatically
			//var {delay=0, duration=0} = passParams;

			//var mainTrans = passParams.transition || d3.transition();
			//passParams.transition = mainTrans;
			// should allow callbacks to pass transitions back so they
			// can be passed on to next callback?

			if (exit && selection.exit().size()) {
				//if (selection.exit().size()) console.log(`exiting ${self.name}`);
				var exitSelection = selection.exit();
				_.each(self.children(), (c, name) => {
					self.child(name).exit(passParamsForChildren, exitSelection);
				});
				exitSelection
					//.call(self.exitCb, self.cbParams, passParams, self, mainTrans)
					.call(self.exitCb, self.cbParams, passParams, self)
					.remove() // allow exitCb to remove? -> doesn't seem to work
			}
			if (enter && selection.enter().size()) {
				var enterSelection = selection.enter()
					.append(self.tag)
					.each(function (d) { // add classes
						var newNode = d3.select(this);
						self.classes.forEach(cls => {
							newNode.classed(cls, true);
						});
					})
					//.call(self.enterCb, self.cbParams, passParams, self, mainTrans)
					.call(self.enterCb, self.cbParams, passParams, self)
				_.each(self.children(), (c, name) => {
					var child = self.makeChild(name, passParamsForChildren, enterSelection);
				});
			}
			selection = self.selectAllJoin(data);
			if (update && selection.size()) {
				selection
					//.call(self.updateCb, self.cbParams, passParams, self, mainTrans)
					.call(self.updateCb, self.cbParams, passParams, self)
				_.each(self.children(), (c, name) => {
					self.child(name).run(passParamsForChildren, enter, exit, update, selection);
				});
			}
			return selection;
		}
		childDesc(name, desc) {
			if (desc)
				this._children[name] = {
					desc
				};
			else if (!this._children[name])
				throw new Error(`${name} child not created yet`);
			return this._children[name].desc;
		}
		child(name, d3El) {
			if (!this._children[name])
				throw new Error(`${name} child not created yet`);
			if (d3El)
				this._children[name].d3El = d3El;
			return this._children[name].d3El;
		}
		addChild(name, desc, passParams) {
			this.childDesc(name, desc);
			if (desc.stub)
				return this.childDesc(name);
			return this.makeChild(name, passParams, this.selectAll()); // this.selectAll()?
		}
		// should we attempt to send selectAll options (for transition durations)
		// through addChild/makeChild? not doing this yet. but update calls will
		// send these options down the D3Element tree
		makeChild(name, passParams, selection) {
			var desc = this.childDesc(name);
			//var d3ElProps = $.extend( { parentD3El: this }, desc);
			var d3ElProps = _.merge({
				parentD3El: this
			}, _.cloneDeep(desc));
			return this.child(name, new D3Element(d3ElProps, passParams, selection, this));
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
		implicitChild(selectorFunc) {}
		exit(passParams) {
			return this.run(passParams, false, true, false);
		}
		enter(passParams) {
			return this.run(passParams, true, false, false);
		}
		update(passParams) {
			return this.run(passParams, false, false, true);
		}
	}

	function shapePath(type, cx, cy, r) {
		// shape fits inside the radius
		var shapes = {
			circle: function (cx, cy, r) {
				// http://stackoverflow.com/questions/5737975/circle-drawing-with-svgs-arc-path
				return `
													M ${cx} ${cy}
													m -${r}, 0
													a ${r},${r} 0 1,0 ${r * 2},0
													a ${r},${r} 0 1,0 ${-r * 2},0
												`;
			},
			square: function (cx, cy, r) {
				var side = Math.sqrt(1 / 2) * r * 2;
				return `
													M ${cx} ${cy}
													m ${-side / 2} ${-side / 2}
													l ${side} 0
													l 0 ${side}
													l ${-side} 0
													z
												`;
			},
			triangle: function (cx, cy, r) {
				var side = r * Math.sqrt(3);
				var alt = r * 1.5;
				return `
													M ${cx} ${cy}
													m 0 ${-r}
													l ${side/2} ${alt}
													l ${-side} 0
													z
												`;
			},
		}
		if (type === "types")
			return _.keys(shapes);
		if (!(type in shapes)) throw new Error("unrecognized shape type");
		return shapes[type](cx, cy, r);
	}

	// svgSetup could probably be used for all jnj.charts; it works
	// (i believe) the way line chart and scatterplot were already working
	// (without the offscreen stuff, which I believe was not necessary).
	class ResizableSvgContainer extends D3Element {
		// call from chart obj like:
		//	var divEl = svgSetup.call(this, data, target, w, h, ['zoom-scatter']);
		// target gets a new div, new div gets a new svg. div/svg will resize
		//	with consistent aspect ratio.
		// svgSetup can be called multiple times but will only create div/svg
		//	once. data will be attached to div and svg (for subsequent calls
		//	it may need to be propogated explicitly to svg children)
		// returns a D3Element
		// ( maybe shouldn't send data to this func, attach it later)
		constructor(target, data, w, h, divClasses = [], svgClasses = [], makeMany = false) {
			if (Array.isArray(data) && data.length > 1 && !makeMany) {
				data = [data];
			}

			function aspect() {
				return w / h;
			}
			super({
				//parentElement: target,
				data,
				tag: 'div',
				classes: divClasses,
			}, undefined, elementConvert(target, 'd3'));
			var divEl = this;
			var svgEl = divEl.addChild('svg', {
				tag: 'svg',
				classes: svgClasses,
				updateCb: function (selection, params, updateOpts, thisEl) {
					var targetWidth = divEl.divWidth();
					selection
						.attr('width', targetWidth)
						.attr('height', Math.round(targetWidth / aspect()))
						.attr('viewBox', '0 0 ' + w + ' ' + h);
				},
			});
			this.w = w;
			this.h = h;
			this.svgClasses = svgClasses;
			var resizeHandler = $(window).on("resize",
				() => svgEl.as('d3')
				.attr("width", this.divWidth())
				.attr("height", Math.round(this.divWidth() / aspect())));
			setTimeout(function () {
				$(window).trigger('resize');
			}, 0);
		}
		divWidth() {
			try {
				return this.as("jquery").width();
			} catch (e) {
				return this.w;
			}
		}
	}
	/*
	// svgSetup could probably be used for all jnj.charts; it works
	// (i believe) the way line chart and scatterplot were already working
	// (without the offscreen stuff, which I believe was not necessary).
	function svgSetup(target, data, w, h, divClasses=[], svgClasses=[]) {
			// call from chart obj like:
			//	var divEl = svgSetup.call(this, data, target, w, h, ['zoom-scatter']);
			// target gets a new div, new div gets a new svg. div/svg will resize
			//	with consistent aspect ratio.
			// svgSetup can be called multiple times but will only create div/svg
			//	once. data will be attached to div and svg (for subsequent calls
			//	it may need to be propogated explicitly to svg children)
			// returns a D3Element
		// ( maybe shouldn't send data to this func, attach it later)
			this.container = this.container || elementConvert(target, "dom");
			if (Array.isArray(data) && data.length > 1) {
				data = [data];
			}
			this.svgDivEl = new D3Element( {
							parentElement:this.container,
							data, tag:'div', classes: divClasses,
			});
			var self = this;
			this.svgDivEl.addChild('svg',
										{
												tag: 'svg',
												classes: svgClasses,
												updateCb: function(selection, params, updateOpts) {
													try {
														var targetWidth = self.svgDivEl.as("jquery").width();
													} catch(e) {
														var targetWidth = w;
													}
													var aspect = w/h;
													console.log(targetWidth, aspect);
													selection
														//.attr('width', w)
														//.attr('height', h)
														.attr('width', targetWidth)
														.attr('height', Math.round(targetWidth / aspect))
														.attr('viewBox', '0 0 ' + w + ' ' + h);
												},
											});
			var resizeHandler = $(window).on("resize", {
					svgDivEl: this.svgDivEl,
					aspect: w / h
				},
				function (event) {
					// set svg to size of container div
					var targetWidth = event.data.svgDivEl.as("jquery").width();
					event.data.svgDivEl.child('svg').as("d3")
								.attr("width", targetWidth)
								.attr("height", Math.round(targetWidth / event.data.aspect));
				});

			setTimeout(function () {
				$(window).trigger('resize');
			}, 0);
			return this.svgDivEl;
	}
	*/


	/* SvgLayout class
	 * manages layout of subcomponents in zones of an svg
	 * initialize with layout like:
		 var layout = new SvgLayout(w, h,
					// zones:
					{
						top: { margin: { size: 5}, }, // top zone initialized with margin
																					// 5 pixels (or whatever units) high
						bottom: { margin: { size: 5}, },
						left: { margin: { size: 5}, },
						right: { margin: { size: 5}, },
					})
	 * add components to zones like one of these:

			// size is constant:
			layout.add('left','axisLabel', { size: 20 })

			// size returned by function:
			layout.add('left','axisLabel', { size: ()=>axisLabel.node().getBBox().width * 1.5 })

			// provide svg element to get size from (must specify 'width' or 'height' as dim)
			layout.add('left','axis', { obj: cp.y.axisG.node(), dim:'width' })

	 * retrieve dimensions of svg chart area (inside all zones):
			layout.svgWidth()
			layout.svgHeight()
	 * retrieve svg dimensions:
			layout.w()
			layout.h()
	 * retrieve total size of zone
			layout.zone('bottom')
	 * retrieve total size of one zone element
			layout.zone('left.margin')
	 * retrieve total size of more than one zone element
			layout.zone(['left.margin','left.axisLabel'])
	 * y position of bottom zone:
			layout.h() - layout.zone('bottom')
	 *
	 * when adding zones, you can also include a position func that will
	 * do something based on the latest layout parameters
	 *
			var position = function(layout) {
				// positions element to x:left margin, y: middle of svg area
				axisLabel.attr("transform",
					`translate(${layout.zone(["left.margin"])},
										 ${layout.zone(["top"]) + (h - layout.zone(["top","bottom"])) / 2})`);
			}
			layout.add('left','axisLabel', { size: 20 }, position: position)
	 *
	 * whenever you call layout.positionZones(), all registered position functions
	 * will be called. the position funcs should position their subcomponent, but
	 * shouldn't resize them (except they will, won't they? because, e.g.,
	 * the y axis needs to fit after the x axis grabs some of the vertical space.
	 * but as long as left and right regions don't change size horizontally and top
	 * and bottom don't change size vertically, only two rounds of positioning
	 * will be needed)
	 */
	class SvgLayout {
		constructor(w, h, zones) {
			this._w = w;
			this._h = h;
			['left', 'right', 'top', 'bottom'].forEach(
				zone => this[zone] = _.cloneDeep(zones[zone]));
			this.chart = {};
		}
		svgWidth() {
			return this._w - this.zone(['left', 'right']);
		}
		svgHeight() {
			return this._h - this.zone(['top', 'bottom']);
		}
		w() {
			return this._w;
		}
		h() {
			return this._h;
		}
		zone(zones) {
			zones = typeof zones === "string" ? [zones] : zones;
			var size = _.chain(zones)
				.map(zone => {
					var zoneParts = zone.split(/\./);
					if (zoneParts.length === 1 && this[zoneParts]) {
						return _.values(this[zoneParts]);
					}
					if (zoneParts.length === 2 && this[zoneParts[0]][zoneParts[1]]) {
						return this[zoneParts[0]][zoneParts[1]];
					}
					throw new Error(`invalid zone: ${zone}`);
				})
				.flatten()
				.map(d => {
					return d.obj ? d.obj.getBBox()[d.dim] : d3.functor(d.size)();
				})
				.sum()
				.value();
			//console.log(zones, size);
			return size;
		};
		add(zone, componentName, config) {
			return this[zone][componentName] = config;
		}
		positionZones() {
			return _.chain(this)
				.map(_.values)
				.compact()
				.flatten()
				.map('position')
				.compact()
				.each(position => position(this))
				.value();
		}
	}
	/* SvgElement combines D3Element, SvgLayout, and ChartProps
	 * ChartProps is where configuration options for your chart
	 * are assembled. SvgElement is the place for code that
	 * generates common chart elements (axes, labels, etc.)
	 * So your chart code shouldn't have to worry about placement
	 * of these items (and readjusting placement of other items
	 * when the size of these changes). Chart code should just
	 * say what elements should be included and should (probably
	 * through chartProps) provide methods for generating their
	 * content.
	 *
	 * SvgElement will make a g as a child of the parent D3Element
	 * and then another element inside that (determined by the subclass).
	 *
	 * SvgElement is an abstract class. Subclasses should define
	 *	- zone: where they belong: top, bottom, left, right, center
	 *	- subzone: their (unique) name within their zone
	 *	- enterCb: to be passed to D3Element
	 *	- gEnterCb: enterCb for the g container
	 *	- updateContent: updateCb to be passed to D3Element
	 *	- updatePosition: updateCb to be passed to the g container
	 *	- sizedim: width or height. for determining this element's size
	 *	- size: optional func. by default size is sizedim of element's
	 *			g's getBBox()
	 *
	 * SvgElements are one per chart instance. Use them to make titles,
	 * axes, legends, etc. Not to make dots. The data they get is
	 * the chartProp
	 *
	 */
	class SvgElement {
		// assume it always gets a g and then something inside the g
		// the inside thing will be added in the subclass's _addContent
		// method which will include a line like this.gEl.addChild(...).
		// so making a new SvgElement means adding a child (g) and a
		// grandchild (whatever) to the parent D3Eelement
		constructor(d3El, layout, chartProp) {
			if (new.target === SvgElement) throw TypeError("new of abstract class SvgElement");
			this.parentEl = d3El;
			this.layout = layout;
			this.chartProp = chartProp;
			this.gEl = d3El.addChild(chartProp.name, {
				tag: 'g',
				data: [chartProp],
				classes: this.cssClasses(), // move to gEnterCb
				// no, don't, will break D3Element
				enterCb: this.gEnterCb.bind(this),
				updateCb: this.updatePosition.bind(this),
				cbParams: {
					layout
				},
			});
			if (!this.emptyG()) {
				// if g is empty, don't use enterCb ot updateContent methods
				this.contentEl = this.gEl.addChild(chartProp.name, {
					tag: this.tagName(),
					data: [chartProp],
					classes: this.cssClasses(), // move to enterCb
					enterCb: this.enterCb.bind(this),
					updateCb: this.updateContent.bind(this),
					cbParams: {
						layout
					},
				});
			}

			layout.add(this.zone(), this.subzone(), {
				size: this.size.bind(this),
				position: this.updatePosition.bind(this, this.gEl.as('d3'), {
					layout: this.layout
				}),
			});
		}
		enterCb() {}
		gEnterCb() {}
		updateContent() {}
		updatePosition() {}
		emptyG() {}
		size() {
			return this.gEl.as('dom').getBBox()[this.sizedim()];
		}
	}

	class ChartChart extends SvgElement {
		zone() {
			return 'chart';
		}
		subzone() {
			return 'chart';
		}
		cssClasses() { // classes needed on g element
			return [this.chartProp.cssClass];
		}
		gEnterCb(selection, params, opts) {
			selection.attr('clip-path', 'url(#clip)');
		}
		tagName() {
			return 'defs';
		}
		enterCb(selection, params, opts) {
			selection.append("defs")
				.append("clipPath")
				.attr("id", "clip")
				.append("rect")
				.attr("width", this.layout.svgWidth())
				.attr("height", this.layout.svgHeight())
				.attr("x", 0)
				.attr("y", 0);
		}
		updatePosition(selection, params, opts) {
			selection
				.attr("transform",
					`translate(${params.layout.zone(['left'])},${params.layout.zone(['top'])})`)
		}
	}
	class ChartInset extends SvgElement {
		emptyG() {
			return true;
		}
		cssClasses() { // classes needed on g element
			return ['insetG'];
		}
		zone() {
			return 'top';
		}
		subzone() {
			return 'inset';
		}
		tagName() {
			return 'g';
		}
		sizedim() {
			return 0;
		}
		updatePosition(selection, params, opts) {
			selection.attr('transform',
				`translate(${params.layout.w(params.layout) - this.w(params.layout)},0)`);
		}
		// could hold on to original layout instead of passing in as param...maybe
		//   not sure if it would get stale
		w(layout) {
			return layout.w() * 0.15;
		}
		h(layout) {
			return layout.h() * 0.15;
		}
	}
	class ChartLabel extends SvgElement {
		tagName() {
			return 'text';
		}
	}
	class ChartLabelLeft extends ChartLabel {
		cssClasses() { // classes needed on g element
			return ['y-axislabel', 'axislabel'];
		}
		zone() {
			return 'left';
		}
		subzone() {
			return 'axisLabel';
		}
		sizedim() {
			return 'width';
		}
		size() {
			return this.gEl.as('dom').getBBox().width * 1.5;
			// width is calculated as 1.5 * box height due to rotation anomolies
			// that cause the y axis label to appear shifted.
		}
		updateContent(selection, params, opts) {
			selection
				.attr("transform", "rotate(-90)")
				.attr("y", 0)
				.attr("x", 0)
				.attr("dy", "1em")
				.style("text-anchor", "middle")
				.text(field => fieldAccessor(field, ['label', 'title', 'name'], 'Y Axis')())
		}
		updatePosition(selection, params, opts) {
			selection.attr('transform',
				`translate(${params.layout.zone(["left.margin"])},
										${params.layout.zone(["top"]) + (params.layout.h() - params.layout.zone(["top","bottom"])) / 2})`);
		}
	}
	class ChartLabelBottom extends ChartLabel {
		cssClasses() { // classes needed on g element
			return ['x-axislabel', 'axislabel'];
		}
		zone() {
			return 'bottom';
		}
		subzone() {
			return 'axisLabel';
		}
		sizedim() {
			return 'height';
		}
		enterCb(selection, params, opts) {
			selection
				.style("text-anchor", "middle")
		}
		updateContent(selection, params, opts) {
			selection
				.text(field => fieldAccessor(field, ['label', 'title', 'name'], 'X Axis')())
		}
		updatePosition(selection, params, opts) {
			selection.attr('transform',
				`translate(${params.layout.w() / 2},${params.layout.h() - params.layout.zone(["bottom.margin"])})`);
		}
	}

	class ChartAxis extends SvgElement {
		//tagName() { return 'g'; }  // pretty bad. axes have an unneeded extra g
		emptyG() {
			return true;
		}
		gEnterCb(selection, params, opts) {
			this.axis = this.chartProp.axis || d3.svg.axis();
			// somewhat weird that scale belongs to chartProp and axis belongs to svgElement
		}
		updatePosition(selection, params, opts) {
			this.axis.scale(this.chartProp.scale)
				.tickFormat(this.chartProp.format)
				.ticks(this.chartProp.ticks)
				.orient(this.zone());
		}
	}
	class ChartAxisY extends ChartAxis {
		zone() {
			return 'left';
		}
		subzone() {
			return 'axis';
		}
		sizedim() {
			return 'width';
		}
		cssClasses() {
			return ['y', 'axis'];
		} // classes needed on g element
		updatePosition(selection, params, opts) {
			this.chartProp.scale.range([params.layout.svgHeight(), 0]);
			super.updatePosition(selection, params, opts);
			// params.layout === this.layout (i think)
			selection
				.attr('transform',
					`translate(${params.layout.zone(['left'])},${params.layout.zone(['top'])})`)
			this.axis && selection.call(this.axis);
		}
	}
	class ChartAxisX extends ChartAxis {
		zone() {
			return 'bottom';
		}
		subzone() {
			return 'axis';
		}
		sizedim() {
			return 'height';
		}
		updatePosition(selection, params, opts) {
			if (this.chartProp.tickFormat) { // check for custom tick formatter
				this.axis.tickFormat(this.chartProp.tickFormat); // otherwise uses chartProp.format above
			}
		}
		cssClasses() { // classes needed on g element
			return ['x', 'axis'];
		}
		updatePosition(selection, params, opts) {
			// if x scale is ordinal, then apply rangeRoundBands, else apply standard range
			if (typeof this.chartProp.scale.rangePoints === 'function') {
				this.chartProp.scale.rangePoints([0, params.layout.svgWidth()]);
			} else {
				this.chartProp.scale.range([0, params.layout.svgWidth()]);
			}
			super.updatePosition(selection, params, opts);
			selection
				.attr('transform', `translate(${params.layout.zone('left')},
																${params.layout.h() - params.layout.zone('bottom')})`);
			this.axis && selection.call(this.axis);
		}
	}
	/* ChartProps OBSOLETE, using _.merge now
				some of this documentation is worth keep and putting in new places
				even though it describes a class that is no longer present
	 * The chart class should have default options
	 * which can be overridden when instantiating the chart.
	 * All options are grouped into named chartProps, like:
	 * (For example defaults, see this.defaultOptions in module.zoomScatter.
	 *	For an example of explicit options, see function chartOptions() in sptest.js.)
	 *
				defaults = {
					x: {
								showAxis: true,
								showLabel: true,
								rangeFunc: layout => [0, layout.svgWidth()],
								format: module.util.formatSI(3),
								ticks: 10,
								needsLabel: true,
								needsValueFunc: true,
								needsScale: true,
					},...
				}
				explicit = {
					x: {
								value: d=>d.beforeMatchingStdDiff,
								label: "Before matching StdDiff",
								tooltipOrder: 1,
					},...
				}
	 *
	 * If a chart is expecting a label for some prop (like an axis
	 * label for the x axis or tooltip label for the x value), and
	 * no prop.label is specified, the prop name will be used (e.g., 'x').
	 * prop.label can be a function. If it's a string, it will be turned
	 * into a function returning that string. (So the chart needs to
	 * call it, not just print it.) Label generation will be done
	 * automatically if prop.needsLabel is true.
	 *
	 * If needsValueFunc is true for a prop, prop.value will be used.
	 * If prop.value hasn't been specified in default or explicit
	 * prop options, it will be be generated from the label. (Which is
	 * probably not what you want as it will give every data point's
	 * x value (for instance) as x's label.)
	 *
	 * If prop.value is a string or number, it will be transformed into
	 * an accessor function to extract a named property or indexed array
	 * value from a datum object or array.
	 *
	 * If prop.value is a function, it will be called with these arguments:
	 *		- datum (usually called 'd' in d3 callbacks)
	 *		- index of datum in selection data (i)
	 *		- index of data group (series) in parent selection (j)
	 *		- the whole ChartProps instance
	 *		- all of the data (not grouped into series)
	 *		- data for the series
	 *		- prop name (so you can get prop with chartProps[name])
	 *
	 * If prop.needsScale is true, prop.scale will be used (it will default
	 * to d3.scale.linear if not provided.) prop.domainFunc and prop.rangeFunc
	 * will be used to generate domain and range. If they are not provided
	 * they will be generated as functions returning prop.domain or prop.range
	 * if those are provided. If neither prop.domainFunc nor prop.domain is
	 * provided, a domainFunc will be generated that returns the d3.extent
	 * of the prop.value function applied to all data items.
	 * If neither prop.rangeFunc nor prop.range is provided, an Error will be
	 * thrown.
	 *
	 * The domainFunc will be called with these arguments:
	 *		- the whole data array (not grouped into series)
	 *		- the array of series
	 *		- the whole ChartProps instance
	 *		- prop name
	 *
	 * The rangeFunc will be called with these arguments:
	 *		- the SvgLayout instance
	 *		- the chartProp
	 *		- the wholeChartProps instance
	 *		- prop name
	 * If rangeFunc returns nothing (or anything falsy), the range will not
	 * be set on prop.scale. This is important because for some scales you
	 * may want to do something other than set scale.range(). For instance:
	 *	prop.rangeFunc = function(layout, prop, props) {
	 *											prop.scale.rangePoints([0, layout.w()]);
	 *										}
	 * This function will not return a range to be passed to prop.scale.range
	 * but will call prop.scale.rangePoints() itself.
	 *
	 * Set all scale.domains by calling
	 *		cp.updateDomains(data, series)
	 *
	 * Set all scale.ranges by calling
	 *		cp.updateRanges(layout)
	 *
	 * Also, before drawing data points (and if data changes), you should call
	 *		cp.updateAccessors(data, series)
	 * This will assure that prop.value will be called with fresh data and series
	 * arguments.
	 *
	 * And:
	 *		cp.tooltipSetup(data, series)
	 * If prop.tooltipFunc is provided, it will be setup to receive the same
	 * arguments as prop.value. If not, a tooltipFunc will be generated that
	 * returns results from prop.label and prop.value. tooltipFunc is expected
	 * to return an object with a label property and a value property.
	 * (What about formatting?)
	 * Tooltip content will only be generated for props where prop.tooltipOrder
	 * is provided (it should be a non-zero number.)
	 */


	/* @class Field
	 * fields are complex things that get used and accessed in different
	 * ways in different places. most simply a field might be 'age' in
	 * a recordset like:
	 *		[ {gender: 'F', age: 67, weight: 122, height: 65},
	 *			{gender: 'M', age: 12, weight: 84, height: 58} ]
	 *
	 * or a field could be derived, like, say:
	 *	bmi = d => convert(d.weight, 'lb', 'kg') /
	 *							Math.pow(convert(d.height, 'in', 'm'), 2);
	 *
	 * but in addition to having a property name ('age') or accessor function
	 * (bmi) to extract a value from an object, fields may need names, labels
	 * for display in different contexts, functions for grouping and filtering
	 * values, and more.
	 *
	 * in a chart context, a field like 'age' might also be used as the chart
	 * attribute 'x'. in that case it will also need a way to compute domain:
	 *
	 *			d3.extent(dataset.map(d=>d.age))
	 *
	 * and range (which has nothing to do with age but is based on the pixel
	 * width of the chart).
	 *
	 * in a crossfilter context a field will be associated with a crossfilter
	 * dimension:   dim = cf.dimension(d=>d.age)
	 * and possible filters: dim.filter([65, 90])
	 *
	 * in a faceted datatable context a field will need a grouping function, e.g.,
	 *
	 *			d => d <= 10 ? '0 - 10' :
	 *			     d <= 20 ? '11 - 20' : 'older than 20';
	 *
	 * and maybe a way of keeping track of or reporting which facet members are
	 * selected
	 *
	 * in a component that displays, say, a scatterplot and an associated datatable
	 * 'age' as a continuous value may serve as 'x' in the scatterplot and a column
	 * in the datatable, and as a grouped value may serve as a facet for the datatable.
	 * should the continuous age and the grouped age be considered the same field?
	 * i'm not sure. probably not.
	 *
	 * in a data-specific component (say a demographics browser) the age field may
	 * be referenced explicitly, but from the point of view of the scatterplot
	 * it will just be thought of as the 'x' field (while probably needing to know
	 * that it is called both 'x' and 'Age' for display in the legend or tooltips.
	 *
	 * what if the tooltip wants to report age as a percentile? it will need access
	 * not only to the age a specific datapoint, but also the ages of all the other
	 * datapoints.
	 *
	 * the purpose of the Field class is to allow fields to be configured in a
	 * simple, intuitive manner, while allowing code and components that use
	 * fields and datasets to get what they need without requiring redundant and
	 * idiosyncratic configuration. (e.g., datatable currently requires a 'caption'
	 * property for facet names and a 'title' property for column headings, while
	 * scatterplot's legend wants a 'label' property and all three of these should
	 * contain the same string for certain fields.)
	 *
	 * the main accessor for a field will be available as field.accessor
	 * it will be generated from, in this order:
	 *		1) an _accessor object called 'value'
	 *		2) a function called 'value'
	 *		3) a string called propName (will become function:
	 *					d => d[propName]
	 *		4) a function called 'defaultValue'
	 *
	 *	all _accessors (except 'value', which will be made into field.accessor)
	 *	will be copied (with same name as _accessor prop) to methods of the main
	 *	field object when field.bindParams() is called
	 *	(unless accessor.runOnGenerate=true)
	 */
	class Field {
		constructor(name, opts = {}, allFields) {
			if (opts.DEBUG) debugger;
			if (typeof opts.accessor !== "undefined")
				throw new Error("accessor will be generated, do not define it. see instructions above");
			this.name = name;
			_.extend(this, opts);
			_.each(opts.getters, (func, name) => {
				// inline getters will get clobbered when merging. put them in a getters prop
				Object.defineProperty(this, name, {
					get: func,
					enumerable: true,
				});
			});

			/*
			(this.requiredOptions || []).forEach(opt => {
				if (!_.has(this, opt))
					throw new Error(`expected ${opt} in ${this.name} Field options`);
			});
			*/
			var defaultAccessors = {
				value: {
					func: dataAccessor(this, 'value', null, false, true) ||
						fieldAccessor(this, 'propName', null, false, true) && (d => d[this.propName]) ||
						this.defaultValue,
					posParams: ['d'],
					//posParams: ['d', 'i', 'j'], // should it be this for d3 ease of use?
				},
				labelFunc: {
					func: fieldAccessor(this, ['label', 'title', 'caption', 'name']),
				},
			};
			this._accessors = _.merge(defaultAccessors, this._accessors);
			this._accessors.value.accessorOrder = -1000;

			if (this.proxyFor) {
				delete this._accessors.value;
				if (this.separateBinding)
					throw new Error("not handling yet");
				Object.defineProperty(this, 'accessor', {
					get: function () {
						return this.proxyFor.accessor;
					}
				});
			}

			if (this.needsScale) {
				this.scale = this.scale || d3.scale.linear();
				// usually the domain is just the extent of that field in the data
				this._accessors.domain = this._accessors.domain || {
					func: (data) => {
						return d3.extent(data.map(this.accessor));
					},
					posParams: ['data']
				};
				if (!this._accessors.range) // not trying to figure out a default range
					throw new Error(`no range for prop ${name}`);
			}
			if (typeof this.tooltipOrder !== "undefined" || this.tooltip) {
				this._accessors.tooltip = this._accessors.tooltip || {
					func: (d) => {
						return {
							name: this.labelFunc(),
							value: this.accessor(d),
						};
					},
					posParams: ['d']
				};
			}
			this.possibleBindings = this.possibleBindings || allFields.availableDatapointBindings || [];
			this.possibleBindings.push('allFields', 'thisField');
			// possibleBindings stuff is really here to help programmers figure out
			// what params are available when they write accessor functions...but what
			// determines whether the accessor will fail is really whether the params
			// they require have actually been bound (with field.bindParams) before
			// the accessor is used

			// the whole thing is somewhat dangerous, maybe wrong-headed? because
			// what if two components bind and call the same accessor, but one of
			// them manages to bind in between when the other bound and when it called:
			// the other would make the accessor call with unexpected bindings.

			// the point of all this is to allow separation of concerns: an axis
			// scale range depends on chart size, whereas an axis scale domain depends
			// on data. these are available at different times and places and when
			// one changes, the other shouldn't have to worry about it.

			_.each(this._accessors, (acc, name) => {
				/*
				if (_.difference(acc.posParams, this.possibleBindings).length ||
						_.difference(acc.namedParams, this.possibleBindings).length)
					throw new Error(`${this.name} accessor requested an unavailable binding`);
				*/
				acc.name = name;
				acc.accGen = new AccessorGenerator(acc);
				acc.accGen.runOnGenerate = acc.runOnGenerate;
			});

			this.allFields = allFields;
		}
		get accessors() {
			if (!this.__accessors) {
				console.warn(`using accessors for ${this.name} before explicitly binding parameters. Trying to bind now.`);
				// probably not such a good idea :
				// this.bindParams({allFields: this.allFields}); // at least allFields should be available
			}
			return this.__accessors;
		}
		bindParams(params, throwGenerateError = true) {
			// make allFields and thisField always available
			params = _.extend({}, params, {
				allFields: this.allFields,
				thisField: this
			});
			this.__accessors = {};
			_.each(_.sortBy(this._accessors, 'accessorOrder'), acc => {
				if (acc.name === 'scale') {
					throw new Error("don't name an accessor 'scale'");
				}
				acc.accGen.bindParams(params);
				try {
					acc.accessor = acc.accGen.generate();
					this.__accessors[acc.name] = acc.accessor;
					if (!acc.runOnGenerate && acc.name !== 'value')
						this[acc.name] = acc.accessor;
					if (acc.name === 'value')
						this.accessor = acc.accessor;
				} catch (e) {
					if (throwGenerateError) {
						throw new Error("something went wrong binding/generating", this.name, acc, e);
					}
				}
			});
			try {
				if (this.needsScale) {
					this.scale.domain(this.accessors.domain());
					this.scale.range(this.accessors.range());
				}
			} catch (e) {
				throw new Error("something went wrong setting scale", this.name, e);
			}
		}
	}

	/*	@class AccessorGenerator
	 *	@param {string} [propName] key of property to extract
	 *	@param {function} [func] to be called with record obj to return value
	 *	@param {string} [thisArg] object to set as *this* for func
	 *	@param {string[]} [posParams] list of positioned parameters of func
	 *																(except first param, which is assumed to be
	 *																 the record object)
	 *	@param {string[]} [namedParams] list of named parameters of func
	 *	@param {object} [bindValues] values to bind to parameters (this can also
	 *																	be done later)
	 */
	class AccessorGenerator {
		constructor({
			propName,
			func,
			posParams,
			namedParams,
			thisArg,
			bindValues
		} = {}) {
			if (typeof func === "function") {
				this.plainAccessor = func;
			} else if (typeof propName === "string") {
				this.plainAccessor = d => d[propName];
			} else {
				throw new Error("must specify func function or propName string");
			}
			this.posParams = posParams || [];
			this.namedParams = namedParams || [];
			this.boundParams = bindValues || {};
			this.thisArg = thisArg || null;
		}
		/* @method generate
		 */
		generate() {
			var pos = this.posParams.map(
				p => _.has(this.boundParams, p) ? this.boundParams[p] : _);
			var named = _.pick(this.boundParams, this.namedParams);
			var allArgs = _.isEmpty(named) ? [this.plainAccessor, this.thisArg].concat(pos) : [this.plainAccessor, this.thisArg].concat(pos, named);
			var boundFunc = _.bind.apply(_, allArgs);
			// first arg of apply, _, is context for _.bind (https://lodash.com/docs#bind)
			// then bind gets passed: accessor func, thisArg, posParams,
			// and (as final arg) namedParams if any are specified.
			// any additional args you want to pass when calling the accessor
			// must come after all posParams and the named args object if there is one
			if (this.runOnGenerate)
				boundFunc();
			return boundFunc;
		}
		/* @method bindParam
		 * @param {string} paramName
		 * @param {string} paramValue
		 */
		bindParam(paramName, paramValue) {
			this.boundParams[paramName] = paramValue;
		}
		bindParams(params) {
			_.each(params, (val, name) => this.bindParam(name, val));
		}
	}

	/*
	class ProxyField { // good idea but hard to implement
		constructor(name, opts = {}, proxyFor, allFields) {
			this.parentField = new Field(name, opts, allFields);
			this.baseField = proxyFor;
		}
	}
	*/

	/*
	 * for value or tooltip functions that make use of aggregation over data or series
	 * there should be a way to perform the aggregation calculations only once
	 * rather than on every call to the value/tooltip func (actually, for tooltips
	 * it doesn't matter too much since only one point gets processed at a time)
	 */
	function tooltipBuilderForFields(fields) {
		var accessors = _.chain(fields)
			.filter(field => field.accessors.tooltip)
			.sortBy('tooltipOrder')
			.map((field) => field.accessors.tooltip)
			.value();
		return (d, i, j) => {
			return (accessors
				.map(func => func(d, i, j))
				.map(o => `${o.name}: ${o.value}<br/>`)
				.join(''))
		};
	}

	function fishForProp(field, propNames) {
		propNames = Array.isArray(propNames) ? propNames : [propNames];
		// get first propName that appears in the field
		var propName = _.find(propNames, propName => _.has(field, propName));
		return field[propName];
	}

	function firstMatchingProp(obj, props) {
		var props = Array.isArray(props) ? props : [props];
		return _.find(props, prop => _.has(obj, prop));
	}

	function fieldAccessor(field, propNames, defaultVal, allowFuncs = true, noError = false) {
		var propName = firstMatchingProp(field, propNames);
		if (typeof propName === "undefined") {
			if (noError) return defaultVal;
			throw new Error("can't find what you want");
		}
		var propVal = field[propName];
		if (allowFuncs && typeof propVal === "function") {
			return propVal;
		}
		return () => propVal;
	}

	function dataAccessor(field, propNames, defaultFunc, allowNonFuncs = true, noError = false) {
		var propName = firstMatchingProp(field, propNames) || defaultFunc;
		if (typeof propName === "undefined") {
			if (defaultFunc) return defaultFunc;
			if (noError) return;
			throw new Error("can't find what you want");
		}
		var propVal = field[propName];
		if (typeof propVal === "function") {
			return propVal;
		}
		if (allowNonFuncs && (typeof propVal === "string" || isFinite(propVal))) {
			return d => d[propVal];
		}
		if (defaultFunc) return defaultFunc;
		if (noError) return;
		throw new Error("can't find what you want");
	}

	// these functions associate state with a compressed stringified object in the querystring
	function getState(path) {
		var state = _getState();
		// if path is empty, return whole state
		if (typeof path === "undefined" || path === null || !path.length)
			return state;
		// otherwise use lodash _.get to extract path from state object
		return _.get(state, path);
	}

	function hasState(path) {
		var state = _getState();
		return _.has(state, path);
	}

	function deleteState(path) {
		var state = _getState();
		_.unset(state, path);
		_setState(state);
		//stateChangeTrigger(path, null, 'delete', state);
	}

	function setState(path, val) {
		if (typeof val === "undefined") {
			// if only one arg, then it's the val, not the path; set whole state to that
			val = path;
			_setState(val);
			return;
		}
		var state = _getState();
		_.setWith(state, path, val, Object);
		_setState(state);
		//stateChangeTrigger(path, val, 'set', state);
	}

	function _setState(state) {
		var stateStr = JSON.stringify(state);
		var compressed = LZString.compressToBase64(stateStr);
		var hash = location.hash.startsWith('#') ? location.hash : '#';
		var h = hash.replace(/\?.*/, '');
		location.hash = h + '?' + compressed;
	}

	function _getState(hash = location.hash) {
		//console.log(hash === location.hash, hash);
		if (!hash.length)
			return {};

		var [hashpath, querystring] = hash.substr(1).split(/\?/);
		var state = {};
		// state.hashpath = hashpath; // do we want this for anything?
		// do we want a way to put stuff in the state that's not in the url?
		if (querystring && querystring.length) {
			try {
				var compressedStateStr = querystring;
				var stateStr = LZString.decompressFromBase64(compressedStateStr);
				//console.log(stateStr, hash);
				var s = stateStr ? JSON.parse(stateStr) : {};
				_.extend(state, s);
			} catch (e) {
				console.error("can't parse querystring", e);
			}
		}
		return state;
	}

	var stateEventSpace = {};

	function onStateChange(path, listener, data) {
		var evtName = JSON.stringify(path);
		$(stateEventSpace).on(evtName, data, listener);
	}

	function stateChangeTrigger(path, val, change, state) {
		// might want access to old state or old val, but not doing that right now
		var evtName = JSON.stringify(path);
		$(stateEventSpace).trigger(evtName, [{
			path,
			val,
			change,
			state
		}]);
	}

	// catch state changes from back button (probably better ways to do this)

	// from https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onhashchange:
	//let this snippet run before your hashchange event binding code
	if (!window.HashChangeEvent)(function () {
		var lastURL = document.URL;
		window.addEventListener("hashchange", function (event) {
			Object.defineProperty(event, "oldURL", {
				enumerable: true,
				configurable: true,
				value: lastURL
			});
			Object.defineProperty(event, "newURL", {
				enumerable: true,
				configurable: true,
				value: document.URL
			});
			lastURL = document.URL;
		});
	}());

	window.addEventListener('hashchange', function (evt) {
		var changedPaths = getChangedPaths(
			evt.oldURL.replace(/[^#]*#/, '#'),
			evt.newURL.replace(/[^#]*#/, '#'));
		changedPaths.forEach(c => stateChangeTrigger(c.path, c.val, c.change, c.state));
	}, false);

	function getChangedPaths(oldhash, newhash) {
		var oldstate = _getState(oldhash);
		var newstate = _getState(newhash);
		var oldpaths = listpaths(oldstate).map(d => d.join('.'));
		var newpaths = listpaths(newstate).map(d => d.join('.'));
		//console.log(oldpaths, newpaths);
		var changes = {};
		_.difference(oldpaths, newpaths).forEach(function (oldpath) {
			changes[oldpath] = {
				path: oldpath,
				val: _.get(newstate, oldpath),
				change: 'delete',
				state: newstate,
			};
		});
		_.difference(newpaths, oldpaths).forEach(function (newpath) {
			var c = changes[newpath] = changes[newpath] || {};
			c.path = newpath;
			c.val = c.val || _.get(newstate, newpath);
			c.change = 'add';
			c.state;
			c.state || newstate;
		});
		_.intersection(newpaths, oldpaths).forEach(function (sharedpath) {
			if (!_.eq(_.get(oldstate, sharedpath), _.get(newstate, sharedpath))) {
				changes[sharedpath] = {
					path: sharedpath,
					val: _.get(newstate, sharedpath),
					change: 'change',
					state: newstate,
				};
			}
		});
		return _.values(changes);
	}

	function listpaths(obj, par = []) {
		return _.reduce(obj,
			function (paths, node, key, col) {
				var thispath = par.concat(key);
				//console.log(`looking at ${key} from ${par}: ${thispath}`);
				paths.push(thispath);
				return _.isObject(node) ?
					paths.concat(listpaths(node, thispath)) :
					paths;
			}, []);
	}

	//var ajaxCache = {}; // only save till reload
	//var ajaxCache = localStorage; // save indefinitely
	var ajaxCache = sessionStorage; // save for session
	function cachedAjax(opts) {
		var allowed = _.find(ALLOW_CACHING, url => opts.url.match(url));
		if (allowed) {
			console.log(`using cache for ${opts.url}. remove ${allowed} from assets/ohdsi.util.ALLOW_CACHING to disable caching for it`);
		} else {
			// console.log(`not caching ${opts.url}. add to assets/ohdsi.util.ALLOW_CACHING to enable caching for it`);
			return $.ajax(opts);
		}
		var key = JSON.stringify(opts);
		if (!storageExists(key, ajaxCache)) {
			var ajax = $.ajax(opts);
			ajax.then(function (results) {
				storagePut(key, results, ajaxCache);
			});
			return ajax;
		} else {
			var results = storageGet(key, ajaxCache);
			var deferred = $.Deferred();
			if (opts.success) {
				opts.success(results);
			}
			deferred.resolve(results);
			return deferred;
		}
	}

	function storagePut(key, val, store = sessionStorage) {
		store[key] = LZString.compressToBase64(JSON.stringify(val));
	}

	function storageExists(key, store = sessionStorage) {
		return _.has(store, key);
	}

	function storageGet(key, store = sessionStorage) {
		return JSON.parse(LZString.decompressFromBase64(store[key]));
	}
	class SharedCrossfilter {
		constructor(recs) {
			this.recs = recs;
			this.cf = crossfilter(this.recs);
			this.dimFields = {};
			this.groupAll = this.cf.groupAll();
			this.groupAll.reduce(...reduceToRecs);
			/*
					this.dimFields :
						{
							fieldName1: {
								field: { // this is what gets passed in
									name: fieldName1,
									accessor: function(d) { ... },
								},
								cfDim: < result of: this.cf.dimension(field.accessor) >,
								groupings: {}, // allow multiple (named) groupings
							},
							...
						}
			 */
		}
		filteredRecs() {
			return this.groupAll.value();
		}
		replaceData(recs) {
			this.recs = recs;
			//console.log("replacing crossfilter data. you want to do this?");
			var dummy = this.cf.dimension(d => d);
			dummy.filter(() => false);
			this.cf.remove();
			dummy.dispose();
			this.cf.add(recs);
			$(this).trigger('newData', [{
				scf: this
			}]);
		}
		dimField(name, field, replace) {
			// fields can be Field objects
			// at minimum they need 'name' and 'accessor' properties
			if (typeof field === "undefined") {
				return this.dimFields[name] && this.dimFields[name].field;
			}
			if (_.has(this.dimFields, name)) {
				var dimField = this.dimFields[name];
				if (dimField.field === field)
					return dimField.field;
				if (typeof replace === "undefined") {
					throw new Error("trying to clobber dimension without replace=true");
				}
				if (!replace) {
					console.warn(`keeping old dimField ${name}`);
					return dimField.field;
				}
			}
			this.dimFields[name] = {
				field,
				cfDim: this.cf.dimension(field.accessor),
				groupings: {},
			};
			return this.dimFields[name].field;
		}
		filter(name, func, triggerData = {}) {
			if (!_.has(this.dimFields, name))
				throw new Error(`no dimField ${name}`);

			var dimField = this.dimFields[name];
			if (typeof func === "undefined") {
				return dimField.filter;
			}
			dimField.filter = func; // send null func to remove filter
			dimField.cfDim.filter(func);
			// what if setting filter redundantly? still trigger filter change?
			triggerData.dimField = dimField;

			$(this).trigger('filterEvt', [triggerData]);
		}
		grouping(dimName, groupingName, func, reduceFuncs = reduceToRecs) {
			if (!_.has(this.dimFields, name))
				throw new Error(`no dimField ${name}`);

			var dimField = this.dimFields[name];
			if (typeof func === "undefined") {
				return dimField.groupings[groupingName];
			}
			var grouping = dimField.groupings[groupingName] = {
				name: groupingName,
				func,
				cfDimGroup: dimField.cfDim.group(func),
			};
			// default to reduceToRecs instead of normal crossfilter behavior that
			//		reduces to counts
			grouping.cfDimGroup.reduce(...reduceToRecs);
			return grouping;
		}
		group(dimName, groupingName = 'default') {
			if (!_.has(this.dimFields, dimName))
				throw new Error(`no dimField ${dimName}`);

			var dimField = this.dimFields[dimName];

			if (groupingName === 'default' && !dimField.groupings.default) {
				dimField.groupings.default = {
					name: 'default',
					cfDimGroup: dimField.cfDim.group(),
				};
				dimField.groupings.default.cfDimGroup.reduce(...reduceToRecs);
			}

			return dimField.groupings[groupingName].cfDimGroup;
		}
		dimRecs(dimName, groupingName = 'default') {
			// return all the records filtered by all dims except this one
			if (!_.has(this.dimFields, dimName))
				throw new Error(`no dimField ${dimName}`);

			var dimField = this.dimFields[dimName];
			return dimField.cfDim.groupAll().reduce(...reduceToRecs).value();

		}
	}
	var reduceToRecs = [(p, v, nf) => p.concat(v), (p, v, nf) => _.without(p, v), () => []];

	// END module functions

	utilModule.dirtyFlag = dirtyFlag;
	utilModule.d3AddIfNeeded = d3AddIfNeeded;
	utilModule.elementConvert = elementConvert;
	utilModule.D3Element = D3Element;
	utilModule.shapePath = shapePath;
	utilModule.ResizableSvgContainer = ResizableSvgContainer;
	utilModule.SvgLayout = SvgLayout;
	utilModule.SvgElement = SvgElement;
	utilModule.ChartChart = ChartChart;
	utilModule.ChartLabel = ChartLabel;
	utilModule.ChartLabelLeft = ChartLabelLeft;
	utilModule.ChartLabelBottom = ChartLabelBottom;
	utilModule.ChartAxis = ChartAxis;
	utilModule.ChartAxisY = ChartAxisY;
	utilModule.ChartAxisX = ChartAxisX;
	utilModule.ChartInset = ChartInset;
	//utilModule.ChartProps = ChartProps;
	utilModule.AccessorGenerator = AccessorGenerator;
	utilModule.getState = getState;
	utilModule.setState = setState;
	utilModule.deleteState = deleteState;
	utilModule.hasState = hasState;
	utilModule.onStateChange = onStateChange;
	utilModule.Field = Field;
	utilModule.tooltipBuilderForFields = tooltipBuilderForFields;
	utilModule.cachedAjax = cachedAjax;
	utilModule.storagePut = storagePut;
	utilModule.storageExists = storageExists;
	utilModule.storageGet = storageGet;
	utilModule.SharedCrossfilter = SharedCrossfilter;

	if (DEBUG) {
		window.util = utilModule;
	}
	return utilModule;

});