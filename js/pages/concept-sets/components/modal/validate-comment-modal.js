define([
    'knockout',
    'text!./validate-comment-modal.html',
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'services/ConceptSet',
    'services/AuthAPI',
    'less!./validate-comment-modal.less',
    'databindings',
], function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind,
    conceptSetService,
    authApi,
) {
    class ValidateCommentModal extends AutoBind(Component) {
        constructor(params) {
            super(params);
            this.isModalShown = params.isModalShown;
            this.onConfirm = params.onConfirm;

            this.validationComment = ko.observable('');
            this.selectedApproverId = ko.observable(null);

            this.supportingInfo = ko.observable(params.supportingInfo || '');

            this.delegateReviewers = ko.observableArray([]);
            this.loadingReviewers = ko.observable(false);

            this.canValidate = ko.computed(() => {
                return this.validationComment() && this.validationComment().trim().length > 0;
            });

            this.isModalShown.subscribe((shown) => {
                if (shown) {
                    this.resetForm();
                    this.loadDelegateReviewers();
                }
            });
        }

        async loadDelegateReviewers() {
            this.loadingReviewers(true);
            try {
                const approvers = await conceptSetService.listApprovers('conceptset');
                const formattedApprovers = approvers.data.map(approver => ({
                    ...approver,
                    nameWithLogin: `${approver.name} (${approver.login})`,
                }));

                this.delegateReviewers(formattedApprovers);

                const currentUser = formattedApprovers.find(a => a.id === authApi.id());
                if (currentUser) {
                    this.selectedApproverId(currentUser.id);
                }
            } catch (error) {
                console.error('Failed to load delegate reviewers:', error);
                this.delegateReviewers([]);
            } finally {
                this.loadingReviewers(false);
            }
        }

        resetForm() {
            this.validationComment('');
            this.supportingInfo(null);
        }

        confirm() {
            const validationData = {
                comment: this.validationComment(),
                approverId: this.selectedApproverId(),
                supportingInfo: this.supportingInfo()
            };

            this.onConfirm(validationData);
            this.isModalShown(false);
        }

        cancel() {
            this.resetForm();
            this.isModalShown(false);
        }
    }

    return commonUtils.build('validate-comment-modal', ValidateCommentModal, view);
});