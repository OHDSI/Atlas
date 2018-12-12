define(
  (require, exports) => {
    const config = require('appConfig');

    const pageTitle = 'Concept Sets';
    const paths = {
      mode: (id = 0, mode = 'conceptset-expression') => `#/conceptset/${id}/${mode}`,
      export: id => `${config.api.url}conceptset/${id}/export`,
    };

    const defaultConceptHierarchyRelationships = {
		childRelationships: [{
			name: 'Has descendant of',
			range: [0, 1]
		}],
		parentRelationships: [{
			name: 'Has ancestor of',
			range: [0, 1]
		}]
	};

    return {
	    defaultConceptHierarchyRelationships,
      pageTitle,
      paths,
    };
  }
);