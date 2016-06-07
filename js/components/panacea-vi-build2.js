//actually from main3.js (Ken changed after I pulled build2 in)
//Chen
////(function() {
(function (root, factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define(["jquery", "d3", "lodash"], factory)
	} else {
		root.panaceaViBuild2 = factory(root.$, root.d3, root.lodash)
	}
}(this, function (jQuery, d3, lodash) {
	
	'use strict';

	var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
		return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
	} : function (obj) {
		return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
	};

	var formatPercent = d3.format(',.1%');
	var formatNumber = d3.format('.3n');
	var white = 'hsla(0, 0%, 100%, 1)';
	var veryLightGrey = 'hsla(0, 0%, 95%, 1)';
	var lightGrey = 'hsla(0, 0%, 90%, 1)';
	var grey = 'hsla(0, 0%, 30%, 1)';
	var textDark = 'hsla(0, 0%, 40%, 1)';
	var translucentDark = 'hsla(0, 0%, 0%, 0.3)';
	var lightGreen = 'hsla(180, 50%, 40%, 0.5)';
	
	//Chen -- pulling var into d3 render function -- start
	//var mainContainer = d3.select('#contents');
	//var mainContainerXOffset = mainContainer[0][0].getBoundingClientRect().left;
	//var width = mainContainer.node().getBoundingClientRect().width - 150;
	//Chen -- pulling var into d3 render function -- end
	var height = 430;
	var margin = {
		left: 80,
		top: 130,
		right: 50,
		bottom: 30
	};
	var innerHeight = height - margin.bottom;

	
	var d3ViModule = {};
	var $ = jQuery;
	var d3 = d3;
	var _ = lodash;
	
	d3ViModule.testD3RenderData = function (data) {
		
	}

	//Chen
	//d3.json('../jsonWithLength.json', function (err, data) {
	d3ViModule.d3RenderData = function (data) {
		//Chen -- pull in all the var into render function -- start
		var mainContainer = d3.select('#contents');
		var mainContainerXOffset = mainContainer[0][0].getBoundingClientRect().left;
		var width = mainContainer.node().getBoundingClientRect().width - 150;

		if(mainContainer[0][0] !== null && mainContainer.node() !== null){
			mainContainerXOffset = mainContainer[0][0].getBoundingClientRect().left;
			//Chen
			//width = mainContainer.node().getBoundingClientRect().width - 150;
			//width = mainContainer.node().getBoundingClientRect().width;
			width = '95%';
			height = 430;
			margin = {
					left: 80,
					top: 130,
					right: 50,
					bottom: 30
			};
			innerHeight = height - margin.bottom;
		}
		//Chen -- pull in all the var into render function -- end
		
		var totalPatients = parseInt(data.totalCohortCount);
		var tableX = makeX(totalPatients, 250);
		// These are the things that don't get filtered
		const allDrugNames = _.chain(data['children'])
			.map(obj => {
				let namesArr = [];
				let allNames = getAllPropertyValues(obj, namesArr, 'conceptName');
				return allNames;
			}).reduce(function(acc, arr) {return acc.concat(arr);}
			, [])
			.uniq()
			.value();

		var allData = {
			header: 'Total Cohort',
			patientCount: totalPatients
		};
		var maxNumberOfUniqueConcepts = findMaxNumberOfDrugs(data);
		var maxNumberArray = _.range(maxNumberOfUniqueConcepts);
		var equalToArrays = _.map(maxNumberArray, function (num) {
			return [];
		});
		var greaterThanArrays = _.map(maxNumberArray, function (num) {
			return [];
		});
		var equalToOneArrays = _.map(maxNumberArray, function (num) {
			return [];
		});
		var numberOfDrugsTakenCollection = _.map(maxNumberArray, function (index) {
			var lengthOfInterest = index + 1;
			var greaterThanOrEqualToCollection = processValuesAccordingToFunctionPassedIn(data, totalPatients, lengthOfInterest, getValuesGreaterThanOrEqualToX, 'Patients Who Took At Least ', greaterThanArrays[index], 'uniqueConceptsArray', 'conceptName', false);
			var equalToCollection = processValuesAccordingToFunctionPassedIn(data, totalPatients, lengthOfInterest, getValuesEqualToX, 'Patients Who Took Exactly ', equalToArrays[index], 'uniqueConceptsArray', 'conceptName', false);
			return [{
				greaterThanOrEqualToCollection: greaterThanOrEqualToCollection,
				equalToCollection: equalToCollection
			}];
		});
		var flattenedNumberOfDrugsTakenCollection = _.map(_.values(_.groupBy(_.flatMap(numberOfDrugsTakenCollection, function (collection) {
			return _.toPairs(collection);
		}))), function (arr) {
			return _.map(arr, function (item) {
				return item[1];
			});
		});
		var tableCollection = flattenedNumberOfDrugsTakenCollection[0];
		drawCohortTable(mainContainer, allData, tableX);
		var keys = _.first(_.map(tableCollection, function (item) {
			return _.keys(item);
		}));
		tableCollection = _.map(keys, function (key) {
			return _.map(tableCollection, function (item) {
				return item[key];
			});
		});
		// Create the first two tables
		mainContainer.append('hr');
		mainContainer.append('h1').attr('class', 'heading').text('Distribution by Number of Drugs Taken');
		var firstTwoTableCollections = [tableCollection[0], tableCollection[1]];
		_.forEach(firstTwoTableCollections, function (collection, index) {
            if (index !== 1) { // skip exactly per JD
                drawTable(mainContainer, collection, tableX, 5, null);
            }
		});
		// Create the third table for medications by getting the equalToCollection from the tableCollection
		// and the first object from that array (as the ones for just one drug) then getting the medications from them
		var tableCollectionArrayLength = _.range(tableCollection[1].length);
		var sortedCollection = _.map(tableCollectionArrayLength, function (index) {
			var number = index + 1;
			var drugRegimenCollection = tableCollection[1][index];
			var groupedDrugRegimenCollection = _.chain(drugRegimenCollection.medications).groupBy('uniqueConcepts').values().value();
			var reducedDrugRegimenCollection = _.map(groupedDrugRegimenCollection, function (groupedDrugs) {
				var conceptGroupName = splitToArrayCapitalizeSort(groupedDrugs[0].uniqueConcepts, ', ').join(', ');
				var innerPatientCount = reducePropertyValues(groupedDrugs, 'patientCount');
				var avgTimesToStart = reduceAndWeightPropertyValues(groupedDrugs, 'avgTimeToStart', 'patientCount') / innerPatientCount;
				var avgDuration = reduceAndWeightPropertyValues(groupedDrugs, 'avgDuration', 'patientCount') / innerPatientCount;
				var avgAdherence = reduceAndWeightPropertyValues(groupedDrugs, 'avgGapPercent', 'patientCount') / innerPatientCount / 100;
				var children = _.map(groupedDrugs, function (drug) {
					return drug.children;
				})[0];
				var drops = reduceAndWeightPropertyValues(groupedDrugs, 'drops', 'patientCount') / innerPatientCount;
				var switches = reduceAndWeightPropertyValues(groupedDrugs, 'switches', 'patientCount') / innerPatientCount;
				var adds = reduceAndWeightPropertyValues(groupedDrugs, 'adds', 'patientCount') / innerPatientCount;
				var parent = _.map(groupedDrugs, function (drug) {
					return drug.parent;
				})[0];
				return {
					conceptGroupName: conceptGroupName,
					patientCount: [innerPatientCount, formatPercent(innerPatientCount / totalPatients)],
					avgTimesToStart: formatNumber(avgTimesToStart),
					avgDuration: parseInt(formatNumber(avgDuration)),
					avgAdherence: formatPercent(avgAdherence),
					drops: parseInt(formatNumber(drops)),
					switches: parseInt(formatNumber(switches)),
					adds: parseInt(formatNumber(adds)),
					concepts: groupedDrugs[0].concepts,
					children: children,
					conceptName: titleCase(groupedDrugs[0].conceptName.split(',').sort().join(' ')),
					parent: parent
				};
			});
			var sortedReducedDrugRegimenCollection = _.chain(reducedDrugRegimenCollection)
				.groupBy('conceptGroupName')
				.values()
				.map(function (group) {
					var patientCount = _.reduce(group, function (acc, item) {
						return acc + item.patientCount[0];
					}, 0);
					var newObj = {
						conceptGroupName: group[0].conceptGroupName,
						patientCount: [patientCount, formatPercent(patientCount / totalPatients)],
						avgTimesToStart: group[0].avgTimesToStart,
						avgDuration: group[0].avgDuration,
						avgAdherence: group[0].avgAdherence,
						drops: group[0].drops,
						switches: group[0].switches,
						adds: group[0].adds,
						concepts: group[0].concepts,
						children: group[0].children,
						conceptName: group[0].conceptName,
						parent: group[0].parent
					}
					return newObj;
				})
				.sortBy(function (item) {
					return item.patientCount[0];
				})
				.reverse()
				.value();
			mainContainer.append('h1').attr('class', 'heading').text('Distribution for ' + number + ' Drug Regimen');
			drawTable(mainContainer, sortedReducedDrugRegimenCollection, tableX, 8, null);
		});
		//Chen -- single ingredient
		//var detailByIngredient = processSingleDrugs(getSingleDrugs('uniqueConceptsArray', null));
		var detailByCompleteRegimen = processSingleDrugs(getSingleDrugs('concepts', 1));
		function getSingleDrugs(type, num) {
			if (num === null) {
				var allOfAName = [];
				processValuesAccordingToFunctionPassedIn(data, totalPatients, num, getValuesOfAName, null, allOfAName, type, 'conceptName', true);
				return allOfAName;
			} else {
				var allEqualToOne = [];
				processValuesAccordingToFunctionPassedIn(data, totalPatients, num, getValuesEqualToX, null, allEqualToOne, type, 'conceptName', false);
				return allEqualToOne;
			}
		}
		function processSingleDrugs(getFunc) {
			var groupedByNameJSON = _.map(_.groupBy(getFunc, 'conceptName'), group => _.groupBy(group, 'conceptName'));
			var singleDrugs = _.map(groupedByNameJSON, itemGroup => {
			var item = _.values(itemGroup);
			var itemNames = _.map(splitToArrayCapitalizeSort(item[0][0]['conceptName'], ','), conceptName => {
			return conceptName;
			});
			var itemPatientCount = _.reduce(item[0], (acc, curr) => acc + curr.patientCount, 0);
			var allItems = _.map(itemNames, itemName => {
			var children = _.chain(_.values(itemGroup)[0])
			.map(function (concept) {
			if (concept['children']) {
			return _.sortBy(_.map(concept['children'], child => {
			var childWithNoRepeatedConceptName = function (child) {
			var childConcepts = splitToArrayCapitalizeSort(child['conceptName'], ',');
			var filteredConcepts =  _.chain(childConcepts)
			.map(function (childConcept) {
			if (childConcept !== itemName) {
			return childConcept;
			}
			})
			.filter(function (childConcept) {
			return childConcept !== undefined;
			})
			.value();
			return filteredConcepts.join(', ');
			}
			return {
			childName: childWithNoRepeatedConceptName(child) ? childWithNoRepeatedConceptName(child) : 'No Drugs Taken After',
			count: child['patientCount']
			}
			}), 'count');
			} else {
			return {
			childName: 'No Drugs Taken After',
			count: concept['patientCount']
			}
			}
			})
			.flatten()
			.groupBy('childName')
			.values()
			.map(function (group) {
			var total = _.reduce(group, function (acc, child) {
			return acc + child.count
			}, 0);
			return {
			childName: group[0]['childName'],
			count: [total, formatPercent(total/itemPatientCount)]
			}
			})
			.sortBy(function(concept) {
			return concept['count'][0]
			})
			.reverse()
			.value();
			var parents = _.chain(_.values(itemGroup)[0])
			.map(concept => {
			if (concept['parentConcept']) {
			var parentWithNoRepeatedConceptName = function (parent) {
			var parentConcepts = splitToArrayCapitalizeSort(parent['parentConceptName'], ',');
			var filteredConcepts =  _.chain(parentConcepts)
			.map(function (parentConcept) {
			if (parentConcept !== itemName) {
			return parentConcept;
			}
			})
			.filter(function (parentConcept) {
			return parentConcept !== undefined;
			})
			.value();
			return filteredConcepts.join(', ');
			}
			return {
			parentName: concept['parentConcept'] ? parentWithNoRepeatedConceptName(concept['parentConcept']) : 'No Drugs Taken Before',
			count: concept['patientCount']
			}
			} else if (concept['parentConcept'] === undefined) {
			return {
			parentName: 'No Drugs Taken Before',
			count: concept['patientCount']
			}
			}
			})
			.flatten()
			.compact()
			.groupBy('parentName')
			.values()
			.map(function (group) {
			var total = _.reduce(group, function (acc, parent) {
			return acc + parent.count;
			}, 0);
			return {
			parentName: group[0]['parentName'],
			count: [total, formatPercent(total/itemPatientCount)]
			}
			})
			.sortBy(function(concept) {
			return concept['count'][0]
			})
			.reverse()
			.value();
			return {
			item: {
			name: itemName,
			count: itemPatientCount
			},
			children: children,
			parents: parents
			};
			});
			return allItems;
			});
			return singleDrugs;
			}
		
		var singleDrugsDiv = d3.select('#single-drugs-div');
		singleDrugsDiv.append('h1').attr('class', 'heading').text('Detail By Ingredient');
//Chen -- single ingredient
//		detailByIngredient = _.chain(detailByIngredient)
//			.flatten()
//			.groupBy(function (drug) {
//				return drug['item']['name'];
//			})
//			.values()
//			.map(group => {
//				var count = _.reduce(group, (acc, curr) => {
//					return acc + curr['item']['count'];
//				}, 0);
//				var children = _.reduce(group, (acc, curr) => {
//					return acc.concat(curr['children']);
//				}, []);
//				var parents = _.reduce(group, (acc, curr) => {
//					return acc.concat(curr['parents']);
//				}, []);
//				return _.first(_.map(group, item => {
//					return {
//						item: {
//							name: item['item']['name'],
//							count: count
//						},
//						children: children,
//						parents: parents
//					}
//				}))
//			})
//			.sortBy(function (drug) {
//				return drug['item']['count'];
//			})
//			.reverse()
//			.value();
//		console.log(detailByIngredient)

		var detailByIngredient = _.chain(data['singleIngredient'])
	    .values()
	    .sortBy('totalCount')
	    .reverse()
	    .map(function(o) {
	    	var children = _.chain(o.descendantArray)
	    			.values()
	    			.sortBy('descendantCount')
	    			.reverse()
	    			.map(function(descChild){
	    				return {
	  					childName: descChild.descendantConceptName,
	  			  		count: [descChild.descendantCount, descChild.descendantPercentage + '%']
	  
	    				};
	    			})
	    			.value();

	    	var parents = _.chain(o.ancestorArray)
	    			.values()
	    			.sortBy('ancestorCount')
	    			.reverse()
	    			.map(function(ancestor){
	    				return {
	  					parentName: ancestor.ancestorConceptName,
	  			  		count: [ancestor.ancestorCount, ancestor.ancestorPercentage + '%']
	  
	    				};
	    			})
	    			.value();
	    			
	          return {
	  		item: {
	  			name: o.oneDrugName ? o.oneDrugName.charAt(0).toUpperCase() + o.oneDrugName.slice(1) : '',
	    			count: o.totalCount
	    		},
	    		children: children,
	    		parents: parents
	  	 };
	     })
	     .value();

		_.forEach(detailByIngredient, data => {
            if (data.item.name !== "None") {
                var container = singleDrugsDiv.append('div').attr('class', 'clearfix');
                drawCohortTable(container, data.item, tableX);
                var innerDiv1 = container.append('div').attr('class', 'single-drug-section');
                var innerDiv2 = container.append('div').attr('class', 'single-drug-section');
                drawTable(innerDiv1, data.parents, tableX, 2, 'Drugs Taken Before');

                // remove none from drugs after
                var drugsAfterChildren = [];
                $.each(data.children, function() {
                    if (this.childName !== "None") {
                        drugsAfterChildren.push(this);
                    }
                });
                drawTable(innerDiv2, drugsAfterChildren, tableX, 2, 'Drugs Taken After');
            }
		});
		singleDrugsDiv.append('br');
		//singleDrugsDiv.append('h1').attr('class', 'heading').text('Detail By Complete Regimen');
		detailByCompleteRegimen = _.chain(detailByCompleteRegimen)
			.flatten()
			.groupBy(function (drug) {
				return drug['item']['name'];
			})
			.values()
			.map(group => {
				var count = _.reduce(group, (acc, curr) => {
					return acc + curr['item']['count'];
				}, 0);
				var children = _.reduce(group, (acc, curr) => {
					return acc.concat(curr['children']);
				}, []);
				var parents = _.reduce(group, (acc, curr) => {
					return acc.concat(curr['children']);
				}, []);
				return _.first(_.map(group, item => {
					return {
						item: {
							name: item['item']['name'],
							count: count
						},
						children: children,
						parents: item['parents']
					}
				}))
			})
			.sortBy(function (drug) {
				return drug['item']['count'];
			})
			.reverse()
			.value();
		//_.forEach(detailByCompleteRegimen, data => {
		//	var container = singleDrugsDiv.append('div').attr('class', 'clearfix');
		//	drawCohortTable(container, data.item, tableX);
		//	var innerDiv1 = container.append('div').attr('class', 'single-drug-section');
		//	var innerDiv2 = container.append('div').attr('class', 'single-drug-section');
		//	drawTable(innerDiv1, data.parents, tableX, 2, 'Drugs Taken Before');
		//	drawTable(innerDiv2, data.children, tableX, 2, 'Drugs Taken After');
		//});
		drawSorters();
		sortTable();
		function sortTable() {
			var arrowsUp = document.querySelectorAll('.arrow-up');
			_.forEach(arrowsUp, arrowUp => {
				arrowUp.addEventListener('click', function (ev) {
					var targetIndex = ev.target.classList.contains('col-1') ? 1 : 2;
					var sortableRows = ev.path[3].querySelectorAll('tr:not(:first-child)');
					var cells = ev.path[3].querySelectorAll('tr:not(:first-child) td:nth-child(' + targetIndex + ')');
					console.log(cells);
				});
			});
		}
		function reduceAndWeightPropertyValues(data, property, prevalenceProperty) {
			return _.chain(data).map(function (drug) {
				if (_.isNumber(parseInt(drug[property]))) return parseInt(drug[property]) * parseInt(drug[prevalenceProperty][0]);
				if (_.isNumber(parseFloat(drug[property]))) return parseFloat(drug[property]) * parseInt(drug[prevalenceProperty][0]);
			}).reduce(function (acc, curr) {
				return acc + curr;
			}).value();
		}
		function reducePropertyValues(data, property) {
			return _.chain(data).map(function (drug) {
				return _.isNumber(parseInt(drug[property])) ? parseInt(drug[property]) : drug[property];
			}).reduce(function (acc, curr) {
				return acc + curr;
			}).value();
		}
	//Chen
	//});
	};

	function drawCohortTable(container, data, tableX) {
		var table = container.append('table').attr({
			id: 'cohort-table'
		}).attr({
			//Chen -- 100%
			style: 'width:100%'
		});
		var tableRow = table.append('tr');
		drawCohortTableItems(tableRow, data, tableX);
	}
	function drawCohortTableItems(tableRow, data, tableX) {
		var values = _.values(data);
		_.forEach(values, function (item, index) {
			if (index === 0) {
				var cell = drawCell(item, tableRow, 'big-col');
				drawSpan(item, cell, null);
			} else {
				var _cell = drawCell(item, tableRow, null);
				drawSvgAndBar(tableX, _cell, item);
				drawSpan(item, _cell, null);
			}
		});
	}
	function drawTable(container, data, tableX, appropriateNumberOfColumns, tableHeader) {

		var table = container.append('table').attr({
			class: 'summary-table' 
		}).attr({
			//Chen -- 100% width
			style: 'width:100%' 
		});
		var tableHeadRow = table.append('tr');
		drawTableHeadItems(tableHeadRow, appropriateNumberOfColumns, tableHeader);
		_.forEach(data, function (item) {
			var tableRow = table.append('tr');
			drawTableItems(tableRow, item, tableX, appropriateNumberOfColumns);
		});
	}
	function drawTableHeadItems(tableHeadRow, appropriateNumberOfColumns, tableHeader) {
		var headings = function headings() {
			if (appropriateNumberOfColumns === 2) {
				return [tableHeader, 'Count'];
			}
			if (appropriateNumberOfColumns === 5) {
				return ['', 'Patient Count', 'Avg Days to Start', 'Avg Duration', 'Avg Adherence'];
			}
			if (appropriateNumberOfColumns === 8) {
				return ['', 'Patient Count', 'Avg Days to Start', 'Avg Duration', 'Avg Adherence', 'Drops', 'Switches', 'Adds'];
			}
		};
		_.forEach(headings(), function (heading) {
			tableHeadRow.append('th').text(heading);
		});
	}
	function drawSorters() {
		d3.selectAll('th:first-of-type')
			.append('span')
			.attr('class', 'arrow-up pull-right col-1');
		d3.selectAll('th:nth-of-type(2)')
			.append('span')
			.attr('class', 'arrow-up pull-right col-2');
	}
	function drawTableItems(tableRow, data, tableX, appropriateNumberOfColumns) {
		var values = _.values(data);
		_.forEach(values, function (item, index) {
			var medName = function medName() {
				return values[0];
			};
			if (index < appropriateNumberOfColumns) {
				if (index === 0) {
					var cell = drawCell(medName(), tableRow, 'first-col');
					drawSpan(medName(), cell, null);
				} else {
					(function () {
						var cell = drawCell(item, tableRow, null);
						if (Array.isArray(item)) {
							_.forEach(item, function (val, valIndex) {
								if (index === 1 && valIndex === 1) {
									drawSpan(val, cell, 'muted');
								} else {
									drawSvgAndBar(tableX, cell, val);
									drawSpan(val, cell, null);
								}
							});
						} else {
							drawSpan(item, cell, null);
						}
					})();
				}
			}
		});
	}
	function drawCell(item, tableRow, className) {
		return tableRow.append('td').attr('class', className);
	}

	function drawSpan(item, cell, className) {
		return cell.append('span').attr('class', function () {
			return className ? className : null;
		}).text(className === 'muted' ? ' (' + item + ')' : item);
	}
	function drawSvgAndBar(x, cell, item) {
		var svg = cell.append('svg').attr({
			width: x(item),
			height: 12
		}).style('margin-right', '5px');
		svg.append('rect').attr({
			class: 'table-bar',
			width: x(item),
			height: 12
		});
	}
	function findMaxNumberOfDrugs(data) {
		var newArr = [];
		_.map(data.children, function (item) {
			return getAllPropertyValues(item, newArr, 'uniqueConceptsArray');
		});
		var value = _.chain(newArr).map(function (item) {
			return item.length;
		}).sortBy().last().value();
		return value;
	}
	function processValuesAccordingToFunctionPassedIn(data, totalPatients, lengthOfInterest, getFunc, label, arr, type, property, isLastUniqueConcept) {
		var allRelevantData = getAllRelevantData(data, getFunc, lengthOfInterest, arr, type, isLastUniqueConcept);
		var flattenedRelevantData = getFlattenedReducedValues(allRelevantData, property);
		var innerTotalPatientCount = _.chain(allRelevantData).map(function (item) {
			return item.patientCount;
		}).reduce(function (acc, curr) {
			return acc + curr;
		}).value();
		var daysFromCohortStart = _.chain(allRelevantData).map(function (item) {
			var days = item.daysFromCohortStart;
			var patientCount = item.patientCount;
			var weightedDays = days * patientCount;
			return weightedDays;
		}).reduce(function (acc, curr) {
			return acc + curr;
		}).value();
		var avgDuration = _.chain(allRelevantData).map(function (item) {
			var duration = item.avgDuration;
			var patientCount = item.patientCount;
			var weightedDuration = duration * patientCount;
			return weightedDuration;
		}).reduce(function (acc, curr) {
			return acc + curr;
		}).value();
		var avgGapPercent = _.chain(allRelevantData).map(function (item) {
			var gapPercent = parseInt(item.gapPercent);
			var patientCount = item.patientCount;
			var weightedGapPercent = gapPercent * patientCount;
			return weightedGapPercent;
		}).reduce(function (acc, curr) {
			return acc + curr;
		}).value();
		var medications = _.map(flattenedRelevantData, function (item) {
			var concepts = item.concepts;
			var conceptNames = _.map(concepts, function (concept) {
				return _.map(concept, function (inner) {
					return inner.innerConceptName;
				});
			})[0];
			var conceptChildrenOfDrugType = item.children;
			var uniqueConcepts = _.map(item.uniqueConcepts, function (uniqueConcepts) {
				return _.map(uniqueConcepts, function (uniqueConcept) {
					return uniqueConcept.innerConceptName;
				});
			})[0];
			var uniqueConceptNames = uniqueConcepts.join(', ');
			var childInnerConceptIds = _.uniq(_.flattenDeep(_.map(conceptChildrenOfDrugType, function (group) {
				var drugTypeChildren = _.map(group, function (child) {
					return _.map(child.concepts, function (childConcept) {
						return childConcept.innerConceptId;
					});
				});
				return drugTypeChildren;
			})));
			var compactConceptsNotFoundInChildren = _.compact(_.map(concepts, function (concept) {
				return _.compact(_.map(childInnerConceptIds, function (childId) {
					return _.map(concept, function (innerConcept) {
						if (innerConcept.innerConceptId !== childId) return item;
					});
				})[0]);
			}));
			var compactChildrenNotFoundInConcept = _.compact(_.map(conceptChildrenOfDrugType, function (child) {
				return _.map(concepts, function (concept) {
					return _.compact(_.map(child, function (childConcept) {
						return _.map(childConcept.concepts, function (childInnerConcept) {
							if (concept.innerConceptId !== childInnerConcept.innerConceptId) return child;
						});
					}));
				})[0];
			}));
			var childComparisons = _.chain(item.concepts).map(function (itemConceptArr) {
				var newArr = [];
				var itemConceptIds = _.reduce(itemConceptArr, function (acc, itemConcept) {
					return acc.concat(itemConcept.innerConceptId);
				}, []);
				var comparisons = _.map(itemConceptIds, function (itemId) {
					return _.map(item.children, function (childArr) {
						var arrayOfChildren = _.map(childArr, function (child) {
							var childConceptIds = _.map(child.concepts, function (childConcept) {
								return childConcept.innerConceptId;
							});
							if (childConceptIds.length < itemConceptIds.length) {
								_.map(childConceptIds, function (childId) {
									return itemId !== childId ? newArr.push({ 'drop': child.patientCount }) : newArr.push({ 'drop': 0 });
								});
							}
							if (childConceptIds.length === itemConceptIds.length) {
								_.map(childConceptIds, function (childId) {
									return itemId !== childId ? newArr.push({ 'switch': child.patientCount }) : newArr.push({ 'switch': 0 });
								});
							}
							if (childConceptIds.length > itemConceptIds.length) {
								_.map(childConceptIds, function (childId) {
									return itemId !== childId ? newArr.push({ 'add': child.patientCount }) : newArr.push({ 'add': 0 });
								});
							}
						});
					});
				});
				var drops = _.reduce(_.compact(_.map(newArr, function (obj) {
					return obj.drop;
				})), function (acc, curr) {
					return acc + curr;
				});
				var switches = _.reduce(_.compact(_.map(newArr, function (obj) {
					return obj.switch;
				})), function (acc, curr) {
					return acc + curr;
				});
				var adds = _.reduce(_.compact(_.map(newArr, function (obj) {
					return obj.add;
				})), function (acc, curr) {
					return acc + curr;
				});
				return { drops: drops, switches: switches, adds: adds };
			}).compact().value();
			var drops = childComparisons[0]['drops'] === undefined ? 0 : childComparisons[0]['drops'];
			var switches = childComparisons[0]['switches'] === undefined ? 0 : childComparisons[0]['switches'];
			var adds = childComparisons[0]['adds'] === undefined ? 0 : childComparisons[0]['adds'];
			return {
				conceptName: item.conceptName,
				patientCount: [item.patientCount, formatPercent(item.patientCount / innerTotalPatientCount)],
				avgTimeToStart: formatNumber(item.avgTimeToStart),
				avgDuration: formatNumber(item.avgDuration),
				avgGapPercent: formatPercent(item.avgGapPercent),
				drops: drops,
				switches: switches,
				adds: adds,
				children: item.children,
				concepts: item.concepts,
				uniqueConcepts: uniqueConceptNames,
				parent: item.parent
			};
		});
		return {
			numberOfDrugs: function numberOfDrugs() {
				if (lengthOfInterest === 1) return label + ' ' + lengthOfInterest + ' Drug';else return label + ' ' + lengthOfInterest + ' Drugs';
			},
			patientCount: [innerTotalPatientCount, formatPercent(innerTotalPatientCount / totalPatients)],
			avgTimeToStart: formatNumber(daysFromCohortStart / innerTotalPatientCount),
			avgDuration: formatNumber(avgDuration / innerTotalPatientCount),
			avgGapPercent: formatPercent(1 - avgGapPercent / innerTotalPatientCount / 100),
			medications: medications
		};
	}
	function getAllRelevantData(data, getFunc, lengthOfInterest, newArr, property, isLastUniqueConcept) {
		var allRelevantData = _.forEach(data.children, function (obj) {
			if (isLastUniqueConcept) {
				var conceptsOfInterest = obj[property];
				var lastIndexOfInterest = conceptsOfInterest.length - 1;
				var lastConceptOfInterest = conceptsOfInterest[lastIndexOfInterest];
				getFunc(obj, property, lastConceptOfInterest, newArr);
			}
			getFunc(obj, property, lengthOfInterest, newArr);
		});
		return newArr;
	}
	function getFlattenedReducedValues(data, property) {
		var flattenedRelevantData = _.chain(data).groupBy(property).map(function (arr) {
			return _.map(arr, function (item) {
				return {
					conceptName: item.conceptName,
					patientCount: parseInt(item.patientCount),
					avgTimeToStart: parseInt(item.daysFromCohortStart),
					avgDuration: parseInt(item.avgDuration),
					avgGapPercent: 1 - item.gapPercent / 100,
					children: item.children,
					concepts: item.concepts,
					uniqueConcepts: item.uniqueConceptsArray
				};
			});
		}).map(function (arr) {
			return _.map(arr, function (obj) {
				return _.values(obj);
			});
		}).map(function (arr) {
			return _.unzip(arr);
		}).map(function (arr) {
			return _.zipObject(['conceptName', 'patientCount', 'avgTimeToStart', 'avgDuration', 'avgGapPercent', 'children', 'concepts', 'uniqueConcepts'], _.map(arr, function (innerArr, index) {
				var patientCounts = _.map(arr[1], function (item) {
					return item;
				});
				var innerTotalPatients = _.reduce(patientCounts, function (acc, count) {
					return acc + count;
				});
				if (index === 0) {
					return innerArr[0];
				}
				if (index === 1) {
					return innerTotalPatients;
				}
				if (index > 1 && index < 5) {
					var counts = _.map(patientCounts, function (patientCount) {
						var percentageMultiplier = patientCount / innerTotalPatients;
						var multipliedCounts = _.map(innerArr, function (item) {
							return item * percentageMultiplier;
						});
						var totalMultipliedCounts = _.reduce(multipliedCounts, function (acc, item) {
							return acc + item;
						});

						return totalMultipliedCounts / multipliedCounts.length;
					});
					return _.reduce(counts, function (acc, curr) {
						return acc + curr;
					});
				}
				if (index === 5) {
					return arr[index];
				}
				if (index === 6) {
					return arr[index];
				}
				if (index === 7) {
					return arr[index];
				}
			}));
		}).value();
		return flattenedRelevantData;
	}
	function getValuesGreaterThanOrEqualToX(obj, property, numberOfInterest, arr) {
		if (Array.isArray(obj)) {
			_.forEach(obj, function (item) {
				if (item[property].length >= numberOfInterest) {
					arr.push(item);
					return;
				} else {
					getValuesGreaterThanOrEqualToX(item, property, numberOfInterest, arr);
				}
			});
		} else {
			if (obj[property].length >= numberOfInterest) {
				arr.push(obj);
				return;
			} else {
				_.forEach(obj.children, function (child) {
					if (child[property].length >= numberOfInterest) {
						if (arr) {
							arr.push(child);
						}
						return;
					} else {
						getValuesGreaterThanOrEqualToX(child, property, numberOfInterest, arr);
					}
				});
			}
		}
	}
	function getValuesEqualToX(obj, property, numberOfInterest, arr) {
		if (Array.isArray(obj)) {
			_.forEach(obj, function (item) {
				if (item[property].length === numberOfInterest) {
					arr.push(item);
					return;
				} else {
					getValuesEqualToX(item, property, numberOfInterest, arr);
				}
			});
		} else {
			if (obj[property] && obj[property].length === numberOfInterest) {
				arr.push(obj);
				return;
			} else {
				_.forEach(obj.children, function (child) {
					if (child[property] && child[property].length === numberOfInterest) {
						if (arr) {
							arr.push(child);
						}
						return;
					} else {
						getValuesEqualToX(child, property, numberOfInterest, arr);
					}
				});
			}
		}
	}
	function getValuesOfAName(obj, property, name, arr) {
		if (Array.isArray(obj)) {
			_.forEach(obj, function (item) {
				var conceptsOfInterest = item[property];
				var lastIndexOfInterest = conceptsOfInterest.length - 1;
				var lastConceptOfInterest = conceptsOfInterest[lastIndexOfInterest];
				if (lastIndexOfInterest === name) {
					arr.push(item);
					return;
				} else {
					getValuesOfAName(item, property, name, arr);
				}
			});
		} else {
			var objConceptsOfInterest = obj[property];
			var lastObjIndexOfInterest = objConceptsOfInterest.length - 1;
			var lastObjConceptOfInterest = objConceptsOfInterest[lastObjIndexOfInterest];
			if (lastObjConceptOfInterest === name) {
				arr.push(obj);
				return;
			} else {
				_.forEach(obj.children, function (child) {
					var childConceptsOfInterest = child[property];
					var lastChildIndexOfInterest = childConceptsOfInterest.length - 1;
					var lastChildConceptOfInterest = childConceptsOfInterest[lastChildIndexOfInterest];
					if (lastChildConceptOfInterest === name) {
						if (arr) {
							arr.push(child);
						}
						return;
					} else {
						getValuesOfAName(child, property, name, arr);
					}
				});
			}
		}
	}
	function getAllPropertyValues(obj, newArr, property) {
		if (Array.isArray(obj)) {
			obj.forEach(function (item) {
				if (!('children' in item)) {
					newArr.push(item[property]);
				} else {
					item.children.forEach(function (child) {
						getAllPropertyValues(child, newArr, property);
					});
					newArr.push(item[property]);
				}
			});
		} else {
			if (!('children' in obj)) {
				newArr.push(obj[property]);
			} else {
				obj.children.forEach(function (child) {
					getAllPropertyValues(child, newArr, property);
				});
				newArr.push(obj[property]);
			}
		}
		return newArr;
	}
	function makeX(totalPatients, barMaxWidth) {
		return d3.scale.linear().range([0, barMaxWidth]).domain([0, totalPatients]);
	}
	function darkenByLength(length) {
		var alpha = 0.3;
		var color = 'hsla(180, 50%, 40%,' + length / 1.5 * alpha + ')';
		return color;
	}
	function shortenWordByAmount(str, amt) {
		var strArray = str.split(',');
		return strArray.map(function (str) {
			return _.take(str.split(''), amt).join('');
		}).reduce(function (acc, curr) {
			return acc + ',' + curr;
		});
	}
	function clearAll(detailsContainerInner, summarySection, svg) {
		detailsContainerInner.selectAll('*').remove();
		summarySection.selectAll('*').remove();
		svg.selectAll('path.link').remove();
		svg.selectAll('rect.med').style('fill', white);
	}
	function getTargetText(ev, nodeIndex) {
		var targetText = void 0;
		if (ev.target.className === 'drug-name') {
			targetText = ev.target.childNodes[nodeIndex].textContent;
		} else if (ev.target.className === 'full-drug') {
			targetText = ev.target.parentNode.childNodes[nodeIndex].textContent;
		} else if (ev.target.className === 'drug-abbrev') {
			targetText = ev.target.parentNode.childNodes[nodeIndex].textContent;
		}
		return targetText;
	}
	function drawCohortSize(container, data) {
		var total = _.first(data).totalPatients;
		container.append('span').attr({
			transform: 'translate(10, 15)'
		}).style({
			opacity: 0,
			'font-size': '15px',
			'font-weight': 'bold'
		}).text('Cohort Size: ' + total).transition().delay(250).duration(500).style('opacity', 1);
		container.append('br');
	}
	function drawCohortBars(data) {
		var maxBarWidth = 100;
		var maxBarHeight = 200;
		var barHeight = 12;
		var totals = data.map(function (datum) {
			return datum.total;
		});
		var total = totals.reduce(function (acc, curr) {
			return acc + curr;
		});
		var barXScale = d3.scale.linear().range([0, maxBarWidth]).domain([0, d3.max(totals)]);
		var barSvg = cohortDetailsSvg.append('svg').attr({
			width: maxBarWidth + 800,
			height: maxBarHeight
		});
		var cohortSize = barSvg.append('g');
		cohortSize.append('text').attr({
			transform: 'translate(0, 35)',
			fill: textDark
		}).style('font-weight', 'bold').text('Cohort Size: ' + total);
		cohortSize.append('rect').attr({
			width: barXScale(total),
			height: barHeight,
			transform: 'translate(300, 25)'
		}).style({
			'fill': lightGreen,
			'stroke': lightGreen
		});
		barSvg.append('line').attr({
			x1: 0,
			y1: 64,
			x2: 950,
			y2: 64
		}).style({
			stroke: 'hsla(0, 0%, 0%, 0.2)'
		});
		var bars = data.forEach(function (item, i) {
			var itemTotal = item.total;
			var itemPercent = itemTotal / total;
			var g = barSvg.append('g').attr('transform', 'translate(0, ' + (48 + i * 25) + ')');
			var barLabel = g.append('text').attr({
				transform: 'translate(0, 10)',
				fill: textDark
			}).text(function () {
				var itemPercent = item.total / total;
				if (item.lineNumber === 0) {
					item.total / total;
					return 'On no therapy: ' + item.total + ' (' + formatPercent(itemPercent) + ')';
				}
				if (item.lineNumber === 1) {
					return '1st line therapy: ' + item.total + ' (' + formatPercent(itemPercent) + ')';
				}
				if (item.lineNumber === 2) {
					return '2nd line therapy: ' + item.total + ' (' + formatPercent(itemPercent) + ')';
				}
				if (item.lineNumber === 3) {
					return '3rd line therapy: ' + item.total + ' (' + formatPercent(itemPercent) + ')';
				}
			});
			var bar = g.append('rect').attr({
				width: barXScale(item.total),
				height: barHeight,
				transform: 'translate(300, 0)'
			}).style({
				'fill': lightGreen,
				'stroke': lightGreen
			});
			g.append('text').attr({
				transform: 'translate(467, 10)'
			}).style({
				fill: textDark
			}).text(function () {
				if (item.lineChildrenActions !== null) return item.lineChildrenActions.switches;
			});
			g.append('text').attr({
				transform: 'translate(522, 10)'
			}).style({
				fill: textDark
			}).text(function () {
				if (item.lineChildrenActions !== null) return item.lineChildrenActions.drops;
			});
			g.append('text').attr({
				transform: 'translate(573, 10)'
			}).style({
				fill: textDark
			}).text(function () {
				if (item.lineChildrenActions !== null) return item.lineChildrenActions.augments;
			});
		});

		explainSwitchingPatterns(barSvg);
	}
	function explainSwitchingPatterns(container) {
		var circle = d3.svg.symbol().type('circle');
		var legend = container.append('g').attr({
			transform: 'translate(450, 0)'
		});
		var switched = legend.append('g').attr({
			transform: 'translate(20, 58)'
		});
		switched.append('text').text('Switches').attr({
			transform: 'translate(-5, -8)'
		}).style({
			fill: textDark,
			'font-size': '9px'
		});
		switched.append('circle').attr({
			r: 3
		});
		switched.append('line').attr({
			x1: 5,
			y1: 0,
			x2: 10,
			y2: 0
		}).style({
			'stroke': textDark
		});
		switched.append('circle').attr({
			r: 3,
			transform: 'translate(15, 0)'
		}).style({
			'fill': lightGreen,
			'stroke': lightGreen
		});

		var dropped = legend.append('g').attr({
			transform: 'translate(75, 58)'
		});
		dropped.append('text').text('Drops').attr({
			transform: 'translate(-5, -8)'
		}).style({
			fill: textDark,
			'font-size': '9px'
		});
		dropped.append('circle').attr({
			r: 3
		});
		dropped.append('line').attr({
			x1: 5,
			y1: 0,
			x2: 10,
			y2: 0
		}).style({
			'stroke': textDark
		});
		dropped.append('circle').attr({
			r: 3,
			transform: 'translate(15, 0)'
		}).style({
			'fill': 'transparent',
			'stroke': 'black'
		});
		var augmented = legend.append('g').attr({
			transform: 'translate(125, 58)'
		});
		augmented.append('text').text('Augments').attr({
			transform: 'translate(-5, -8)'
		}).style({
			fill: textDark,
			'font-size': '9px'
		});
		augmented.append('circle').attr({
			r: 3
		});
		augmented.append('line').attr({
			x1: 5,
			y1: 0,
			x2: 10,
			y2: 0
		}).style({
			'stroke': textDark
		});
		augmented.append('circle').attr({
			r: 3,
			transform: 'translate(15, 0)'
		});
		augmented.append('circle').attr({
			r: 3,
			transform: 'translate(22, 0)'
		}).style({
			'fill': lightGreen,
			'stroke': lightGreen
		});
	}
	function splitToArrayCapitalizeSort(str, splitter) {
		return _.chain(str.split(splitter))
			.map(function (concept) {
				return titleCase(concept);
			})
			.sortBy()
			.value();
	}
	function titleCase(str) {
		if (str !== undefined) {
			str = str.toLowerCase().split(' ');      

			for(var i = 0; i < str.length; i++){     
			  str[i] = str[i].split('');         
			  str[i][0] = str[i][0].toUpperCase();
			  str[i] = str[i].join('');           
			}
			return str.join(' '); 
		}                   
	}
	function getLineOfTherapyObj(number, data) {
		var newObj = data.map(function (obj) {
			if (obj.depth === number - 1) return obj;
		}).filter(function (count) {
			return count !== undefined;
		});
		return newObj;
	}
	function getLineOfTherapyTotal(data) {
		var total = data.map(function (obj) {
			return obj.patientCount;
		}).filter(function (count) {
			return count !== undefined;
		}).reduce(function (acc, curr) {
			return acc + curr;
		});
		return total;
	}
	function getLineOfTherapyAvgDuration(data) {
		var total = data.map(function (obj) {
			return obj.avgDuration;
		}).filter(function (count) {
			return count !== undefined;
		}).reduce(function (acc, curr) {
			return acc + curr;
		});
		return total / data.length;
	}
	function getImmediateChildrenOfGivenItemDepth(data, depth, x) {
		var lineOfTherapyObjs = getLineOfTherapyObj(depth, data);
		var nextLineOfTherapyObjs = getLineOfTherapyObj(depth + 1, data);
		var children = lineOfTherapyObjs.map(function (obj) {
			return nextLineOfTherapyObjs.map(function (item) {
				if (item.rectXOffset >= obj.rectXOffset && item.rectXOffset <= obj.rectXOffset + x(obj.patientCount)) {
					return {
						concept: obj,
						child: item
					};
				}
			}).filter(function (obj) {
				return obj !== undefined;
			});
		});
		return children;
	}
	
	return d3ViModule;
}));

//var d3ViRenderModule = (function() {
//'use strict';
//
////Chen
//var d3ViModule = {};
////var d3 = require("../d3.min");
////var _ = require("../lodash.min");
//
//var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
//
//d3ViModule.d3RenderData = function(data) {
//}
//	return d3ViModule;
//})();