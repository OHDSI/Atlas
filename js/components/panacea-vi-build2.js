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
	
	var d3ViModule = {};
	var $ = jQuery;
	var d3 = d3;
	var _ = lodash;
	
	d3ViModule.testD3RenderData = function (data) {
		
	}

	'use strict';

	//Chen -- pull in all the var into render function -- start
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var formatPercent = d3.format(',.1%');
	var formatNumber = d3.format('.3n');
	var white = 'hsla(0, 0%, 100%, 1)';
	var veryLightGrey = 'hsla(0, 0%, 95%, 1)';
	var lightGrey = 'hsla(0, 0%, 90%, 1)';
	var grey = 'hsla(0, 0%, 30%, 1)';
	var textDark = 'hsla(0, 0%, 40%, 1)';
	var translucentDark = 'hsla(0, 0%, 0%, 0.3)';
	var lightGreen = 'hsla(180, 50%, 40%, 0.5)';
	var mainContainer = d3.select('#main-container');
	//Chen -- pull in all the var into render function -- end
	// const namesContainer = d3.select('#drug-name-container');
	// const studyTitle = d3.select('#study-title');
	// const studyDescription = d3.select('#study-description');
	// const cohortDetailsText = d3.select('#cohort-details-text');
	// const cohortDetailsSvg = d3.select('#cohort-details-svg');
	// const summarySection = d3.select('#summary-container');
	// const summaryTable = d3.select('#summary-table');
	// const conceptSelector = document.querySelector('#concept-selector');
	// const childrenSelector = document.querySelector('#children-selector');
	// const parentsSelector = document.querySelector('#parents-selector');
	// const allSelector = document.querySelector('#all-selector');
	// const firstSelector = document.querySelector('#first-selector');
	
	//Chen -- pull in all the var into render function -- start
	//Chen -- null check
//	var mainContainerXOffset;
//	var width;
//	var height;
//	var margin;
//	var innerHeight;
//
//	if(mainContainer[0][0] !== null && mainContainer.node() !== null){
//		mainContainerXOffset = mainContainer[0][0].getBoundingClientRect().left;
//		width = mainContainer.node().getBoundingClientRect().width - 150;
//		height = 430;
//		margin = {
//				left: 80,
//				top: 130,
//				right: 50,
//				bottom: 30
//		};
//		innerHeight = height - margin.bottom;
//	}
	//Chen -- pull in all the var into render function -- end
	// const svg = mainContainer.append('svg')
//	 	.attr({
//	 		width: width + margin.left + margin.right,
//	 		height: height + margin.top + margin.bottom
//	 	});
	// const drugBarsZone = svg.append('g')
//	 	.attr({
//	 		transform: 'translate(' + margin.left + ', ' + margin.top + ')'
//	 	});
	// const boundingRect = drugBarsZone.append('rect')
//	 	.attr({
//	 		width: width + 8,
//	 		height: innerHeight + 8,
//	 		transform: 'translate(-4, -4)'
//	 	})
//	 	.style({
//	 		fill: veryLightGrey,
//	 		stroke: grey,
//	 		'stroke-width': '0px'
//	 	});
	// const detailsContainer = svg.append('svg')
//	 	.attr({
//	 		transform: 'translate(0, 0)',
//	 		id: 'details-container'
//	 	});
	// detailsContainer.append('rect')
//	   	.style({
//	   		fill: veryLightGrey,
//	   		width: width + margin.left + margin.right,
//	   		height: 70
//	   	});
	// const detailsContainerInner = detailsContainer.append('g');
	// let y = d3.scale.linear()
//	 	.range([0, innerHeight]);
	//Chen
	//d3.json('../jsonWithLength.json', function (err, data) {
	d3ViModule.d3RenderData = function (data) {
		//Chen -- pull in all the var into render function -- start
//		var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
//		var formatPercent = d3.format(',.1%');
//		var formatNumber = d3.format('.3n');
//		var white = 'hsla(0, 0%, 100%, 1)';
//		var veryLightGrey = 'hsla(0, 0%, 95%, 1)';
//		var lightGrey = 'hsla(0, 0%, 90%, 1)';
//		var grey = 'hsla(0, 0%, 30%, 1)';
//		var textDark = 'hsla(0, 0%, 40%, 1)';
//		var translucentDark = 'hsla(0, 0%, 0%, 0.3)';
//		var lightGreen = 'hsla(180, 50%, 40%, 0.5)';
		var mainContainer = d3.select('#main-container');

		var mainContainerXOffset;
		var width;
		var height;
		var margin;
		var innerHeight;

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
		// const allDrugNames = data['children'].map(obj => {
		// 	let namesArr = [];
		// 	let allNames = getAllPropertyValues(obj, namesArr, 'conceptName');
		// 	return allNames;
		// }).reduce((acc, arr) => {
		// 	return acc.concat(arr);
		// }, []);
		// const uniqueDrugNames = _.uniq(allDrugNames);
		// const treatmentArray = _.sortBy(uniqueDrugNames.map(drugGroup => {
		// 		return {
		// 			treatment: drugGroup,
		// 			length: drugGroup.split(',').length
		// 		}
		// 	}), 'length');
		// drawDrugNames(treatmentArray, namesContainer);
		// These are the things that do get filtered
		// const allPatients = data['children'].map(obj => {
		// 	let patientArr = [];
		// 	let allPatients = getFirsts(obj, patientArr, 'patientCount');
		// 	return allPatients;
		// });

		// const allTimes = data['children'].map(obj => {
		// 	let timeArr = [];
		// 	let allTimes = getAllPropertyValues(obj, timeArr, 'avgDuration');
		// 	return allTimes;
		// });
		// const maxTime = d3.max(addUpFromArr(allTimes));
		// y.domain([0, 1000]);
		// const yAxis = d3.svg.axis()
		//        .orient('bottom')
		//        .ticks(5)
		//        .scale(y);
		// drugBarsZone.append('g')
		//     .attr({
		//     	class: 'y-axis', // look for styles in css
		//     	transform: 'translate(-15, 0) rotate(90)'
		//     })
		//     .call(yAxis);
		//    drugBarsZone.append('text')
		//    	.attr({
		// 		transform: 'translate(' + (width/2) + ', ' + (height) + ')'
		// 	})
		// 	.style({
		// 		'font-size': '14px',
		// 		fill: textDark,
		// 		'text-anchor': 'middle'
		// 	})
		// 	.text('% Patients on Therapy');
		// drugBarsZone.append('text')
		//    	.attr({
		// 		transform: 'translate(' + (-55) + ', ' + (innerHeight/2) + ') rotate(90)'
		// 	})
		// 	.style({
		// 		'font-size': '14px',
		// 		fill: textDark,
		// 		'text-anchor': 'middle'
		// 	})
		// 	.text('Number of Days on Therapy');
		// const x = makeX(totalPatients);

		//Chen -- add _typeof as param
		var dataWithRunningTotals = sendDataToTree(data, totalPatients);
		var allData = {
			header: 'Total Cohort',
			patientCount: totalPatients
		};
		var maxNumberOfUniqueConcepts = findMaxNumberOfDrugs(data);
		var maxNumberArray = _.range(maxNumberOfUniqueConcepts);
		var numberOfDrugsTakenCollection = _.map(maxNumberArray, function (number) {
			var lengthOfInterest = number + 1;
			var greaterThanOrEqualToCollection = processValuesAccordingToFunctionPassedIn(data, totalPatients, lengthOfInterest, getValuesGreaterThanOrEqualToX, 'At Least');
			var equalToCollection = processValuesAccordingToFunctionPassedIn(data, totalPatients, lengthOfInterest, getValuesEqualToX, '');
			var medicationsForEqualData = processMedicationsAccordingToFunctionPassedIn(data, totalPatients, lengthOfInterest, getValuesEqualToX, '');
			return [{
				greaterThanOrEqualToCollection: greaterThanOrEqualToCollection,
				equalToCollection: equalToCollection
			}, {
				medicationsForEqualData: medicationsForEqualData
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
		var medicationCollection = flattenedNumberOfDrugsTakenCollection[1];
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
		var firstTwoTableCollections = [tableCollection[0], tableCollection[1]];
		_.forEach(firstTwoTableCollections, function (collection, index) {
			var collectionType = function collectionType() {
				if (index === 0) {
					mainContainer.append('h1').attr('class', 'table-heading').text('At Least Breakdown');
				}
				if (index === 1) {
					mainContainer.append('h1').attr('class', 'table-heading').text('Exactly Breakdown');
				}
			};
			mainContainer.append('hr');
			collectionType();
			drawTable(mainContainer, collection, tableX, 5);
		});
		// Create the medication breakdown for the second table
		_.forEach(medicationCollection, function (collection, i) {
			drawMedicationSvg(mainContainer, collection);
		});
		// Create the third table for medications by getting the equalToCollection from the tableCollection
		// and the first object from that array (as the ones for just one drug) then getting the medications from them
		var tableCollectionArrayLength = _.range(tableCollection[1].length);
		_.forEach(tableCollectionArrayLength, function (index) {
			var number = index + 1;
			var drugRegimenCollection = tableCollection[1][index];
			mainContainer.append('h1').attr('class', 'table-heading').text(number + ' Drug Regimen Breakdown');
			drawTable(mainContainer, drugRegimenCollection.medications, tableX, 8);
		});
		// let rects = document.querySelectorAll('g.med-group');
		// let flattenedDataFromRects = _.map(rects, (rect, i) => {
		// 	let patientCount = parseInt(rect.getAttribute('patientCount'));
		// 	let percentage = parseInt(rect.getAttribute('percentage'));
		// 	let gapPercent = parseInt(rect.getAttribute('gapPercent'));
		// 	let depth = parseInt(rect.getAttribute('depth'));
		// 	let conceptName = rect.getAttribute('conceptName');
		// 	let totalPatients = parseInt(rect.getAttribute('totalPatients'));
		// 	let avgDuration = parseInt(rect.getAttribute('avgDuration'));
		// 	let rectXOffset = rect.getBoundingClientRect().left - margin.left;
		// 	let rectYOffset = rect.getBoundingClientRect().top - margin.top;
		// 	let obj = {
		// 		patientCount: patientCount,
		// 		conceptName: conceptName,
		// 		avgDuration: avgDuration,
		// 		depth: depth,
		// 		percentage: percentage,
		// 		gapPercent: gapPercent,
		// 		totalPatients: totalPatients,
		// 		rectXOffset: rectXOffset,
		// 		rectYOffset: rectYOffset,
		// 		index: i
		// 	}
		// 	return obj;
		// });
		// studyTitle
		// 	.style({
		// 		'font-size': '18px'
		// 	})
		// 	.text('Atrial Fibrulation')
		// 	.transition()
		// 	.delay(250)
		// 	.duration(500)
		// 	.style('opacity', 1);
		// studyDescription
		// 	.style({
		// 		'font-size': '16px'
		// 	})
		// 	.text('Patients who have had atrial fibrulation.')
		// 	.transition()
		// 	.delay(250)
		// 	.duration(500)
		// 	.style('opacity', 1);
		// clearAll(detailsContainerInner, summaryTable, svg);
		// // drawAllDrugSummary(cohortDetailsText, flattenedDataFromRects, x);
		// _.forEach(flattenedDataFromRects, (obj, i) => {
		// 	let firstItems = _.chain(flattenedDataFromRects)
		// 		.filter(item => {
		// 			return item.rectXOffset >= obj.rectXOffset &&
		// 		   		   item.rectXOffset <= obj.rectXOffset + x(obj.patientCount)
		// 		})
		// 		.sortBy(item => item.depth)
		// 		.first()
		// 		.value();
		// });
		// const drugFilters = document.querySelectorAll('div.drug-name');
		// //TODO!!!
		// /////////////////
		// /////////////////
		// const firstOfTypeClick$ = Rx.Observable.fromEvent(firstSelector, 'click');
		// const allOfTypeClick$ = Rx.Observable.fromEvent(allSelector, 'click');
		// const typeClick$ = allOfTypeClick$.merge(firstOfTypeClick$)
		// 	.map(typeEvent => {
		// 		console.log(typeEvent);
		// 	}).subscribe();
		// const filterClick$ = Rx.Observable.fromEvent(drugFilters, 'click')
		// 	.map(ev => {
		// 		let targetText = getTargetText(ev, 1);
		// 		let fullText = getTargetText(ev, 0);
		// 		let selectedRects = _.filter(rects, rect => {
		// 			return rect.childNodes[1].textContent === targetText;
		// 		});
		// 		let selectedRectFilterJoins = selectedRects.map((selected, i) => {
		// 			let targetX = 35 + (i * 80);
		// 			let targetY = 80;
		// 			let patientCount = parseInt(selected.getAttribute('patientCount'));
		// 			let percentage = parseInt(selected.getAttribute('percentage'));
		// 			let gapPercent = parseInt(selected.getAttribute('gapPercent'));
		// 			let depth = parseInt(selected.getAttribute('depth'));
		// 			let conceptName = selected.getAttribute('conceptName');
		// 			let avgDuration = parseInt(selected.getAttribute('avgDuration'));
		// 			let rectXOffset = selected.getBoundingClientRect().left - margin.left;
		// 			let rectYOffset = selected.getBoundingClientRect().top - margin.top;
		// 			let obj = {
		// 				filterXOffset: targetX,
		// 				filterYOffset: targetY,
		// 				patientCount: patientCount,
		// 				conceptName: conceptName,
		// 				avgDuration: avgDuration,
		// 				depth: depth,
		// 				percentage: percentage,
		// 				gapPercent: gapPercent,
		// 				rectXOffset: rectXOffset,
		// 				rectYOffset: rectYOffset,
		// 				index: i
		// 			}
		// 			return obj;
		// 		});
		// 		clearAll(detailsContainerInner, summaryTable, svg);
		// 		drawSelectedDrugName(ev, summaryTable, fullText);
		// 		drawDrugSummary(ev, summaryTable, selectedRectFilterJoins);
		// 		if (false) {
		// 			_.forEach(selectedRectFilterJoins, (obj, i) => {
		// 				drawDrugTooltip(ev, detailsContainerInner, obj, i, x);
		// 				selectedRects
		// 					.map(group => group.childNodes[0])
		// 					.filter(rect => rect.getAttribute('width') !== x(obj.patientCount))
		// 					.map((rect, index) => {
		// 						fadeRectColor(rect, targetText, fullText, lightGreen, textDark, true);
		// 					});
		// 			});
		// 		} else {
		// 			let firstItemsOfTypeArr = [];
		// 			_.forEach(selectedRectFilterJoins, (obj, i) => {
		// 				let firstItem =
		// 					_.chain(selectedRectFilterJoins)
		// 						.filter((item, i) => {
		// 							return obj.rectXOffset >= item.rectXOffset && obj.rectXOffset <= item.rectXOffset + x(item.patientCount);
		// 						})
		// 						.sortBy(item => item.depth)
		// 						.first()
		// 						.value();
		// 				firstItemsOfTypeArr.push(firstItem);
		// 			});
		// 			let uniqueFirstItems = _.uniq(firstItemsOfTypeArr);
		// 			_.forEach(uniqueFirstItems, (obj, i) => {
		// 				drawDrugTooltip(ev, detailsContainerInner, obj, i, x);
		// 				selectedRects
		// 					.map(group => group.childNodes[0])
		// 					.filter(rect => rect.getAttribute('width') !== x(obj.patientCount))
		// 					.map((rect, index) => {
		// 						fadeRectColor(rect, targetText, fullText, lightGreen, textDark, true);
		// 					});
		// 			});
		// 		}
		// 	})
		// 	.subscribe();
	//Chen
	//});
	};

	function drawCohortTable(container, data, tableX) {
		var table = container.append('table').attr({
			id: 'cohort-table'
		});
		var tableRow = table.append('tr');
		drawCohortTableItems(tableRow, data, tableX);
	}

	function drawCohortTableItems(tableRow, data, tableX) {
		var values = _.values(data);
		//Chen -- test NaN
		if(!Number.isNaN(values[1]))
		{
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
	}

	function drawTable(container, data, tableX, appropriateNumberOfColumns) {
		var table = container.append('table').attr({
			id: 'summary-table'
		});
		var tableHead = table.append('tr');
		drawTableHeadItems(tableHead, appropriateNumberOfColumns);
		_.forEach(data, function (item) {
			var tableRow = table.append('tr');
			drawTableItems(tableRow, item, tableX, appropriateNumberOfColumns);
		});
	}

	function drawTableHeadItems(tableHead, appropriateNumberOfColumns) {
		var headings = function headings() {
			if (appropriateNumberOfColumns === 5) {
				return ['', 'Patient Count', 'Avg Days to Start', 'Avg Duration', 'Avg Adherence'];
			}
			if (appropriateNumberOfColumns === 8) {
				return ['', 'Patient Count', 'Avg Days to Start', 'Avg Duration', 'Avg Adherence', 'Drops', 'Switches', 'Adds'];
			}
		};
		_.forEach(headings(), function (heading) {
			tableHead.append('th').text(heading);
		});
	}

	function drawTableItems(tableRow, data, tableX, appropriateNumberOfColumns) {
		var values = _.values(data);
		_.forEach(values, function (item, index) {
			if (index < appropriateNumberOfColumns) {
				if (index === 0) {
					var cell = drawCell(item, tableRow, 'first-col');
					drawSpan(item, cell, null);
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

	function drawMedicationSvg(container, collection) {
		var data = collection.medicationsForEqualData;
		var total = _.reduce(data.counts, function (acc, curr) {
			return acc + curr;
		});
		var height = data.medications.length * 20;
		var x = d3.scale.linear().range([0, 100]).domain([0, total]);
		var svg = container.append('svg').attr({
			class: 'medication-svg',
			width: 300,
			height: height
		});
		drawMedicationBars(svg, data, x);
		drawMedicationLabels(svg, data, x);
	}

	function drawMedicationBars(container, data, x) {
		var sorted = _.reverse(_.sortBy(data.counts));
		_.forEach(sorted, function (count, i) {
			var rect = container.append('rect').attr({
				class: 'table-bar',
				width: x(count),
				height: 12,
				transform: 'translate(110,' + (5 + i * 16) + ')'
			});
		});
	}

	function drawMedicationLabels(container, data, x) {
		var total = _.reduce(data.counts, function (acc, curr) {
			return acc + curr;
		});
		var sortedNums = _.reverse(_.sortBy(data.counts));
		var sortedMeds = _.sortBy(data.medications, data.counts);
		_.forEach(sortedNums, function (count, i) {
			var number = container.append('text').attr({
				transform: 'translate(' + (115 + x(count)) + ',' + (16 + i * 16) + ')'
			}).text(count + ' (' + formatPercent(count / total) + ')');
		});
		_.forEach(sortedMeds, function (med, i) {
			var medLabel = container.append('text').attr({
				transform: 'translate(' + 0 + ',' + (16 + i * 16) + ')'
			}).text(shortenWordByAmount(med, 4));
		});
	}

	function findMaxNumberOfDrugs(data) {
		var newArr = [];
		_.map(data.children, function (item) {
			return getAllPropertyValues(item, newArr, 'uniqueConceptsArray');
		});

		var value = _.chain(newArr).map(function (item) {
			//Chen
			//return item.length;
			if(item !== null && item !== undefined){
				return item.length;
			}
		}).sortBy().last().value();
		return value;
	}

	function processValuesAccordingToFunctionPassedIn(data, totalPatients, lengthOfInterest, getFunc, label) {
		var allRelevantData = getAllRelevantData(data, getFunc, lengthOfInterest);
		var flattenedRelevantData = getFlattenedReducedValues(allRelevantData);
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
			var conceptChildrenOfDrugType = item.children;
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
				concepts: item.concepts
			};
		});
		return {
			numberOfDrugs: function numberOfDrugs() {
				if (lengthOfInterest === 1) return label + ' ' + lengthOfInterest + ' Drug Regimen';else return label + ' ' + lengthOfInterest + ' Drug Regimen';
			},
			patientCount: [innerTotalPatientCount, formatPercent(innerTotalPatientCount / totalPatients)],
			avgTimeToStart: formatNumber(daysFromCohortStart / innerTotalPatientCount),
			avgDuration: formatNumber(avgDuration / innerTotalPatientCount),
			avgGapPercent: formatPercent(1 - avgGapPercent / innerTotalPatientCount / 100),
			medications: medications
		};
	}

	function processMedicationsAccordingToFunctionPassedIn(data, totalPatients, lengthOfInterest, getFunc, label) {
		var flattenedRelevantData = getFlattenedReducedValues(getAllRelevantData(data, getFunc, lengthOfInterest));
		var medications = _.map(flattenedRelevantData, function (item) {
			return item.conceptName;
		});
		var counts = _.map(flattenedRelevantData, function (item) {
			return item.patientCount;
		});
		return {
			medications: medications,
			counts: counts
		};
	}

	function getAllRelevantData(data, getFunc, lengthOfInterest) {
		var allRelevantData = _.chain(data.children).map(function (obj) {
			return getFunc(obj, 'uniqueConceptsArray', lengthOfInterest);
		}).map(function (arr) {
			return arr[0];
		}).filter(function (item) {
			return item !== undefined;
		}).value();
		return allRelevantData;
	}

	function getFlattenedReducedValues(data) {
		var flattenedRelevantData = _.chain(data).groupBy('conceptName').map(function (arr) {
			return _.map(arr, function (item) {
				return {
					conceptName: item.conceptName,
					patientCount: parseInt(item.patientCount),
					avgTimeToStart: parseInt(item.daysFromCohortStart),
					avgDuration: parseInt(item.avgDuration),
					avgGapPercent: 1 - item.gapPercent / 100,
					children: item.children,
					concepts: item.concepts
				};
			});
		}).map(function (arr) {
			return _.map(arr, function (obj) {
				return _.values(obj);
			});
		}).map(function (arr) {
			return _.unzip(arr);
		}).map(function (arr) {
			return _.zipObject(['conceptName', 'patientCount', 'avgTimeToStart', 'avgDuration', 'avgGapPercent', 'children', 'concepts'], _.map(arr, function (innerArr, index) {
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
			}));
		}).value();
		return flattenedRelevantData;
	}

	function getValuesGreaterThanOrEqualToX(obj, property, numberOfInterest) {
		var newArr = [];
		if (Array.isArray(obj)) {
			_.forEach(obj, function (item) {
				if (item[property].length >= numberOfInterest) {
					return newArr.concat(item);
				} else {
					getValuesGreaterThanOrEqualToX(item, property, numberOfInterest);
				}
			});
		} else {
			if (obj[property].length >= numberOfInterest) {
				return newArr.concat(obj);
			} else {
				_.forEach(obj.children, function (child) {
					if (child[property].length >= numberOfInterest) {
						return newArr.concat(child);
					} else {
						getValuesGreaterThanOrEqualToX(child, property, numberOfInterest);
					}
				});
			}
		}
		return newArr;
	}

	function getValuesEqualToX(obj, property, numberOfInterest) {
		var newArr = [];
		if (Array.isArray(obj)) {
			_.forEach(obj, function (item) {
				if (item[property].length === numberOfInterest) {
					return newArr.concat(item);
				} else {
					getValuesEqualToX(item, property, numberOfInterest);
				}
			});
		} else {
			if (obj[property].length === numberOfInterest) {
				return newArr.concat(obj);
			} else {
				_.forEach(obj.children, function (child) {
					if (child[property].length === numberOfInterest) {
						return newArr.concat(child);
					} else {
						getValuesEqualToX(child, property, numberOfInterest);
					}
				});
			}
		}
		return newArr;
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

	function getAll(obj, newArr) {
		if (Array.isArray(obj)) {
			obj.forEach(function (item) {
				if (!('children' in item)) {
					newArr.push(item);
				} else {
					item.children.forEach(function (child) {
						getAll(child, newArr);
					});
					newArr.push(item);
				}
			});
		} else {
			if (!('children' in obj)) {
				newArr.push(obj);
			} else {
				obj.children.forEach(function (child) {
					getAll(child, newArr);
				});
				newArr.push(obj);
			}
		}
		return newArr;
	}

	function getFirsts(obj, newArr, property) {
		if (!('children' in obj)) {
			newArr.push(obj[property]);
		} else {
			newArr.push(obj[property]);
		}
		return newArr;
	}

	function addUpFromArr(allItems) {
		var total = allItems.map(function (arr) {
			var totalFromArr = arr.reduce(function (acc, val) {
				return acc + val;
			});
			return totalFromArr;
		});
		return total;
	}

	//Chen -- add _typeof as param
	function sendDataToTree(data, totalPatients) {
		return data['children'].map(function (group, groupIndex) {
			//Chen -- add _typeof as param
			//var runningPatientTotal = getRunningTotal(group, data, groupIndex, 0);
			var runningPatientTotal = getRunningTotal(group, data, groupIndex, 0);
			var timeOffset = 0;
			var depth = 0;
			return makeObjectsWithRunningExtras(group, group, groupIndex, totalPatients, runningPatientTotal, timeOffset, depth);
		});
	}

	//Chen -- add _typeof as param
	function makeObjectsWithRunningExtras(obj, parent, objIndex, totalPatients, runningPatientTotal, timeOffset, depth) {
		runningPatientTotal = obj === parent ? runningPatientTotal : getRunningTotal(obj, parent, objIndex, runningPatientTotal);
		timeOffset = obj === parent ? 0 : timeOffset += 50; // exchange 50 with parent.avgDuration
		depth = obj === parent ? depth : depth += 1;
		if (Array.isArray(obj)) {
			obj.forEach(function (item, itemIndex) {
				if (!('children' in item)) {
					return returnObjectWithRunningExtras(item, parent, itemIndex, totalPatients, runningPatientTotal, timeOffset, depth);
				} else {
					item.children.forEach(function (child, childIndex) {
						makeObjectsWithRunningExtras(item.children, item, childIndex, totalPatients, runningPatientTotal, timeOffset, depth);
					});
					return returnObjectWithRunningExtras(item, parent, itemIndex, totalPatients, runningPatientTotal, timeOffset, depth);
				}
			});
		} else {
			if (!('children' in obj)) {
				return returnObjectWithRunningExtras(obj, parent, objIndex, totalPatients, runningPatientTotal, timeOffset, depth);
			} else {
				obj.children.forEach(function (child, childIndex) {
					makeObjectsWithRunningExtras(child, obj, childIndex, totalPatients, runningPatientTotal, timeOffset, depth);
				});
				return returnObjectWithRunningExtras(obj, parent, objIndex, totalPatients, runningPatientTotal, timeOffset, depth);
			}
		}
	}

	function returnObjectWithRunningExtras(obj, parent, objIndex, totalPatients, runningPatientTotal, timeOffset, depth) {
		return {
			obj: obj,
			parent: parent,
			objIndex: objIndex,
			totalPatients: totalPatients,
			runningPatientTotal: runningPatientTotal,
			timeOffset: timeOffset,
			depth: depth
		};
	}

	//Chen - add _typeof as param
	//function getRunningTotal(obj, parent, objIndex, runningPatientTotal) {
	function getRunningTotal(obj, parent, objIndex, runningPatientTotal) {
		if (objIndex === 0) {
			return runningPatientTotal;
		} else {
			var _ret2 = function () {
				var arr = [];
				parent.children.map(function (sibling, siblingIndex) {
					if (siblingIndex < objIndex) {
						arr.push(sibling.patientCount);
					}
				});
				var total = arr.reduce(function (acc, val) {
					return acc + val;
				}, 0);
				return {
					v: runningPatientTotal += total
				};
			}();

			if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
		}
	}

	function makeX(totalPatients, barMaxWidth) {
		return d3.scale.linear().range([0, barMaxWidth]).domain([0, totalPatients]);
	}

	// function drawBar(item, parent, itemIndex, totalPatients, runningPatientTotal, timeOffset, depth, x) {
//	 	let maxHeight = innerHeight;
//	 	let percentage = item === parent ? formatPercent(item.patientCount/totalPatients) : formatPercent(item.patientCount/parent.patientCount);
//	 	let g = drugBarsZone.append('g')
//	 		.attr({
//	 			patientCount: item.patientCount,
//	 			avgDuration: item.avgDuration,
//	 			conceptName: item.conceptName,
//	 			percentage: percentage,
//	 			depth: depth,
//	 			gapPercent: item.gapPercent,
//	 			daysFromCohortStart: item.daysFromCohortStart,
//	 			totalPatients: totalPatients,
//	 			class: 'med-group',
//	 			transform: 'translate(' + x(runningPatientTotal) + ', ' + timeOffset + ')' // exchange timeOffset with y(timeOffset)
//	 		});
//	 	let rect = g.append('rect')
//	 		.attr({
//	 			class: 'med',
//	 			width: x(item.patientCount),
//	 			height: 50, //y(item.avgDuration)
//	 			patientCount: item.patientCount,
//	 			avgDuration: item.avgDuration,
//	 			conceptName: item.conceptName,
//	 			percentage: percentage,
//	 			daysFromCohortStart: item.daysFromCohortStart,
//	 			depth: depth,
//	 			totalPatients: totalPatients,
//	 			gapPercent: item.gapPercent
//	 		})
//	 		.style({
//	 			fill: white,
//	 			stroke: lightGrey,
//	 			overflow: 'hidden',
//	 			'shape-rendering': 'crispEdges'
//	 		});
//	 	let rectWidth = rect.attr('width');
//	 	let rectHeight = rect.attr('height');
//	 	let labelValue = shortenWordByAmount(item.conceptName, 2);
//	 	let minRectWidthForLabel = labelValue.length * 5.5 + 4;
//	 	let minRectHeightForLabel = 15;
//	 	let label = g.append('text')
//	 		.attr({
//	 			class: 'label',
//	 			transform: () => {
//	 				if (rectWidth < minRectWidthForLabel || rectHeight < minRectHeightForLabel) {
//	 					return 'scale(0)';
//	 				}
//	 				if (rectWidth >= minRectWidthForLabel) {
//	 					return 'translate(3, 10)';
//	 				}
//	 			}
//	 		})
//	 		.style({
//	 			'font-size': '10px',
//	 			fill: textDark
//	 		})
//	 		.text(() => {
//	 			return labelValue;
//	 		});
//	 	let labelTransformValue = label.attr('transform');
//	 	let minRectHeightForPercentage = 22;
//	 	let minRectWidthForPercentage = rectHeight < minRectHeightForPercentage ? minRectWidthForLabel + 44 : 20;
//	 	let patientPercentage = g.append('text')
//	 		.attr({
//	 			transform: () => {
//	 				// don't show if the label isn't shown.
//	 				// first, do the same check we did for the label
//	 				if (rectWidth < minRectWidthForLabel || rectHeight < minRectHeightForLabel) {
//	 					return 'scale(0)';
//	 				} else if (rectHeight >= minRectHeightForPercentage && rectWidth > 23) {
//	 					return 'translate(3, 20)';
//	 				} else if (rectHeight < minRectHeightForPercentage && rectWidth >= minRectWidthForPercentage) {
//	 					return 'translate(' + (minRectWidthForLabel + 6) + ', 10)';
//	 				} else {
//	 					return 'scale(0)';
//	 				}
//	 			}
//	 		})
//	 		.style({
//	 			'font-size': '9px',
//	 			fill: textDark
//	 		})
//	 		.text(percentage);

	// }

	// function drawDrugNames(arr, container) {
//	 	let drugName = container.selectAll('p.drug-name')
//	 		.data(arr)
//	 	  .enter().append('div')
//	 	  	.attr({
//	 	  		class: 'drug-name'
//	 	  	})
//	 	  	.style({
//	 	  		'clear': 'both',
//	 	  		'font-size': '14px',
//	 	  		'padding': '3px 6px',
//	 	  		'margin-bottom': '3px',
//	 	  		'margin-right': '5px',
//	 	  		'background': d => darkenByLength(d.length),
//	 	  		'border': d => '1px solid ' + darkenByLength(d.length),
//	 	  		'word-wrap': 'break-word'
//	 	  	});
//	 	let fullDrugName = drugName.append('span')
//	 		.attr('class', 'full-drug')
//	 		.style('color', textDark)
//	 		.text(d => d.treatment);
//	 	let drugAbbrev = drugName.append('span')
//	 		.attr('class', 'drug-abbrev')
//	 		.style({
//	 			'margin-left': '5px',
//	 			'font-style': 'italic',
//	 			'float': 'right',
//	 			color: textDark
//	 		})
//	 		.text(d => shortenWordByAmount(d.treatment, 2));
	// }

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

	// function fadeRectColor(rect, targetText, fullText, rectBackground, textColor, show) {
//	 	let length = fullText.split(',').length;	
//	 	let gElem = rect.parentNode;
//	 	rect.style.fill = darkenByLength(length);
//	 	gElem.childNodes[1].style.fill = textColor;
//	 	gElem.childNodes[2].style.fill = textColor;
	// }

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

	// function drawAllDrugSummary(container, data, x) {
//	 	let firstLines = getLineOfTherapyObj(1, data);
//	 	let firstLinesImmediateChildren = getImmediateChildrenOfGivenItemDepth(data, 1, x).filter(arr => arr.length !== 0);
//	 	let firstLinesTotal = getLineOfTherapyTotal(firstLines);
//	 	let firstLinesAvgDuration = getLineOfTherapyAvgDuration(firstLines);
//	 	let firstLinesConcepts = firstLines.map(obj => obj.conceptName.split(','));
//	 	let secondLines = getLineOfTherapyObj(2, data);
//	 	let secondLinesImmediateChildren = getImmediateChildrenOfGivenItemDepth(data, 2, x).filter(arr => arr.length !== 0);
//	 	let secondLinesTotal = getLineOfTherapyTotal(secondLines);
//	 	let secondLinesAvgDuration = getLineOfTherapyAvgDuration(secondLines);
//	 	let secondLinesConcepts = secondLines.map(obj => obj.conceptName.split(','));
//	 	let thirdLines = getLineOfTherapyObj(3, data);
//	 	let thirdLinesImmediateChildren = getImmediateChildrenOfGivenItemDepth(data, 3, x).filter(arr => arr.length !== 0);
//	 	let thirdLinesTotal = getLineOfTherapyTotal(thirdLines);
//	 	let thirdLinesAvgDuration = getLineOfTherapyAvgDuration(thirdLines);
//	 	let thirdLinesConcepts = thirdLines.map(obj => obj.conceptName.split(','));
//	 	let total = _.first(data).totalPatients;
//	 	let noTherapies = total - firstLinesTotal;
//	 	let dataForBarChart = [
//	 		{
//	 			'lineNumber': 0,
//	 			'total': noTherapies,
//	 			'lineChildrenActions': null
//	 		}, {
//	 			'lineNumber': 1,
//	 			'total': firstLinesTotal,
//	 			'lineChildrenActions': getLineChildrenActions(firstLinesImmediateChildren, firstLinesConcepts, firstLinesAvgDuration, firstLinesTotal, total)
//	 		}, {
//	 			'lineNumber': 2,
//	 			'total': secondLinesTotal,
//	 			'lineChildrenActions': getLineChildrenActions(secondLinesImmediateChildren, secondLinesConcepts, secondLinesAvgDuration, secondLinesTotal, total)
//	 		}, {
//	 			'lineNumber': 3,
//	 			'total': thirdLinesTotal,
//	 			'lineChildrenActions': getLineChildrenActions(thirdLinesImmediateChildren, thirdLinesConcepts, thirdLinesAvgDuration, thirdLinesTotal, total)
//	 		}
//	 	];
//	 	drawCohortBars(dataForBarChart);
	// }

	// function getLineChildrenActions(linesImmediateChildren, linesConcepts, linesAvgDuration, linesTotal, total) {
//	 	let linesImmediateChildrenMoves =
//	 		linesImmediateChildren.map(arr => {
//	 			return arr.map(obj => {
//	 				let conceptNames = obj.concept.conceptName.split(',');
//	 				let childNames = obj.child.conceptName.split(',');
//	 				let uniqueAndOld = _.groupBy(
//	 							_.concat(conceptNames, childNames)
//	 						);
//	 				return _.values(uniqueAndOld).map(inner => {
//	 					console.log(conceptNames.length, childNames.length, inner)
//	 					if (conceptNames.length > childNames.length)
//	 						return {
//	 							obj: obj,
//	 							status: 'dropped'
//	 						};
//	 					if (conceptNames.length < childNames.length)
//	 						return {
//	 							obj: obj,
//	 							status: 'added'
//	 						};
//	 					if (conceptNames.length === childNames.length)
//	 						return {
//	 							obj: obj,
//	 							status: 'switched'
//	 						};
//	 				});
//	 			})
//	 			.filter(val => val !== undefined);
//	 		});
//	 	let flattenedLine = _.flattenDeep(linesImmediateChildrenMoves);
//	 	let linesImmediateChildrenDrugsAdded = _.reduce(_.map(_.uniq(_.map(_.filter(flattenedLine, item => item.status === 'added'), obj => obj.obj.child)), concept => concept.patientCount), (acc, curr) => acc + curr);
//	 	let linesImmediateChildrenDrugsDropped = _.reduce(_.map(_.uniq(_.map(_.filter(flattenedLine, item => item.status === 'dropped'), obj => obj.obj.child)), concept => concept.patientCount), (acc, curr) => acc + curr);
//	 	let linesImmediateChildrenDrugsSwitches = _.reduce(_.map(_.uniq(_.map(_.filter(flattenedLine, item => item.status === 'switched'), obj => obj.obj.child)), concept => concept.patientCount), (acc, curr) => acc + curr);
//	 	return {
//	 		augments: linesImmediateChildrenDrugsAdded,
//	 		drops: linesImmediateChildrenDrugsDropped,
//	 		switches: linesImmediateChildrenDrugsSwitches
//	 	}
	// }

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

	// function drawSelectedDrugName(ev, container, data) {
//	 	container.append('span')
//	 		.attr({
//	 			transform: 'translate(10, 32)',
//	 			class: 'drug-name'
//	 		})
//	 		.style({
//	 			opacity: 0,
//	 			'font-size': '15px',
//	 			'font-weight': 'bold',
//	 			fill: textDark
//	 		})
//	 		.text(data)
//	 		.transition()
//	 		.delay(250)
//	 		.duration(500)
//	 		.style('opacity', 1);
	// }

	// function drawDrugSummary(ev, container, data) {
//	 	let totalPatientsOnTherapy = data
//	 		.map(obj => obj.patientCount)
//	 		.reduce((acc, curr) => acc + curr, 0);
//	 	container.append('br');
//	 	container.append('span')
//	 		.style({
//	 			'margin-top': '15px',
//	 			opacity: 0
//	 		})
//	 		.text('Total patients: ' + totalPatientsOnTherapy)
//	 		.transition()
//	 		.delay(250)
//	 		.duration(500)
//	 		.style('opacity', 1);
	// }

	// function drawDrugTooltip(ev, container, data, index) {
//	 	let offset = 90;
//	 	let scrollTop = mainContainer[0][0].scrollTop;
//	 	if (ev.type === 'click') {
//	 		let tooltip = container.append('g')
//	 			.attr({
//	 				transform: () => {
//	 					if (index < 10)
//	 						return 'translate(' + (10 + (index * offset)) + ', 15)'
//	 					if (index >= 10) {
//	 						return 'translate(' + (10 + ((index - 10) * offset)) + ', 60)'
//	 					}
//	 				},
//	 				class: 'tooltip'
//	 			});
//	 		let count = tooltip.append('text')
//	 			.style({
//	 				opacity: 0,
//	 				'font-size': '10px',
//	 				fill: textDark
//	 			})
//	 			.text(
//	 				'Patients: ' + data.patientCount + '(' + data.percentage + '%)'
//	 			);
//	 		let duration = tooltip.append('text')
//	 			.attr({
//	 				transform: 'translate(0, 10)'
//	 			})
//	 			.style({
//	 				opacity: 0,
//	 				'font-size': '10px',
//	 				fill: textDark
//	 			})
//	 			.text(
//	 				'Duration: ' + data.avgDuration
//	 			);
//	 		let gapPercent = tooltip.append('text')
//	 			.attr({
//	 				transform: 'translate(0, 20)'
//	 			})
//	 			.style({
//	 				opacity: 0,
//	 				'font-size': '10px',
//	 				fill: textDark
//	 			})
//	 			.text(
//	 				'Gap %: ' + data.gapPercent
//	 			);
//	 		let diagonal = d3.svg.diagonal()
//	 			.source(() => {
//	 				if (index < 10) {
//	 					return {
//	 						'x': (30 + (index * offset)),
//	 						'y': data.filterYOffset - 40
//	 					};
//	 				}
//	 				if (index >= 10) {
//	 					return {
//	 						'x': (30 + ((index - 10) * offset)),
//	 						'y': data.filterYOffset + 4
//	 					};
//	 				}
//	 			}) 
//	 			.target(() => { return { 'x': data.rectXOffset - mainContainerXOffset + margin.left + 1, 'y': data.rectYOffset + scrollTop - 260 }; });
//	 		let link = svg.append('path')
//	 			.attr({
//	 				class: 'link',
//	 				d: diagonal
//	 			})
//	 			.style({
//	 				fill: 'none',
//	 				'stroke-width': 0.7,
//	 				stroke: 'hsla(0, 0%, 0%, 0.3)',
//	 				opacity: 0
//	 			});
//	 		tooltip.on('mouseover', function() {
//	 				return link.transition()
//	 					.duration(500)
//	 					.style('stroke-width', 3)
//	 			});
//	 		tooltip.on('mouseout', function() {
//	 				return link.transition()
//	 					.duration(500)
//	 					.style('stroke-width', 0.7)
//	 			});
//	 		animateIn(count);
//	 		animateIn(duration);
//	 		animateIn(link);
//	 		animateIn(gapPercent);
//	 	}
	// }

	// function animateIn(container) {
//	 	container.transition()
//	 		.delay(250)
//	 		.duration(500)
//	 		.style('opacity', 1);
	// }
	
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