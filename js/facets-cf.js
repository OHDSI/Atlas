
"use strict";
define ([], function() {
Array.prototype.getUnique = function () {
	var u = {},
		a = [];
	for (var i = 0, l = this.length; i < l; ++i) {
		if (u.hasOwnProperty(this[i])) {
			continue;
		}
		a.push(this[i]);
		u[this[i]] = 1;
	}
	return a;
}

Array.prototype.sortBy = function (f) {
	for (var i = this.length; i;) {
		var o = this[--i];
		this[i] = [].concat(f.call(o, o, i), o);
	}
	this.sort(function (a, b) {
		for (var i = 0, len = a.length; i < len; ++i) {
			if (a[i] != b[i]) return a[i] < b[i] ? -1 : 1;
		}
		return 0;
	});
	for (var i = this.length; i;) {
		this[--i] = this[i][this[i].length - 1];
	}
	return this;
}

function FacetEngine(crossfilter, facets) {
	this.cf = crossfilter;
	this.facets = facets;
	this.facets.forEach(facet => {
		facet.dimension = this.cf.dimension(facet.func);
	});

	this.MemberSortFunction = function () {
		return this.Name
	};
	// initialize Facet Members
	for (var f = 0; f < this.facets.length; f++) {
		this.facets[f].Members = [];
		this.facets[f].FilteredIndices = [];
	}

	this.Objects = [];
	this.FilteredObjects = [];
	this.FilteredIndices = [];

	this.AddMember = function (name, facet_index) {
		var member_index = -1;

		for (var fm = 0; fm < this.facets[facet_index].Members.length; fm++) {
			if (this.facets[facet_index].Members[fm].Name == name) {
				member_index = fm;
				break;
			}
		}

		if (member_index < 0) {
			var member = {
				'Name': name,
				'Indices': [],
				'FilteredCount': 0,
				'ActiveCount': 0,
				'Selected': false
			};
			member_index = this.facets[facet_index].Members.length;
			this.facets[facet_index].Members.push(member);
		}

		return member_index;
	}

	this.Process = function (object) {
		var object_index = this.Objects.push(object) - 1;

		for (var facet_index = 0; facet_index < this.facets.length; facet_index++) {
			var membership = this.facets[facet_index].func(object);

			if (Array.isArray(membership)) {
				for (var i = 0; i < membership.length; i++) {
					var member_index = this.AddMember(membership[i], facet_index);
					this.facets[facet_index].Members[member_index].Indices.push(object_index);
					this.facets[facet_index].Members[member_index].ActiveCount++;
				}
			} else {
				var member_index = this.AddMember(membership, facet_index);
				this.facets[facet_index].Members[member_index].Indices.push(object_index);
				this.facets[facet_index].Members[member_index].ActiveCount++;
			}
		}
	}

	this.sortFacetMembers = function (sort_function) {
		for (f = 0; f < this.facets.length; f++) {
			this.facets[f].Members.sortBy(this.MemberSortFunction);
			this.facets[f].Members.reverse();
		}
	}

	this.GetCurrentFilter = function () {
		var filters = [];
		this.facets.forEach(function (f, i) {
			f.Members.forEach(function (m, j) {
				if (m.Selected) {
					filters.push(i + "-" + j);
				}
			});
		});

		return filters;
	}

	this.GetMaxMemberLength = function (facet_index) {
		facet = this.facets[facet_index];
		max_member_length = -1;

		for (m = 0; m < facet.Members.length; m++) {
			max_member_length = Math.max(facet.Members[m].Indices.length, max_member_length);
		}

		return max_member_length;
	}

	this.CurrentFilter = [];

	this.SetFilter = function (filters) {
		debugger;
		this.FilteredIndices = [];
		this.FilteredObjects = [];

		this.CurrentFilter = paths;

		// unselect all
		for (f = 0; f < this.facets.length; f++) {
			// initialize facet level filtered indices
			this.facets[f].FilteredIndices = [];

			for (var m = 0; m < this.facets[f].Members.length; m++) {
				this.facets[f].Members[m].Selected = false;
			}
		}

		// marks members as selected
		for (var p = 0; p < paths.length; p++) {
			var path_data = paths[p].split('-');

			var facet_member = this.facets[path_data[0]].Members[path_data[1]];
			facet_member.Selected = true;
			for (var i = 0; i < facet_member.Indices.length; i++) {
				this.facets[path_data[0]].FilteredIndices.push(facet_member.Indices[i]);
			}
		}

		// now facets have FilteredIndices and we need to intersect those arrays across facets
		var initial = [];
		var initial_facet = 0;

		var intersection = [];

		// find initial facet with filtered indices
		for (f = 0; f < this.facets.length; f++) {
			if (this.facets[f].FilteredIndices.length > 0) {
				initial = this.facets[f].FilteredIndices;
				initial_facet = f;
				break;
			}
		}

		// test each filtered index in initial set against all other facets
		for (var fi = 0; fi < initial.length; fi++) {
			var target = initial[fi];
			var target_test = true;
			for (var test_facet = initial_facet + 1; test_facet < this.facets.length; test_facet++) {

				// skip if there are no indices filtered in this facet (no paths, no selected members)
				if (this.facets[test_facet].FilteredIndices.length == 0)
					continue;

				if (this.facets[test_facet].FilteredIndices.indexOf(target) > -1) {
					continue;
				} else {
					target_test = false;
					break;
				}
			}
			if (target_test) {
				intersection.push(target);
			}
		}


		for (var i = 0; i < intersection.length; i++) {
			this.FilteredObjects.push(this.Objects[intersection[i]]);
			this.FilteredIndices.push(intersection[i]);
		}

		// establish filtered counts for each facet member
		for (var f = 0; f < this.facets.length; f++) {
			for (var mi = 0; mi < this.facets[f].Members.length; mi++) {
				this.facets[f].Members[mi].FilteredCount = 0;
				this.facets[f].Members[mi].ActiveCount = 0;

				for (var i = 0; i < this.facets[f].Members[mi].Indices.length; i++) {
					if (this.FilteredIndices.indexOf(this.facets[f].Members[mi].Indices[i]) > -1) {
						this.facets[f].Members[mi].FilteredCount++;
					}
				}

				this.facets[f].Members[mi].ActiveCount = this.HasActiveFilter() ? this.facets[f].Members[mi].FilteredCount : this.facets[f].Members[mi].Indices.length;
			}
		}

		this.sortFacetMembers();
	}

	this.GetCurrentObjectCount = function () {
		if (this.CurrentFilter.length > 0) {
			return this.FilteredObjects.length;
		} else {
			return this.Objects.length;
		}
	}

	this.HasActiveFilter = function () {
		return this.CurrentFilter.length > 0;
	}

	this.GetCurrentObjects = function () {
		if (this.CurrentFilter.length > 0) {
			return this.FilteredObjects;
		} else {
			return this.Objects;
		}
	}
}

return FacetEngine;

});

	
