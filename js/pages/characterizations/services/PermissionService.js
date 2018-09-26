define([
    'providers/PermissionService',
    'providers/AutoBind',
], function (
    PermissionService,
    AutoBind,
) {

    class CharacterizationPermissionService extends AutoBind(PermissionService) {
        isPermittedCreateCC() {
            return this.isPermitted(`cohort-characterization:post`);
        }

        isPermittedImportCC() {
            return this.isPermitted(`cohort-characterization:import:post`);
        }

        isPermittedGetCCList() {
            return this.isPermitted(`cohort-characterization:get`);
        }

        isPermittedGetCC(id) {
            return this.isPermitted(`cohort-characterization:${id}:get`);
        }

        isPermittedUpdateCC(id) {
            return this.isPermitted(`cohort-characterization:${id}:put`);
        }

        isPermittedDeleteCC(id) {
            return this.isPermitted(`cohort-characterization:${id}:delete`);
        }

        isPermittedGetCCGenerations(id) {
            return this.isPermitted(`cohort-characterization:${id}:generation:get`);
        }

        isPermittedGenerateCC(id, sourceKey) {
            return this.isPermitted(`cohort-characterization:${id}:generation:*:post`) && this.isPermitted(`source:${sourceKey}:access`);
        }

        isPermittedGetCCGenerationResults(sourceKey) {
            return this.isPermitted(`cohort-characterization:generation:*:result:get`) && this.isPermitted(`source:${sourceKey}:access`);
        }

        isPermittedExportGenerationDesign(id) {
            return this.isPermitted(`cohort-characterization:generation:${id}:design:get`);
        }

        isPermittedExportCC(id) {
            return this.isPermitted(`cohort-characterization:${id}:export:get`);
        }
    }



    return new CharacterizationPermissionService();
});
