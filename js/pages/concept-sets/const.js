define(
  (require, exports) => {
    const config = require('appConfig');

    const pageTitle = 'Concept Sets';
    const paths = {
      mode: (id = 0, mode = 'conceptset-expression') => `#/conceptset/${id}/${mode}`,
      export: id => `${config.api.url}conceptset/${id}/export`,
    };

    return {
      pageTitle,
      paths,
    };
  }
);