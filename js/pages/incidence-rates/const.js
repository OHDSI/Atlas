define(
  (require, exports) => {
    const apiPaths = {
      root: '/iranalysis/',
      analysis: id => `/iranalysis${typeof id !== 'undefined' ? `/${id}` : ''}`,
      createAnalysis: () => '/iranalysis/0',
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
			INVALID_TAR: 'Invalid TAR'
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