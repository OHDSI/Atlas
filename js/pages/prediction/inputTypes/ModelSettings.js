define(function (require, exports) {

	var NaiveBayes = require("./modelSettings/NaiveBayes");
	var RandomForest = require("./modelSettings/RandomForest");
	var MultilayerPerceptionModel = require("./modelSettings/MultilayerPerceptionModel");
	var KNearestNeighbors = require("./modelSettings/KNearestNeighbors");
	var GradientBoostingMachine = require("./modelSettings/GradientBoostingMachine");
	var DecisionTree = require("./modelSettings/DecisionTree");
	var AdaBoost = require("./modelSettings/AdaBoost");
	var LassoLogisticRegression = require("./modelSettings/LassoLogisticRegression");
	
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
                return {
                    NaiveBayes: new NaiveBayes()
                };
            },
        },
        {
            name: 'Random Forest',
            action: () => {
                return {
                    RandomForest: new RandomForest()
                };
            },
        },
        {
            name: 'Multilayer Perception Model',
            action: () => {
                return {
                    MultilayerPerceptionModel: new MultilayerPerceptionModel()
                };
            },
        },
        {
            name: 'K Nearest Neighbors',
            action: () => {
                return {
                    KNearestNeighbors: new KNearestNeighbors()
                };
            },
        },
        {
            name: 'Gradient Boosting Machine',
            action: () => {
                return {
                    GradientBoostingMachine: new GradientBoostingMachine()
                };
            },
        },
        {
            name: 'Decision Tree',
            action: () => {
                return {
                    DecisionTree: new DecisionTree()
                };
            },
        },
        {
            name: 'Ada Boost',
            action: () => {
                return {
                    AdaBoost: new AdaBoost()
                };
            },
        },
        {
            name: 'Lasso Logistic Regression',
            action: () => {
                return {
                    LassoLogisticRegression: new LassoLogisticRegression()
                };
            },
        },
    ];
    
});
