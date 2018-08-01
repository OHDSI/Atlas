define(
  (require, exports) => {
    const pageTitle = 'Profiles';
    const paths = {
      source: sourceKey => `#/profiles/${sourceKey}`,
      person: (sourceKey, personId) => `#/profiles/${sourceKey}/${personId}`,
    };

    return {
      pageTitle,
      paths,
    };
  }
);