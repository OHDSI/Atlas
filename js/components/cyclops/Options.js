define(
    (require, exports) => {
  
    var options = {};

    options.foldOptions = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
    options.initialBound = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
    options.maxBoundCount = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
    options.foldOptions = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
    options.cvRepetitions = ['1','2','3','4','5'];
    options.minCVData = ['100', '200', '300'];
    options.maxIterationOptions = ['1000', '500', '100'];
    options.toleranceOptions = ['1000000', '500000', '100000', '50000', '10000'];
    options.startingVariance = ['-1', '0', '1', '2', '3'];

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

    options.threads = [{
		name: "Auto",
		id: -1,
    }, {
		name: "1",
		id: '1'
    }, {
		name: "2",
		id: 2
    }, {
		name: "4",
		id: 4
    }, {
        name: "8",
        id: 8
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
