define(
  (require, exports) => {
    const apiPaths = {
      root: '/iranalysis/',
      analysis: id => `/iranalysis${id ? `/${id}` : ''}`,
      createAnalysis: () => '/iranalysis/new',
    };

    const status = {
        PENDING: 'PENDING',
        RUNNING: 'RUNNING',
        COMPLETE: 'COMPLETE',
    };

    const tabs = {
      DEFINITION: 'definition',
      CONCEPT_SETS: 'conceptsets',
      GENERATION: 'generation',
      UTILITIES: 'utilities',
    };

    const disabledReasons = {
      DIRTY: 'Save changes to generate',
      ACCESS_DENIED: 'Access denied',
    };

    function isInProgress(currentStatus) {
        return [status.PENDING, status.RUNNING].includes(currentStatus);
    }

    return {
      apiPaths,
      status,
      isInProgress,
      disabledReasons,
      tabs,
    };
  }
);