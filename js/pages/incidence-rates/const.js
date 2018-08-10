define(
  (require, exports) => {
    const apiPaths = {
      analysis: id => `#/iranalysis${id ? `/${id}` : ''}`,
      createAnalysis: () => '#/iranalysis/new',
    };

    return {
      apiPaths,
    };
  }
);