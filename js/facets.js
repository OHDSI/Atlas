// written and developed by frank j. defalco
// frank acknowledges Christopher A. Knoll
// AMD form by Christopher A Knoll

define ([], function() {
// http://stackoverflow.com/users/80720/rafael
// http://stackoverflow.com/questions/1960473/unique-values-in-an-array
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

function FacetEngine(params) {
	this.PageSize = 15;
	this.MemberSortFunction = function () {
		return this.Name
	};
	this.Facets = params.Facets;

	// initialize Facet Members
	for (f = 0; f < this.Facets.length; f++) {
		this.Facets[f].Members = [];
		this.Facets[f].FilteredIndices = [];
	}

	this.Objects = [];
	this.FilteredObjects = [];
	this.FilteredIndices = [];

	this.AddMember = function (name) {
		member_index = -1;

		for (fm = 0; fm < this.Facets[facet_index].Members.length; fm++) {
			if (this.Facets[facet_index].Members[fm].Name == name) {
				member_index = fm;
				break;
			}
		}

		if (member_index < 0) {
			member = {
				'Name': name,
				'Indices': [],
				'FilteredCount': 0,
				'ActiveCount': 0,
				'Selected': false
			};
			member_index = this.Facets[facet_index].Members.length;
			this.Facets[facet_index].Members.push(member);
		}

		return member_index;
	}

	this.Process = function (object) {
		object_index = this.Objects.push(object) - 1;

		for (facet_index = 0; facet_index < this.Facets.length; facet_index++) {
			membership = this.Facets[facet_index].binding(object);

			if (Array.isArray(membership)) {
				for (var i = 0; i < membership.length; i++) {
					member_index = this.AddMember(membership[i]);
					this.Facets[facet_index].Members[member_index].Indices.push(object_index);
					this.Facets[facet_index].Members[member_index].ActiveCount++;
				}
			} else {
				member_index = this.AddMember(membership);
				this.Facets[facet_index].Members[member_index].Indices.push(object_index);
				this.Facets[facet_index].Members[member_index].ActiveCount++;
			}
		}
	}

	this.sortFacetMembers = function (sort_function) {
		for (f = 0; f < this.Facets.length; f++) {
			this.Facets[f].Members.sortBy(this.MemberSortFunction);
			this.Facets[f].Members.reverse();
		}
	}

	this.GetCurrentFilter = function () {
		var filters = [];
		this.Facets.forEach(function (f, i) {
			f.Members.forEach(function (m, j) {
				if (m.Selected) {
					filters.push(i + "-" + j);
				}
			});
		});

		return filters;
	}

	this.GetMaxMemberLength = function (facet_index) {
		facet = this.Facets[facet_index];
		max_member_length = -1;

		for (m = 0; m < facet.Members.length; m++) {
			max_member_length = Math.max(facet.Members[m].Indices.length, max_member_length);
		}

		return max_member_length;
	}

	this.CurrentFilter = [];

	this.SetFilter = function (paths) {
		this.FilteredIndices = [];
		this.FilteredObjects = [];

		this.CurrentFilter = paths;

		// unselect all
		for (f = 0; f < this.Facets.length; f++) {
			// initialize facet level filtered indices
			this.Facets[f].FilteredIndices = [];

			for (m = 0; m < this.Facets[f].Members.length; m++) {
				this.Facets[f].Members[m].Selected = false;
			}
		}

		// marks members as selected
		for (p = 0; p < paths.length; p++) {
			path_data = paths[p].split('-');

			facet_member = this.Facets[path_data[0]].Members[path_data[1]];
			facet_member.Selected = true;
			for (var i = 0; i < facet_member.Indices.length; i++) {
				this.Facets[path_data[0]].FilteredIndices.push(facet_member.Indices[i]);
			}
		}

		// now facets have FilteredIndices and we need to intersect those arrays across facets
		initial = [];
		initial_facet = 0;

		intersection = [];

		// find initial facet with filtered indices
		for (f = 0; f < this.Facets.length; f++) {
			if (this.Facets[f].FilteredIndices.length > 0) {
				initial = this.Facets[f].FilteredIndices;
				initial_facet = f;
				break;
			}
		}

		// test each filtered index in initial set against all other facets
		for (fi = 0; fi < initial.length; fi++) {
			target = initial[fi];
			target_test = true;
			for (test_facet = initial_facet + 1; test_facet < this.Facets.length; test_facet++) {

				// skip if there are no indices filtered in this facet (no paths, no selected members)
				if (this.Facets[test_facet].FilteredIndices.length == 0)
					continue;

				if (this.Facets[test_facet].FilteredIndices.indexOf(target) > -1) {
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
		for (f = 0; f < this.Facets.length; f++) {
			for (mi = 0; mi < this.Facets[f].Members.length; mi++) {
				this.Facets[f].Members[mi].FilteredCount = 0;
				this.Facets[f].Members[mi].ActiveCount = 0;

				for (var i = 0; i < this.Facets[f].Members[mi].Indices.length; i++) {
					if (this.FilteredIndices.indexOf(this.Facets[f].Members[mi].Indices[i]) > -1) {
						this.Facets[f].Members[mi].FilteredCount++;
					}
				}

				this.Facets[f].Members[mi].ActiveCount = this.HasActiveFilter() ? this.Facets[f].Members[mi].FilteredCount : this.Facets[f].Members[mi].Indices.length;
			}
		}

		this.sortFacetMembers();
	}

	this.GetPage = function (page_number) {
		start = page_number * this.PageSize;
		end = start + this.PageSize;

		if (this.CurrentFilter.length > 0) {
			return this.FilteredObjects.slice(start, end);
		} else {
			return this.Objects.slice(start, end);
		}
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

	this.GetPageCount = function () {
		if (this.CurrentFilter.length > 0) {
			return Math.ceil(this.FilteredObjects.length / this.PageSize);
		} else {
			return Math.ceil(this.Objects.length / this.PageSize);
		}
	}
}

return FacetEngine;

});

	