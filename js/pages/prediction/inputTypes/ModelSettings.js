define(function (require, exports) {

	var NaiveBayes = require("./modelSettings/NaiveBayes");
	var RandomForest = require("./modelSettings/RandomForest");
	var MultilayerPerceptionModel = require("./modelSettings/MultilayerPerceptionModel");
	var KNearestNeighbors = require("./modelSettings/KNearestNeighbors");
	var GradientBoostingMachine = require("./modelSettings/GradientBoostingMachine");
	var DecisionTree = require("./modelSettings/DecisionTree");
	var AdaBoost = require("./modelSettings/AdaBoost");
    var LassoLogisticRegression = require("./modelSettings/LassoLogisticRegression");
    var utils = require('../utils');
	
	function GetSettingsFromObject (data)
	{
		var result;
		
		if (data.hasOwnProperty("NaiveBayes")) {
			return {
				NaiveBayes: new exports.NaiveBayes(data.NaiveBayes)
			};
        } else if (data.hasOwnProperty("RandomForest")) {
			return {
				RandomForest: new exports.RandomForest(data.RandomForest)
			};
		} else if (data.hasOwnProperty("MultilayerPerceptionModel")) {
			return {
				MultilayerPerceptionModel: new exports.MultilayerPerceptionModel(data.MultilayerPerceptionModel)
			};
		} else if (data.hasOwnProperty("KNearestNeighbors")) {
			return {
				KNearestNeighbors: new exports.KNearestNeighbors(data.KNearestNeighbors)
			};
		} else if (data.hasOwnProperty("GradientBoostingMachine")) {
			return {
				GradientBoostingMachine: new exports.GradientBoostingMachine(data.GradientBoostingMachine)
			};
		} else if (data.hasOwnProperty("DecisionTree")) {
			return {
				DecisionTree: new exports.DecisionTree(data.DecisionTree)
			};
		} else if (data.hasOwnProperty("AdaBoost")) {
			return {
				AdaBoost: new exports.AdaBoost(data.AdaBoost)
			};
		} else if (data.hasOwnProperty("LassoLogisticRegression")) {
			return {
				LassoLogisticRegression: new exports.LassoLogisticRegression(data.LassoLogisticRegression)
			};
		};	
    }
    
	
	exports.NaiveBayes = NaiveBayes;
	exports.RandomForest = RandomForest;
	exports.MultilayerPerceptionModel = MultilayerPerceptionModel;
	exports.KNearestNeighbors = KNearestNeighbors;
	exports.GradientBoostingMachine = GradientBoostingMachine;
	exports.DecisionTree = DecisionTree;
	exports.AdaBoost = AdaBoost;	
	exports.LassoLogisticRegression = LassoLogisticRegression;
	
    exports.GetSettingsFromObject = GetSettingsFromObject;

    exports.options = [
        {
            name: 'Naive Bayes',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('NaiveBayes');
                return {
                    NaiveBayes: new NaiveBayes(defaultValues)
                };
            },
        },
        {
            name: 'Random Forest',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('RandomForest');
                return {
                    RandomForest: new RandomForest(defaultValues)
                };
            },
        },
        {
            name: 'Multilayer Perception Model',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('MultilayerPerceptionModel');
                return {
                    MultilayerPerceptionModel: new MultilayerPerceptionModel(defaultValues)
                };
            },
        },
        {
            name: 'K Nearest Neighbors',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('KNearestNeighbors');
                return {
                    KNearestNeighbors: new KNearestNeighbors(defaultValues)
                };
            },
        },
        {
            name: 'Gradient Boosting Machine',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('GradientBoostingMachine');
                return {
                    GradientBoostingMachine: new GradientBoostingMachine(defaultValues)
                };
            },
        },
        {
            name: 'Decision Tree',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('DecisionTree');
                return {
                    DecisionTree: new DecisionTree(defaultValues)
                };
            },
        },
        {
            name: 'Ada Boost',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('AdaBoost');
                return {
                    AdaBoost: new AdaBoost(defaultValues)
                };
            },
        },
        {
            name: 'Lasso Logistic Regression',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('LassoLogisticRegression');
                return {
                    LassoLogisticRegression: new LassoLogisticRegression(defaultValues)
                };
            },
        },
    ];

    exports.defaultModelSettings = [
        {
            name: 'RandomForest',
            modelSettings: [
                {
                    setting: 'maxDepth',
                    name: 'Max depth',
                    description: 'Maximum number of interactions - a large value will lead to slow model training',
                    defaultValue: [4,10,17],
                },
                {
                    setting: 'mtries',
                    name: 'Number of tree features',
                    description: 'The number of features to include in each tree (-1 defaults to square root of total features)',
                    defaultValue: -1,
                },
                {
                    setting: 'ntrees',
                    name: 'Number of tress to build',
                    description: 'The number of trees to build',
                    defaultValue: [10, 500],
                },
                {
                    setting: 'varImp',
                    name: 'Perform an initial variable selection',
                    description: 'Perform an initial variable selection prior to fitting the model to select the useful variables',
                    defaultValue: true,
                },
            ]
        },
        {
            name: 'NaiveBayes',
            modelSettings: []
        },
        {
            name: 'MultilayerPerceptionModel',
            modelSettings: [
                {
                    setting: 'alpha',
                    name: 'Alpha',
                    description: 'The l2 regularisation',
                    defaultValue: 0.00001,
                },
                {
                    setting: 'size',
                    name: 'Number of hidden nodes',
                    description: 'The number of hidden nodes',
                    defaultValue: 4,
                },
            ]
        },
        {
            name: 'KNearestNeighbors',
            id: 4,
            modelSettings: [
                {
                    setting: 'k',
                    name: 'Number of neighbors',
                    description: 'The number of neighbors to consider',
                    defaultValue: 1000,
                },
            ]
        },
        {
            name: 'GradientBoostingMachine',
            modelSettings: [
                {
                    setting: 'learnRate',
                    name: 'Boosting learn rate',
                    description: 'The boosting learn rate',
                    defaultValue: [0.01, 0.1],
                },
                {
                    setting: 'maxDepth',
                    name: 'Maximum number of interactions',
                    description: 'Maximum number of interactions - a large value will lead to slow model training',
                    defaultValue: [4,6,17],
                },
                {
                    setting: 'minRows',
                    name: 'Minimum number of rows',
                    description: 'The minimum number of rows required at each end node of the tree',
                    defaultValue: 20,
                },
                {
                    setting: 'nthread',
                    name: 'Computer threads for computation',
                    description: 'The number of computer threads to use (how many cores do you have?)',
                    defaultValue: 20,
                },
                {
                    setting: 'ntrees',
                    name: 'Trees to build',
                    description: 'The number of trees to build',
                    defaultValue: [10, 100],
                },
                {
                    setting: 'size',
                    name: 'Number of hidden nodes',
                    description: 'The number of hidden nodes',
                    defaultValue: 'NULL',
                },
            ]
        },
        {
            name: 'DecisionTree',
            modelSettings: [
                {
                    setting: 'classWeight',
                    name: 'Class weight',
                    description: 'Class Weight',
                    defaultValue: 'None',
                },
                {
                    setting: 'maxDepth',
                    name: 'Max depth',
                    description: 'Maximum number of interactions - a large value will lead to slow model training',
                    defaultValue: 17,
                },
                {
                    setting: 'minImpurityDecrease',
                    name: 'Minimum impurity split',
                    description: 'Threshold for early stopping in tree growth. A node will split if its impurity is above the threshold, otherwise it is a leaf.',
                    defaultValue: 0.0000001,
                },
                {
                    setting: 'minSamplesLeaf',
                    name: 'Minimum samples per leaf',
                    description: 'The minimum number of samples per leaf',
                    defaultValue: 10,
                },
                {
                    setting: 'minSamplesSplit',
                    name: 'Minimum samples per split',
                    description: 'The minimum samples per split',
                    defaultValue: 2,
                },
            ]
        },
        {
            name: 'AdaBoost',
            modelSettings: [
                {
                    setting: 'learningRate',
                    name: 'Learning rate',
                    description: 'Learning rate shrinks the contribution of each classifier. There is a trade-off between learning rate and nEstimators.',
                    defaultValue: 1,
                },
                {
                    setting: 'nEstimators',
                    name: 'Maximum number of estimators',
                    description: 'The maximum number of estimators at which boosting is terminated',
                    defaultValue: 50,
                },
            ]
        },
        {
            name: 'LassoLogisticRegression',
            modelSettings: [
                {
                    setting: 'variance',
                    name: 'Starting value for the automatic lambda search',
                    description: 'A single value used as the starting value for the automatic lambda search',
                    defaultValue: 0.01,
                },
            ]
    }];
});
