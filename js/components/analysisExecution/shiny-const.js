define(
    (require, exports) => {
        const apiPaths = {
            downloadShinyCC: (id, sourceKey) => `shiny/download/cohort_characterization/${id}/${sourceKey}`,
            publishShinyCC: (id, sourceKey) => `shiny/publish/cohort_characterization/${id}/${sourceKey}`,
            downloadShinyPW: (id, sourceKey) => `shiny/download/cohort_pathway/${id}/${sourceKey}`,
            publishShinyPW: (id, sourceKey) => `shiny/publish/cohort_pathway/${id}/${sourceKey}`,
        };
        return {
            apiPaths
        };
    }
);