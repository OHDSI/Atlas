define(
    (require, exports) => {
        const apiPaths = {
            downloadShiny: (id, sourceKey) => `shiny/download/cohort_characterization/${id}/${sourceKey}`,
            publishShiny: (id, sourceKey) => `shiny/publish/cohort_characterization/${id}/${sourceKey}`,
        };
        return {
            apiPaths
        };
    }
);