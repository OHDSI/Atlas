define(
  (require, exports) => {
    const config = require('appConfig');
    const conceptSetConstants = require('components/conceptset/const');
		
    const ViewMode = {
      EXPRESSION: conceptSetConstants.ViewMode.EXPRESSION,
      INCLUDED: conceptSetConstants.ViewMode.INCLUDED,
      SOURCECODES: conceptSetConstants.ViewMode.SOURCECODES,
      RECOMMEND: conceptSetConstants.ViewMode.RECOMMEND,
      EXPORT: conceptSetConstants.ViewMode.EXPORT,
      IMPORT: conceptSetConstants.ViewMode.IMPORT,
      EXPLORE: 'explore',
      COMPARE: 'compare',
      VERSIONS: 'versions',
      MESSAGES: 'messages',
    };
		
    const pageTitle = 'Concept Sets';
    const paths = {
      mode: (id = 0, mode = ViewMode.EXPRESSION) => { return `/conceptset/${id}/${mode}`},
      export: (id) => { return `${config.api.url}conceptset/${id}/export`},
    }
  

    const defaultConceptHierarchyRelationships = {
      childRelationships: [{
        name: 'Has descendant of',
        range: [1, 1]
      }],
      parentRelationships: [{
        name: 'Has ancestor of',
        range: [1, 1]
      }]
    };
  
    const importModes = {
      IDENTIFIERS: {
        key: 'identifiers',
        title: 'Concept Identifiers',
      },
			SOURCE_CODES: {
        key: 'source_codes',
        title: 'Source Codes'
      },
      CONCEPT_SET: {
        key: 'concept_set',
        title: 'Concept Set',
      },
    };

    const importTypes = {
      OVERWRITE: 'overwrite',
      APPEND: 'append',
    };
  
    return {
	    defaultConceptHierarchyRelationships,
      pageTitle,
      paths,
      importModes,
      importTypes,
      ViewMode,
      RESOLVE_OUT_OF_ORDER: conceptSetConstants.RESOLVE_OUT_OF_ORDER
    };
  }
);