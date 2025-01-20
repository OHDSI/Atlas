define([
    'knockout',
    'text!./snapshot-lock-modal.html',
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'services/AuthAPI',
    'services/SourceAPI',
    'services/ConceptSet',
    'atlas-state',
    'less!./snapshot-lock-modal.less',
    'databindings',
], function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind,
    authApi,
    sourceApi,
    conceptSetService,
    sharedState,
) {
    class SnapshotLockModal extends AutoBind(Component) {
        constructor(params) {
            super(params);
            this.isModalShown = params.isModalShown;
            this.isLocked = params.isLocked;
            this.takeSnapshotWhenUnlocking = ko.observable(false);
            this.currentConceptSetId = params.currentConceptSetId;
            this.currentVocabularyVersion = params.currentVocabularyVersion;
            this.currentVocabularySchema = ko.observable();
            this.snapshotDescriptionMessage = ko.observable('');
            this.canExecuteActions = ko.pureComputed(() => {
                const hasSnapshotDesc = this.snapshotDescriptionMessage().trim().length > 0;
                return hasSnapshotDesc;
            });
            this.fetchAndSetVocabularySchema();
        }

        async fetchAndSetVocabularySchema() {
            try {
                const source = await sourceApi.getSourceInfo(sharedState.sourceKeyOfVocabUrl());
                this.processSourceData(source);
            } catch (error) {
                console.error(`Error fetching source information: ${error}`);
                this.currentVocabularySchema(undefined);
            }
        }

        processSourceData(source) {
            if (!source || !source.daimons) {
                this.currentVocabularySchema(undefined);
            } else {
                const vocabularyDaimon = source.daimons.find(daimon => daimon.daimonType === 'Vocabulary');
                this.currentVocabularySchema(vocabularyDaimon ? vocabularyDaimon.tableQualifier : undefined);
            }
        }


        createSnapshotActionRequest(action, takeSnapshot = true) {
            return {
                sourceKey: sharedState.sourceKeyOfVocabUrl(),
                action: action,
                user: authApi.subject(),
                message: this.snapshotDescriptionMessage(),
                takeSnapshot: takeSnapshot
            };
        }

        snapshotAndLock() {
            const request = this.createSnapshotActionRequest("LOCK");
            conceptSetService.invokeConceptSetSnapshotAction(this.currentConceptSetId(), request)
                .then(() => {
                    this.isLocked(true);
                    this.snapshotDescriptionMessage("");
                    this.isModalShown(false);
                    console.log("Concept set locked and snapshot created");
                })
                .catch(error => console.error(`Error locking concept set: ${error}`));
        }

        snapshotOnly() {
            const request = this.createSnapshotActionRequest("SNAPSHOT");
            conceptSetService.invokeConceptSetSnapshotAction(this.currentConceptSetId(), request)
                .then(() => {
                    this.snapshotDescriptionMessage("");
                    console.log("Concept set snapshot created");
                    this.isModalShown(false);
                })
                .catch(error => console.error(`Error creating snapshot: ${error}`));
        }

        unlockConceptSet(takeSnapshot) {
            const request = this.createSnapshotActionRequest("UNLOCK", takeSnapshot);
            conceptSetService.invokeConceptSetSnapshotAction(this.currentConceptSetId(), request)
                .then(() => {
                    this.isLocked(false);
                    this.snapshotDescriptionMessage("");
                    this.isModalShown(false);
                    console.log("Concept set unlocked");
                })
                .catch(error => console.error(`Error unlocking concept set: ${error}`));
        }
    }

    return commonUtils.build('snapshot-lock-modal', SnapshotLockModal, view);
});