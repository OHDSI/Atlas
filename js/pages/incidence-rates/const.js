define(
  (require, exports) => {
    const apiPaths = {
      analysis: id => `/iranalysis${id ? `/${id}` : ''}`,
      createAnalysis: () => '/iranalysis/new',
    };

    const status = {
        PENDING: 'PENDING',
        RUNNING: 'RUNNING',
        COMPLETE: 'COMPLETE',
    };

    function isInProgress(currentStatus) {
        return [status.PENDING, status.RUNNING].includes(currentStatus);
    }

    return {
      apiPaths,
      status,
      isInProgress,
    };
  }
);