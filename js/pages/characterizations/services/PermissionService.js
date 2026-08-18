define([
    'services/AuthAPI',
], function (
    AuthAPI,
) {

    function isPermittedCreateCC() {
        return AuthAPI.isPermitted(`create:cohort-characterization`);
    }

    function isPermittedImportCC() {
        return AuthAPI.isPermitted(`create:cohort-characterization`);
    }

    function isPermittedGetCCList() {
        return true; // we do not need to restrict list opertions
    }

    var isPermittedGetCC = function(id) {
        var grant = AuthAPI.getCCGrant(id);
        return  grant.isOwner ||
            AuthAPI.isPermitted("read:cohort-characterization") ||
            AuthAPI.isPermitted("write:cohort-characterization") ||
            AuthAPI.checkAccess("READ", grant.accessTypes);
    }

    var isPermittedUpdateCC = function(id) {
        var grant = AuthAPI.getCCGrant(id);
        return  grant.isOwner ||
            AuthAPI.isPermitted("write:cohort-characterization") ||
            AuthAPI.checkAccess("WRITE", grant.accessTypes);
    }    

    function isPermittedDeleteCC(id) {
        return isPermittedUpdateCC(id);
    }

    function isPermittedListGenerations(id) {
        return true; // TODO: do we need to restrict listing generations?
    }

    function isPermittedGenerate(id, sourceKey) {
        return AuthAPI.hasSourceAccess(sourceKey, "WRITE"); // TODO: Do we need read/write checks on the design?
    }

    function isPermittedResults(sourceKey) {
        return AuthAPI.hasSourceAccess(sourceKey, "READ");
    }

    function isPermittedExportGenerationDesign(id) {
        return isPermittedGetCC(id);
    }

    function isPermittedExportCC(id) {
        return isPermittedGetCC(id);
    }

    function isPermittedCopyCC(id) {
        return isPermittedGetCC(id) && isPermittedCreateCC();
    }

    // FA Permissions

    function isPermittedGetFaList() {
        return true; // TODO: do we need perms to list assets?
    }

    function isPermittedCreateFa() {
        return AuthAPI.isPermitted(`create:feature-analysis`);
    }

    function isPermittedGetFa(id) {
        var grant = AuthAPI.getFAGrant(id);
        return  grant.isOwner ||
            AuthAPI.isPermitted("read:feature-analysis") ||
            AuthAPI.isPermitted("write:feature-analysis") ||
            AuthAPI.checkAccess("READ", grant.accessTypes);
    }

    function isPermittedUpdateFa(id) {
        var grant = AuthAPI.getFAGrant(id);
        return  grant.isOwner ||
            AuthAPI.isPermitted("write:feature-analysis") ||
            AuthAPI.checkAccess("WRITE", grant.accessTypes);
    }

    function isPermittedDeleteFa(id) {
        return isPermittedUpdateFa(id);
    }

    function isPermittedCopyFa(id) {
        return isPermittedGetFa(id) && isPermittedCreateFa();
    }

    return {
        isPermittedCreateCC,
        isPermittedImportCC,
        isPermittedGetCCList,
        isPermittedGetCC,
        isPermittedUpdateCC,
        isPermittedDeleteCC,
        isPermittedListGenerations,
        isPermittedGenerate,
        isPermittedResults,
        isPermittedExportGenerationDesign,
        isPermittedExportCC,
        isPermittedCopyCC,
        //
        isPermittedGetFaList,
        isPermittedCreateFa,
        isPermittedGetFa,
        isPermittedUpdateFa,
        isPermittedDeleteFa,
        isPermittedCopyFa,
    };
});
