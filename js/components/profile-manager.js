// lines labeled "TEMPORARY HACK" are to get the profile to display
// while using the public api, which has some bug interfering with
// cohort loading
define(['knockout', 'text!./profile-manager.html', 'd3', 'appConfig', 'd3_tip', 'knockout.dataTables.binding', 'faceted-datatable','components/profileChart'], function (ko, view, d3, config) {
	function profileManager(params) {
    window.d3 = d3;
		var self = this;
    self.config = config;
		self.services = [params.services];
		self.reference = ko.observableArray([]);
		self.filteredData = ko.observableArray([]); // same as reference but with filters applied
                                                // by faceted-datatable
    self.loadedProfile = ko.observable();
		//self.cohortDefinitionId = ko.observable();
		self.cohortDefinitionId = ko.observable(params.model.currentCohortDefinition().id());
		self.loading = ko.observable(false);
		self.loadingCohort = ko.observable(false);
		self.loadingProfile = ko.observable(false);
		self.sourceKey = ko.observable(params.services.sources[0].sourceKey);
		//self.members = ko.observableArray([{personId:423, startDate:1203724800000, endDate:1293580800000}]); // TEMPORARY HACK
		self.members = ko.observableArray();
		self.personId = ko.observable();
		self.currentMemberIndex = 0;

		self.hasCDM = function (source) {
			return source.hasCDM;
		}

		self.navigatePrevious = function () {
			if (self.currentMemberIndex > 0) {
				self.currentMemberIndex--;
				//self.personId(self.members()[self.currentMemberIndex].personId);
				self.personId(self.members()[self.currentMemberIndex].subjectId);
			} else {
				self.currentMemberIndex = self.members().length - 1;
				//self.personId(self.members()[self.currentMemberIndex].personId);
				self.personId(self.members()[self.currentMemberIndex].subjectId);
			}
		}

		self.navigateNext = function () {
			if (self.currentMemberIndex < self.members().length - 1) {
				self.currentMemberIndex++;
				self.personId(self.members()[self.currentMemberIndex].subjectId);
			} else {
				self.currentMemberIindex = 0;
				self.personId(self.members()[self.currentMemberIndex].subjectId);
			}
		}

		self.personId.subscribe(function (value) {
			if (value) {
				self.loadProfile(value);
			}
		});

		self.cohortDefinitionSelected = function (cohortDefinitionId) {
			self.cohortDefinitionId(cohortDefinitionId);
			$('#cohortDefinitionChooser').modal('hide');

			$.ajax({
				url: self.services[0].url + 'cohortdefinition/' + self.cohortDefinitionId(),
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
				//url: self.services[0].url + self.sourceKey() + '/cohortresults/' + self.cohortDefinitionId() + '/members',
				url: self.services[0].url + 'cohort/' + self.cohortDefinitionId(),
				method: 'GET',
				contentType: 'application/json',
				success: function (members) {
					if (members.length == 0) {
						self.personId(null);
						self.loadingProfile(false);
						$('#modalNoMembers').modal('show');
						self.members([]);
					} else {
            members.forEach(function(m) {
              m.startDate = m.cohortStartDate;
              m.endDate = m.cohortEndDate;
            });
						self.members(members);
						// default to first person in the cohort
						self.currentMemberIndex = 0;
						//self.personId(members[self.currentMemberIndex].personId);
						self.personId(members[self.currentMemberIndex].subjectId);
					}
				}
			});
		};
    self.loadCohort();

		self.loadProfile = function (personId) {
			self.loadingProfile(true);

      //self.personId(423); // TEMPORARY HACK
			$.ajax({
				url: self.services[0].url + self.sourceKey() + '/person/' + personId,
        //url: "http://api.ohdsi.org/WebAPI/CS1/person/423", // TEMPORARY HACK
				method: 'GET',
				contentType: 'application/json',
				success: function (profile) {
					self.loadingProfile(false);
					self.reference(profile.records);
					self.filteredData(self.reference());
          self.loadedProfile(profile);
          console.log(profile);
					// self.plotTimewave(profile.timewave, profile.startDate, profile.endDate);
					//self.plotScatter(profile.records, profile.startDate, profile.endDate);
				}
			});
		};
    //self.loadProfile(0); // TEMPORARY HACK

		self.showBrowser = function () {
			$('#cohortDefinitionChooser').modal('show');
		};

		self.cohortDefinitionButtonText = ko.observable('Click Here to Select a Cohort');

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

		self.parseDate = function (value) {
			var re = /-?\d+/;
			var m = re.exec(value);
			return new Date(parseInt(m[0]));
		}

		self.plotScatter = function (records, startDate, endDate) {
			var margin = {
					top: 10,
					right: 10,
					bottom: 150,
					left: 10
				},
				margin2 = {
					top: 430,
					right: 10,
					bottom: 20,
					left: 10
				},
				width = 900 - margin.left - margin.right,
				height = 500 - margin.top - margin.bottom,
				height2 = 500 - margin2.top - margin2.bottom;

			var x = d3.time.scale().range([0, width]),
				x2 = d3.time.scale().range([0, width]),
				y = d3.scale.linear().range([height, 0]),
				y2 = d3.scale.linear().range([height2, 0]);

			var xAxis = d3.svg.axis().scale(x).orient("bottom"),
				xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
				yAxis = d3.svg.axis().scale(y).orient("left");

			var brushed = function () {
				x.domain(brush.empty() ? x2.domain() : brush.extent());
				focus.selectAll('rect')
					.attr('x', function (d) {
						return x(d.startDate) - 2.5;
					});
				var member = self.members()[self.currentMemberIndex];
				focus.selectAll("line")
					.attr('x1', function (d) {
						return x(d)
					})
					.attr('y1', 0)
					.attr('x2', function (d) {
						return x(d)
					})
					.attr('y2', height)
					.attr('class', 'observation-period');
				focus.select(".x.axis").call(xAxis);
			}

			var brush = d3.svg.brush()
				.x(x2)
				.on("brush", brushed);

			$('#scatter').empty();

			var svg = d3.select("#scatter").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);

			var focusTip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(function (d) {
					return d.conceptName;
				});

			svg.call(focusTip);

			var focus = svg.append("g")
				.attr("class", "focus")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			var context = svg.append("g")
				.attr("class", "context")
				.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

			x.domain([startDate, endDate]);
			y.domain([0, 5]);
			x2.domain(x.domain());
			y2.domain(y.domain());

			// plot observation window lines
			var member = self.members()[self.currentMemberIndex];
			focus.selectAll("line")
				.data([member.startDate, member.endDate])
				.enter()
				.append("line")
				.attr('x1', function (d) {
					return x(d)
				})
				.attr('y1', 0)
				.attr('x2', function (d) {
					return x(d)
				})
				.attr('y2', height)
				.attr('class', 'observation-period');

			// place your data into the focus area
			focus.selectAll("rect")
				.data(records)
				.enter()
				.append("rect")
				.attr('x', function (d) {
					return x(d.startDate) - 2.5;
				})
				.attr('y', function (d) {
					switch (d.recordType) {
					case 'drug':
						return y(4);
						break;
					case 'condition':
						return y(3);
						break;
					case 'observation':
						return y(2);
						break;
					case 'visit':
						return y(1);
						break;
					}
				})
				.attr('width', 5)
				.attr('height', 5)
				.attr('class', function (d) {
					return d.recordType;
				})
				.on('mouseover', function (d) {
					focusTip.show(d);
				})
				.on('mouseout', function (d) {
					focusTip.hide(d);
				});

			focus.append("text").text('Visits').attr('class', 'visit').attr('x', 0).attr('y', function (d) {
				return y(1.2);
			});
			focus.append("text").text('Observations').attr('class', 'observation').attr('x', 0).attr('y', function (d) {
				return y(2.2);
			});
			focus.append("text").text('Conditions').attr('class', 'condition').attr('x', 0).attr('y', function (d) {
				return y(3.2);
			});
			focus.append("text").text('Drugs').attr('class', 'drug').attr('x', 0).attr('y', function (d) {
				return y(4.2);
			});

			// and focus area
			context.selectAll("line")
				.data([member.startDate, member.endDate])
				.enter()
				.append("line")
				.attr('x1', function (d) {
					return x2(d)
				})
				.attr('y1', 0)
				.attr('x2', function (d) {
					return x2(d)
				})
				.attr('y2', height2)
				.attr('class', 'observation-period');

			context.selectAll("rect")
				.data(records)
				.enter()
				.append("rect")
				.attr('x', function (d) {
					return x2(d.startDate);
				})
				.attr('y', function (d) {
					switch (d.recordType) {
					case 'drug':
						return y2(4);
						break;
					case 'condition':
						return y2(3);
						break;
					case 'observation':
						return y2(2);
						break;
					case 'visit':
						return y2(1);
						break;
					}
				})
				.attr('width', 2)
				.attr('height', 2)
				.attr('class', function (d) {
					return d.recordType;
				});


			focus.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			context.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height2 + ")")
				.call(xAxis2);

			context.append("g")
				.attr("class", "x brush")
				.call(brush)
				.selectAll("rect")
				.attr("y", -6)
				.attr("height", height2 + 7);
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
