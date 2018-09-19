define(function (require, exports) {

	var NaiveBayesSettings = require("./modelSettings/NaiveBayesSettings");
	var RandomForestSettings = require("./modelSettings/RandomForestSettings");
	var MultilayerPerceptionModelSettings = require("./modelSettings/MultilayerPerceptionModelSettings");
	var KNearestNeighborsSettings = require("./modelSettings/KNearestNeighborsSettings");
	var GradientBoostingMachineSettings = require("./modelSettings/GradientBoostingMachineSettings");
	var DecisionTreeSettings = require("./modelSettings/DecisionTreeSettings");
	var AdaBoostSettings = require("./modelSettings/AdaBoostSettings");
    var LassoLogisticRegressionSettings = require("./modelSettings/LassoLogisticRegressionSettings");
    var utils = require('../utils');
	
	function GetSettingsFromObject (data)
	{
		var result;
		
		if (data.hasOwnProperty("NaiveBayesSettings")) {
			return {
				NaiveBayesSettings: new exports.NaiveBayesSettings(data.NaiveBayesSettings)
			};
        } else if (data.hasOwnProperty("RandomForestSettings")) {
			return {
				RandomForestSettings: new exports.RandomForestSettings(data.RandomForestSettings)
			};
		} else if (data.hasOwnProperty("MultilayerPerceptionModelSettings")) {
			return {
				MultilayerPerceptionModelSettings: new exports.MultilayerPerceptionModelSettings(data.MultilayerPerceptionModelSettings)
			};
		} else if (data.hasOwnProperty("KNearestNeighborsSettings")) {
			return {
				KNearestNeighborsSettings: new exports.KNearestNeighborsSettings(data.KNearestNeighborsSettings)
			};
		} else if (data.hasOwnProperty("GradientBoostingMachineSettings")) {
			return {
				GradientBoostingMachineSettings: new exports.GradientBoostingMachineSettings(data.GradientBoostingMachineSettings)
			};
		} else if (data.hasOwnProperty("DecisionTreeSettings")) {
			return {
				DecisionTreeSettings: new exports.DecisionTreeSettings(data.DecisionTreeSettings)
			};
		} else if (data.hasOwnProperty("AdaBoostSettings")) {
			return {
				AdaBoostSettings: new exports.AdaBoostSettings(data.AdaBoostSettings)
			};
		} else if (data.hasOwnProperty("LassoLogisticRegressionSettings")) {
			return {
				LassoLogisticRegressionSettings: new exports.LassoLogisticRegressionSettings(data.LassoLogisticRegressionSettings)
			};
		};	
    }
    
	
	exports.NaiveBayesSettings = NaiveBayesSettings;
	exports.RandomForestSettings = RandomForestSettings;
	exports.MultilayerPerceptionModelSettings = MultilayerPerceptionModelSettings;
	exports.KNearestNeighborsSettings = KNearestNeighborsSettings;
	exports.GradientBoostingMachineSettings = GradientBoostingMachineSettings;
	exports.DecisionTreeSettings = DecisionTreeSettings;
	exports.AdaBoostSettings = AdaBoostSettings;	
	exports.LassoLogisticRegressionSettings = LassoLogisticRegressionSettings;
	
    exports.GetSettingsFromObject = GetSettingsFromObject;

    exports.options = [
        {
            name: 'Naive Bayes',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('NaiveBayesSettings');
                return {
                    NaiveBayesSettings: new NaiveBayesSettings(defaultValues)
                };
            },
        },
        {
            name: 'Random Forest',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('RandomForestSettings');
                return {
                    RandomForestSettings: new RandomForestSettings(defaultValues)
                };
            },
        },
        {
            name: 'Multilayer Perception Model',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('MultilayerPerceptionModelSettings');
                return {
                    MultilayerPerceptionModelSettings: new MultilayerPerceptionModelSettings(defaultValues)
                };
            },
        },
        {
            name: 'K Nearest Neighbors',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('KNearestNeighborsSettings');
                return {
                    KNearestNeighborsSettings: new KNearestNeighborsSettings(defaultValues)
                };
            },
        },
        {
            name: 'Gradient Boosting Machine',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('GradientBoostingMachineSettings');
                return {
                    GradientBoostingMachineSettings: new GradientBoostingMachineSettings(defaultValues)
                };
            },
        },
        {
            name: 'Decision Tree',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('DecisionTreeSettings');
                return {
                    DecisionTreeSettings: new DecisionTreeSettings(defaultValues)
                };
            },
        },
        {
            name: 'Ada Boost',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('AdaBoostSettings');
                return {
                    AdaBoostSettings: new AdaBoostSettings(defaultValues)
                };
            },
        },
        {
            name: 'Lasso Logistic Regression',
            action: () => {
                var defaultValues = utils.getDefaultModelSettingsValueList('LassoLogisticRegressionSettings');
                return {
                    LassoLogisticRegressionSettings: new LassoLogisticRegressionSettings(defaultValues)
                };
            },
        },
    ];

    exports.defaultModelSettings = [
        {
            name: 'RandomForestSettings',
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
            name: 'NaiveBayesSettings',
            modelSettings: []
        },
        {
            name: 'MultilayerPerceptionModelSettings',
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
            name: 'KNearestNeighborsSettings',
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
            name: 'GradientBoostingMachineSettings',
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
            name: 'DecisionTreeSettings',
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
            name: 'AdaBoostSettings',
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
            name: 'LassoLogisticRegressionSettings',
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
