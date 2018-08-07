define([
    'text!pages/characterizations/stubs/characterization-design-data.json',
    'text!pages/characterizations/stubs/characterization-executions-data.json',
    'text!pages/characterizations/stubs/characterization-results-data.json',
    'text!pages/characterizations/stubs/characterization-export-data.json',
], function (
    characterizationDesignData,
    executionsData,
    characterizationResultsData,
    characterizationExportData
) {
    function loadCharacterizationDesign() {
        return new Promise(resolve => {
            setTimeout(
                () => {
                    resolve(JSON.parse(characterizationDesignData));
                },
                2000
            );
        });
    }

    function loadCharacterizationExecutions() {
        return new Promise(resolve => {
            setTimeout(
                () => {
                    const executions = JSON.parse(executionsData);
                    resolve(executions.executionGroups);
                },
                2000
            );
        });
    }

    function loadExecutionDesign() {
        return new Promise(resolve => {
            setTimeout(
                () => {
                    const characterizationExportJson = JSON.parse(characterizationExportData);
                    resolve(characterizationExportJson);
                },
                2000
            );
        });
    }

    function loadCharacterizationResults() {
        return new Promise(resolve => {
            setTimeout(
                () => {
                    const characterizationResults = JSON.parse(characterizationResultsData);
                    resolve(characterizationResults);
                },
                2000
            );
        });
    }

    function loadCharacterizationExportJson() {
        return new Promise(resolve => {
            setTimeout(
                () => {
                    const characterizationExportJson = JSON.parse(characterizationExportData);
                    resolve(characterizationExportJson);
                },
                2000
            );
        });
    }

    return {
        loadCharacterizationDesign,
        loadCharacterizationExecutions,
        loadExecutionDesign,
        loadCharacterizationResults,
        loadCharacterizationExportJson,
    };
});
