define((require, exports) => {

	require('less!./cyclops.less');
	
	const BemHelper = require('utils/BemHelper');

	var options = {};
	const bemHelper = new BemHelper('cyclops');
	options.classes = bemHelper.run.bind(bemHelper);
	
	options.foldOptions = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
	options.initialBound = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
	options.maxBoundCount = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
	options.foldOptions = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
	options.cvRepetitions = ['1', '2', '3', '4', '5'];
	options.minCVData = ['100', '200', '300'];
	options.maxIterationOptions = ['1000', '500', '100'];
	options.toleranceOptions = ['0.000001', '0.00001', '0.0001', '0.001', '0.01', '0.1'];
	options.startingVariance = ['-1', '0', '1', '2', '3'];
	options.tuneSwindle = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];

	options.yesNoOptions = [{
		name: "Yes",
		id: true,
    }, {
		name: "No",
		id: false
    }];

	options.priorType = [{
		name: "None",
		id: 'none',
    }, {
		name: "Hierarchical",
		id: 'hierarchical'
    }, {
		name: "Laplace",
		id: 'laplace'
    }, {
		name: "Normal",
		id: 'normal'
    }];

	options.cvType = [{
		name: "Auto",
		id: 'auto'
    }, {
		name: "Grid",
		id: 'grid'
    }];

	options.convergenceType = [{
		name: "Gradient",
		id: 'gradient',
    }, {
		name: "Mittal",
		id: 'mittal'
    }, {
		name: "Lange",
		id: 'lange'
    }];

	options.noiseLevel = [{
		name: "Silent",
		id: 'silent',
    }, {
		name: "Quiet",
		id: 'quiet'
    }, {
		name: "Noisy",
		id: 'noisy'
    }];

	options.selectorType = [{
		name: "byPid",
		id: "byPid"
    }, {
		name: "byRow",
		id: 'byRow'
    }, {
		name: "auto",
		id: 'auto'
    }];

	return options;
});
