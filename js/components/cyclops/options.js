define(
    (require, exports) => {
  
    const _ = require('lodash');
    var options = {};

    options.foldOptions = _.range(10,0).map(v => '' + v);
    options.initialBound = _.range(10,0).map(v => '' + v);
    options.maxBoundCount = _.range(10,0).map(v => '' + v);
    options.foldOptions = _.range(10,0).map(v => '' + v);
    options.cvRepetitions = _.range(1,11).map(v => '' + v);
    options.minCVData = _.range(100,400,100).map(v => '' + v);
    options.maxIterationOptions = ['1000', '500', '100'];
    options.toleranceOptions = ['0.000001', '0.00001', '0.0001', '0.001', '0.01', '0.1'];
    options.startingVariance = ['-1', '-0.01', '0', '0.01', '1'];
    options.tuneSwindle = _.range(10,0).map(v => '' + v);

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
