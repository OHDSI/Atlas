define(
  (require, exports) => {

    const _ = require('lodash');
    const ko = require('knockout');

    var options = {};

    options.foldOptions = _.range(10, 0).map(v => '' + v);
    options.initialBound = _.range(10, 0).map(v => '' + v);
    options.maxBoundCount = _.range(10, 0).map(v => '' + v);
    options.foldOptions = _.range(10, 0).map(v => '' + v);
    options.cvRepetitions = _.range(1, 11).map(v => '' + v);
    options.minCVData = _.range(100, 400, 100).map(v => '' + v);
    options.maxIterationOptions = ['1000', '500', '100'];
    options.toleranceOptions = ['0.000001', '0.00001', '0.0001', '0.001', '0.01', '0.1'];
    options.startingVariance = ['-1', '-0.01', '0', '0.01', '1'];
    options.tuneSwindle = _.range(10, 0).map(v => '' + v);

    options.yesNoOptions = [{
      name: ko.i18n('options.yes', 'Yes'),
      id: true,
    }, {
      name: ko.i18n('options.no', 'No'),
      id: false
    }];

    options.priorType = [{
      name: ko.i18n('components.cyclops.options.none', 'None'),
      id: 'none',
    }, {
      name: ko.i18n('components.cyclops.options.hierarchical', 'Hierarchical'),
      id: 'hierarchical'
    }, {
      name: ko.i18n('components.cyclops.options.laplace', 'Laplace'),
      id: 'laplace'
    }, {
      name: ko.i18n('components.cyclops.options.normal', 'Normal'),
      id: 'normal'
    }];

    options.cvType = [{
      name: ko.i18n('components.cyclops.options.auto', 'Auto'),
      id: 'auto'
    }, {
      name: ko.i18n('components.cyclops.options.grid', 'Grid'),
      id: 'grid'
    }];

    options.convergenceType = [{
      name: ko.i18n('components.cyclops.options.gradient', 'Gradient'),
      id: 'gradient',
    }, {
      name: ko.i18n('components.cyclops.options.mittal', 'Mittal'),
      id: 'mittal'
    }, {
      name: ko.i18n('components.cyclops.options.lange', 'Lange'),
      id: 'lange'
    }];

    options.noiseLevel = [{
      name: ko.i18n('components.cyclops.options.silent', 'Silent'),
      id: 'silent',
    }, {
      name: ko.i18n('components.cyclops.options.quiet', 'Quiet'),
      id: 'quiet'
    }, {
      name: ko.i18n('components.cyclops.options.noisy', 'Noisy'),
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
