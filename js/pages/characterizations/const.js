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
            /*
            TODO:
            Disabled until full implementation is in place
            {
                link: '#/cc/feature-analyses',
                tabLabel: 'Feature analyses',
                newEntityLabel: 'Feature analysis',
                value: featureAnalysesTab,
            },*/
        ];

        const ccGenerationStatus = {
            STARTED: 'STARTED',
            COMPLETED: 'COMPLETED',
        };

        return {
            pageTitle,
            ccGenerationStatus,
            characterizationsTab,
            featureAnalysesTab,
            gridTabs,
        };
    }
);