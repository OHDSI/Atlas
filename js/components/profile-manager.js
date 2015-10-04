define(['knockout', 'text!./profile-manager.html', 'd3', 'd3_tip', 'knockout.dataTables.binding'], function (ko, view, d3) {
	function profileManager(params) {
		var self = this;
		self.services = params.services;
		self.reference = ko.observableArray([]);
		self.cohortDefinitionId = ko.observable();
		self.loading = ko.observable(false);
		self.loadingCohort = ko.observable(false);
		self.loadingProfile = ko.observable(false);
		self.sourceKey = ko.observable();
		self.members = ko.observableArray();
		self.personId = ko.observable();
		self.currentMemberIndex = 0;

		self.hasCDM = function (source) {
			return source.hasCDM;
		}

		self.navigatePrevious = function () {
			if (self.currentMemberIndex > 0) {
				self.currentMemberIndex--;
				self.personId(self.members()[self.currentMemberIndex]);
			} else {
				self.currentMemberIndex = self.members().length - 1;
				self.personId(self.members()[self.currentMemberIndex]);
			}
		}

		self.navigateNext = function () {
			if (self.currentMemberIndex < self.members().length - 1) {
				self.currentMemberIndex++;
				self.personId(self.members()[self.currentMemberIndex]);
			} else {
				self.currentMemberIindex = 0;
				self.personId(self.members()[self.currentMemberIndex]);
			}
		}

		self.personId.subscribe(function (value) {
			self.loadProfile(value);
		});

		self.cohortDefinitionSelected = function (cohortDefinitionId) {
			self.cohortDefinitionId(cohortDefinitionId);
			$('#cohortDefinitionChooser').modal('hide');

			$.ajax({
				url: self.services()[0].url + 'cohortdefinition/' + self.cohortDefinitionId(),
				method: 'GET',
				contentType: 'application/json',
				success: function (definition) {
					self.cohortDefinitionButtonText(definition.name);
				}
			});

			if (self.cohortDefinitionId() && self.sourceKey()) {
				self.loadCohort();
			}
		}

		self.sourceKey.subscribe(function () {
			if (self.cohortDefinitionId() && self.sourceKey()) {
				self.loadCohort();
			}
		});

		self.loadCohort = function () {
			$.ajax({
				url: self.services()[0].url + self.sourceKey() + '/cohortresults/' + self.cohortDefinitionId() + '/members',
				method: 'GET',
				contentType: 'application/json',
				success: function (members) {
					self.members(members);
					// default to first person in the cohort
					self.currentMemberIndex = 0;
					self.personId(members[self.currentMemberIndex]);
				}
			});
		};

		self.loadProfile = function (personId) {
			self.loadingProfile(true);

			$.ajax({
				url: self.services()[0].url + self.sourceKey() + '/person/' + personId,
				method: 'GET',
				contentType: 'application/json',
				success: function (profile) {
					self.loadingProfile(false);
					self.reference(profile.records);
					// self.plotTimewave(profile.timewave, profile.startDate, profile.endDate);
					self.plotScatter(profile.records, profile.startDate, profile.endDate);
				}
			});
		};

		self.showBrowser = function () {
			$('#cohortDefinitionChooser').modal('show');
		};

		self.cohortDefinitionButtonText = ko.observable('Select a Cohort');

		self.options = {
			Facets: [
				{
					'caption': 'Type',
					'binding': function (o) {
						return o.recordType;
					}
				},
				{
					'caption': 'Year Start',
					'binding': function (o) {
						return new Date(o.startDate).getFullYear();
					}
				}
			]
		};

		self.columns = [
			{
				title: 'Type',
				data: 'recordType'
			},
			{
				title: 'Concept Id',
				data: 'conceptId'
			},
			{
				title: 'Concept Name',
				data: 'conceptName'
			},
			{
				title: 'Start Date',
				render: function (s, p, d) {
					return new Date(d.startDate).toLocaleDateString();
				}
			},
			{
				title: 'End Date',
				render: function (s, p, d) {
					return new Date(d.endDate).toLocaleDateString();
				}
			}
		];

		self.plotAxis = function (target) {
			/*
			var axis = target
				.append("div")
				.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", margin.top + margin.bottom)
				.append("g")
				.attr("class", "axis")
				.attr("transform", "translate(" + padding.left + ",0)")
				.call(xAxis);
			*/
		}

		self.parseDate = function (value) {
			var re = /-?\d+/;
			var m = re.exec(value);
			return new Date(parseInt(m[0]));

		}

		self.plotScatter = function (records, startDate, endDate) {
			var margin = {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				},
				width = 800,
				height = 100;

			var padding = {
				top: 0,
				left: 0
			};

			var focusTip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(function (d) {
					return d.conceptName;
				});

			var xScale = d3.scale.linear()
				.domain([startDate, endDate])
				.range([0, width]);
			$('#scatter').empty();

			var vertical = function (d) {
				switch (d.recordType) {
				case 'drug':
					return .5;
					break;
				case 'condition':
					return 1.5;
					break;
				case 'observation':
					return 2.5;
					break;
				default:
					return 3.5;
					break;
				};
			};

			var container = d3.select("#scatter")
				.append("div")
				.attr("class", "scatter");

			var div = container
				.append("div");

			var svg = div.append("svg")
				.attr("width", width)
				.attr("height", height);
			
			var overlay = svg.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", width)
				.attr("height", height)
				.attr("class", "overlay")
				.call(focus_brush);

			var yScale = d3.scale.linear()
				.domain([0, 4])
				.range([0, height]);

			svg.call(focusTip);

			svg.selectAll("rect")
				.data(records)
				.enter()
				.append("rect")
				.attr('x', function (d) {
					return xScale(d.startDate);
				})
				.attr('y', function (d) {
					return yScale(vertical(d));
				})
				.attr('width', 3)
				.attr('height', 3)
				.attr('class', function (d) {
					return d.recordType;
				})
				.on('mouseover', function (d) {
					focusTip.show(d);
				})
				.on('mouseout', function (d) {
					focusTip.hide(d);
				});
		}

		self.plotTimewave = function (tw, startDate, endDate) {
			var margin = {
					top: 10,
					right: 10,
					bottom: 10,
					left: 10
				},
				width = 800,
				height = 200;

			var padding = {
				top: 10,
				left: 0
			};

			var xScale = d3.scale.linear()
				.domain([startDate, endDate])
				.range([0, width]);
			$('#timewave').empty();

			var timewave_container = d3.select("#timewave")
				.append("div")
				.attr("class", "timewave");

			var div = timewave_container
				.append("div");

			var svg = div.append("svg")
				.attr("width", width)
				.attr("height", height);

			var yScale = d3.scale.linear()
				.domain([0, tw.maxEvents])
				.range([0, height / 2]);

			var yAxis = new d3.svg.axis()
				.scale(yScale)
				.orient("left")
				.tickSize(-width, 0)
				.ticks(5);

			bucketgroup = svg.append("g")
				.attr("class", "bucket-group")
				.attr("transform", "translate(" + padding.left + "," + padding.top + ")");

			bucketgroup.append("line")
				.attr("x1", 0)
				.attr("x2", width)
				.attr("y1", height / 2)
				.attr("y2", height / 2)
				.attr("class", "timewave-line");

			for (b = 0; b < tw.buckets.length; b++) {
				event_counter = 0;
				bucket = tw.buckets[b];
				event_x = xScale(bucket.timeIndex);
				condition_height = 0;
				drug_height = 0;
				observation_height = 0;

				if (bucket.conditions > 0) {
					condition_height = yScale(bucket.conditions);
					bucketgroup.append("line")
						.attr("x1", event_x)
						.attr("y1", height / 2)
						.attr("x2", event_x)
						.attr("y2", (height / 2) - condition_height)
						.attr("class", "timewave-condition");

					bucketgroup.append("line")
						.attr("x1", event_x)
						.attr("y1", height / 2)
						.attr("x2", event_x)
						.attr("y2", (height / 2) + condition_height)
						.attr("class", "timewave-condition");
				}

				if (bucket.drugs > 0) {
					drug_height = yScale(bucket.drugs);
					bucketgroup.append("line")
						.attr("x1", event_x)
						.attr("y1", (height / 2) - condition_height)
						.attr("x2", event_x)
						.attr("y2", (height / 2) - condition_height - drug_height)
						.attr("class", "timewave-drug");

					bucketgroup.append("line")
						.attr("x1", event_x)
						.attr("y1", (height / 2) + condition_height)
						.attr("x2", event_x)
						.attr("y2", (height / 2) + condition_height + drug_height)
						.attr("class", "timewave-drug");
				}

				if (bucket.observations > 0) {
					observation_height = yScale(bucket.observations);
					bucketgroup.append("line")
						.attr("x1", event_x)
						.attr("y1", (height / 2) - condition_height - drug_height)
						.attr("x2", event_x)
						.attr("y2", (height / 2) - condition_height - drug_height - observation_height)
						.attr("class", "timewave-observation");

					bucketgroup.append("line")
						.attr("x1", event_x)
						.attr("y1", (height / 2) + condition_height + drug_height)
						.attr("x2", event_x)
						.attr("y2", (height / 2) + condition_height + drug_height + observation_height)
						.attr("class", "timewave-observation");
				}
			}

			/*
			overlay = bucketgroup.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", width)
				.attr("height", height)
				.attr("class", "overlay")
				.call(focus_brush);

			focus = bucketgroup.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", 0)
				.attr("height", height)
				.attr("class", "focus");
			*/

			self.plotAxis(timewave_container);
		}

	}

	var component = {
		viewModel: profileManager,
		template: view
	};

	ko.components.register('profile-manager', component);
	return component;
});