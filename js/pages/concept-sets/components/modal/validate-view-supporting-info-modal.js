define([
    'knockout',
    'text!./validate-view-supporting-info-modal.html',
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'less!./validate-view-supporting-info-modal.less',
    'databindings',
], function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind,
) {
    class ValidateViewSupportingInfoModal extends AutoBind(Component) {
        constructor(params) {
            super(params);
            this.isModalShown = params.isModalShown;
            this.onRevoke = params.onRevoke;
            this.canApprove = params.canApprove || ko.observable(false);

            this.supportingInfo = ko.observable('');
            this.validationComment = ko.observable('');
            this.representativeLabel = ko.observable('');
            this.reviewer = ko.observable('');
            this.representativeNote = ko.observable('');
            this.showRepresentativeNote = ko.observable(false);

            this.revokeComment = ko.observable('');
            this.existingRevokeComment = ko.observable('');
            this.isRevoked = ko.observable(false);
            this.approvalType = ko.observable('');

            this.canRevoke = ko.computed(() => {
                return this.revokeComment() &&
                    this.revokeComment().trim().length > 0 &&
                    !this.isRevoked() &&
                    this.canApprove();
            });
    
            this.canShowRevokeInput = ko.computed(() => {
                return this.approvalType() === 'APPROVE' && 
                    !this.isRevoked() &&
                    this.canApprove();
            });

            this.selectedApprovalInfo = params.approvalInfo;
            this.currentConceptSetId = params.currentConceptSetId;

            if (params.approvalInfo) {
                if (ko.isObservable(params.approvalInfo)) {
                    params.approvalInfo.subscribe(this.updateFromApprovalInfo.bind(this));
                    if (params.approvalInfo()) {
                        this.updateFromApprovalInfo(params.approvalInfo());
                    }
                } else {
                    this.updateFromApprovalInfo(params.approvalInfo);
                }
            }
        }

        updateFromApprovalInfo(approvalInfo) {
            if (!approvalInfo) return;

            // Set approval type
            this.approvalType(approvalInfo.type || '');

            // Check if this approval has been revoked
            const hasRevokeComment = approvalInfo.revokeComment &&
                approvalInfo.revokeComment.trim().length > 0;
            this.isRevoked(approvalInfo.type === 'REVOKE' || hasRevokeComment);
            this.existingRevokeComment(approvalInfo.revokeComment || '');

            const representative = approvalInfo.representative;
            const formalApprover = approvalInfo.user;

            if (representative && formalApprover && representative.id === formalApprover.id) {
                this.representativeLabel('Reviewer');
                this.reviewer(formalApprover.name || '');
                this.showRepresentativeNote(false);
            } else if (representative && formalApprover && representative.id !== formalApprover.id) {
                this.representativeLabel('Reviewer');
                this.reviewer(formalApprover.name || '');
                this.representativeNote(`Validation action performed by <strong>${representative.name}</strong> on behalf of reviewer`);
                this.showRepresentativeNote(true);
            } else {
                this.representativeLabel('Reviewer');
                const reviewerName = representative?.name || formalApprover?.name || '';
                this.reviewer(reviewerName);
                this.showRepresentativeNote(false);
            }

            this.validationComment(approvalInfo.comment || '');

            const linkifiedInfo = this.linkifyText(approvalInfo.supportingInfo || '');
            this.supportingInfo(linkifiedInfo);
        }

        linkifyText(text) {
            if (!text) return '';
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const linkedText = text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
            return linkedText.replace(/\n/g, '<br>');
        }

        revoke() {
            if (!this.canRevoke()) return;

            if (!confirm('Are you sure you want to revoke this approval? This action cannot be undone for older versions.')) {
                return;
            }

            if (typeof this.onRevoke === 'function') {
                this.onRevoke(this.revokeComment(), this.selectedApprovalInfo());
            }
            this.close();
        }

        close() {
            this.revokeComment('');
            this.isModalShown(false);
        }
    }

    return commonUtils.build('validate-view-supporting-info-modal', ValidateViewSupportingInfoModal, view);
});