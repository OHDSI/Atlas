define(['jquery', 'd3', 'd3_tip'], function ($, d3, d3tip) {
	var packingHierarchy = function () {

		var ph = this;

		var w = 500,
			h = 500,
			r = 500,
			x = d3.scale.linear().range([0, r]),
			y = d3.scale.linear().range([0, r]),
			node,
			root;

		var pack = d3.layout.pack()
			.size([r, r])
			.value(function (d) {
				return d.size;
			})

		var vis;

		this.render = function (target, data) {
			vis = d3.select(target).insert("svg:svg", "h2")
				.attr("width", w)
				.attr("height", h)
				.append("svg:g");

			node = root = data;

			ph.tip = d3tip().attr('class', 'd3-tip').html(function (d) {				
				if (d.conceptName == 'root') {
					return 'Concept Set Analysis';
				}
				else {
					var tooltip = '';
					
					tooltip += 'Id: ' + d.conceptId + '<br>' + 
						'Name: ' + d.conceptName + '<br>';
					
					var ref = d.parent;
					while (ref != undefined) {
						if (ref.conceptName == 'root') {
							ref = ref.parent;
							continue;
						}
						tooltip = 'Parent Id: ' + ref.conceptId + '<br>' + tooltip;
						tooltip = 'Parent Name: ' + ref.conceptName + '<br>' + tooltip;
						ref = ref.parent;
					}
					
					return tooltip; 
				}
			});

			vis.call(ph.tip);

			var nodes = pack.nodes(root);

			vis.selectAll("circle")
				.data(nodes)
				.enter()
				.append("g")
				.append("circle")
				.attr("class", function (d) {
					var role = d.children ? "parent" : "child";
					return role + ' node-' + d.conceptId;
				})
				.attr("cx", function (d) {
					return d.x;
				})
				.attr("cy", function (d) {
					return d.y;
				})
				.attr("r", function (d) {
					return d.r;
				})
				.on("click", function (d) {
					return ph.zoom(node == d ? root : d);
				})
				.on('mouseover', this.mouseover)
				.on('mouseout', this.mouseout);


			d3.select(target).on("click", function () {
				ph.zoom(root);
			});
		};

		this.mouseover = function(d) {
			ph.tip.show(d);
			
			if (d.conceptName == 'root') 
				return;
			
			var id = '.node-' + d.conceptId;
			$(id).attr('class', $(id).attr('class') + ' hovered');
		}

		this.mouseout = function(d) {
			ph.tip.hide(d);
			
			if (d.conceptName == 'root') 
				return;
			
			var id = '.node-' + d.conceptId;
			$(id).attr('class', $(id).attr('class').replace(' hovered',''));
		}

		this.zoom = function (d, i) {
			var k = r / d.r / 2;
			x.domain([d.x - d.r, d.x + d.r]);
			y.domain([d.y - d.r, d.y + d.r]);

			var t = vis.transition()
				.duration(d3.event.altKey ? 7500 : 750);

			t.selectAll("circle")
				.attr("cx", function (d) {
					return x(d.x);
				})
				.attr("cy", function (d) {
					return y(d.y);
				})
				.attr("r", function (d) {
					return k * d.r;
				});

			t.selectAll("text")
				.attr("x", function (d) {
					return x(d.x);
				})
				.attr("y", function (d) {
					return y(d.y);
				})
				.style("opacity", function (d) {
					return k * d.r > 20 ? 1 : 0;
				});

			node = d;
			d3.event.stopPropagation();
		}
	}
	return {
		packingHierarchy: packingHierarchy
	};
});