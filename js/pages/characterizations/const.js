define(
    (require, exports) => {
        const pageTitle = 'Characterizations';

        const characterizationsTab = 0;
        const featureAnalysesTab = 1;

        const gridTabs = [
            {
                link: '#/cc/characterizations',
                tabLabel: 'Characterizations',
                newEntityLabel: 'Characterization',
                value: characterizationsTab,
            },
            {
                link: '#/cc/feature-analyses',
                tabLabel: 'Feature analyses',
                newEntityLabel: 'Feature analysis',
                value: featureAnalysesTab,
            },
        ];

        const ccGenerationStatus = {
            STARTED: 'STARTED',
            COMPLETED: 'COMPLETED',
        };

        const feAnalysisTypes = {
            PRESET: 'Preset',
            CRITERIA_SET: 'Criteria set'
        };

        return {
            feAnalysisTypes,
            pageTitle,
            ccGenerationStatus,
            characterizationsTab,
            featureAnalysesTab,
            gridTabs,
        };
    }
);
