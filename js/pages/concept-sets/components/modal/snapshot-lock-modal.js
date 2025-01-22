define([
    'knockout',
    'text!./snapshot-lock-modal.html',
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'utils/DatatableUtils',
    'services/AuthAPI',
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
    datatableUtils,
    authApi,
    conceptSetService,
    sharedState,
) {
    class SnapshotLockModal extends AutoBind(Component) {
        constructor(params) {
            super(params);
            this.isModalShown = params.isModalShown;
            this.isLocked = params.isLocked;
            // this.isLocked = ko.observable(false);
            this.currentConceptSetId = params.currentConceptSetId;
            this.currentVocabularyVersion = params.currentVocabularyVersion;
            this.currentVocabularySchema = params.currentVocabularySchema;
            this.snapshotDescriptionMessage = ko.observable('');
           // this.unlockConfirmationMessage = ko.observable('');

            //this.sourceKey = sharedState.sourceKeyOfVocabUrl();
            this.user = ko.observable('defaultUser');
            this.vocabularyBundleName = ko.observable('defaultBundleName');
            this.vocabularyBundleSchema = ko.observable('defaultBundleSchema');
            this.vocabularyBundleVersion = ko.observable('defaultBundleVersion');
            this.conceptSetVersion = ko.observable('defaultConceptSetVersion');

            // Update the `canExecuteActions` computed to enable buttons only if text is entered
            this.canExecuteActions = ko.pureComputed(() => {
                const hasSnapshotDesc = this.snapshotDescriptionMessage().trim().length > 0;
            //    const hasUnlockConfirmation = this.unlockConfirmationMessage().trim().length > 0;
                return hasSnapshotDesc //|| hasUnlockConfirmation;  // Enable buttons if any field has text
            });
        }

        createSnapshotActionRequest(action) {
            return {
                sourceKey: sharedState.sourceKeyOfVocabUrl(),
                action: action,
                snapshotDate: (new Date()).toISOString(), // Assuming snapshot date is now
                user: this.user(),
                vocabularyBundleName: this.vocabularyBundleName(),
                vocabularyBundleSchema: this.vocabularyBundleSchema(),
                vocabularyBundleVersion: this.vocabularyBundleVersion(),
                conceptSetVersion: this.conceptSetVersion(),
                message: this.snapshotDescriptionMessage() //|| this.unlockConfirmationMessage()
            };
        }
    
        snapshotAndLock() {
            const request = this.createSnapshotActionRequest("LOCK");
            conceptSetService.invokeConceptSetSnapshotAction(this.currentConceptSetId(), request)
                .then(() => {
                    this.isLocked(true);
                    this.isModalShown(false);
                    console.log("Concept set locked and snapshot created");
                })
                .catch(error => console.error(`Error locking concept set: ${error}`));
        }
    
        snapshotOnly() {
            const request = this.createSnapshotActionRequest("SNAPSHOT");
            conceptSetService.invokeConceptSetSnapshotAction(this.currentConceptSetId(), request)
                .then(() => {
                    console.log("Concept set snapshot created");
                    this.isModalShown(false);
                })
                .catch(error => console.error(`Error creating snapshot: ${error}`));
        }
    
        unlockConceptSet() {
            const request = this.createSnapshotActionRequest("UNLOCK");
            conceptSetService.invokeConceptSetSnapshotAction(this.currentConceptSetId(), request)
                .then(() => {
                    this.isLocked(false);
                    this.isModalShown(false);
                    console.log("Concept set unlocked");
                })
                .catch(error => console.error(`Error unlocking concept set: ${error}`));
        }
    }

    return commonUtils.build('snapshot-lock-modal', SnapshotLockModal, view);
});