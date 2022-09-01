define(function (require) {

    const ko = require('knockout');
    const config = require('appConfig');
    const httpService = require('services/http');
    const authService = require('services/AuthAPI');

    const ASSET_TYPE = {
        COHORT_DEFINITION: 'cohortdefinition',
        CONCEPT_SET: 'conceptset',
        COHORT_CHARACTERIZATION: 'cohort-characterization',
        PATHWAY_ANALYSIS: 'pathway-analysis',
        INCIDENCE_RATE: 'ir',
        ESTIMATION: 'ple',
        PREDICTION: 'plp',
        REUSABLE: 'reusable'
    };

    async function loadTagsSuggestions(namePart) {
        const res = await httpService.doGet(config.webAPIRoot + `tag/search`, { namePart });
        return res.data;
    }

    async function loadAvailableTags() {
        const res = await httpService.doGet(config.webAPIRoot + `tag/`);
        return res.data;
    }

    function assignTag(assetType, assetId, tagId) {
        return httpService.doPost(config.webAPIRoot + `${assetType}/${assetId}/tag/`, tagId);
    }

    function unassignTag(assetType, assetId, tagId) {
        return httpService.doDelete(config.webAPIRoot + `${assetType}/${assetId}/tag/${tagId}`);
    }

    function assignProtectedTag(assetType, assetId, tagId) {
        return httpService.doPost(config.webAPIRoot + `${assetType}/${assetId}/protectedtag/`, tagId);
    }

    function unassignProtectedTag(assetType, assetId, tagId) {
        return httpService.doDelete(config.webAPIRoot + `${assetType}/${assetId}/protectedtag/${tagId}`);
    }

    function multiAssign(data) {
        return httpService.doPost(config.webAPIRoot + `tag/multiAssign`, data);
    }

    function multiUnassign(data) {
        return httpService.doPost(config.webAPIRoot + `tag/multiUnassign`, data);
    }

    function createNewTag(tag) {
        return httpService.doPost(config.webAPIRoot + `tag/`, tag);
    }

    function getTag(id) {
        return httpService.doGet(config.webAPIRoot + `tag/${id}`);
    }

    function updateTag(tag) {
        return httpService.doPut(config.webAPIRoot + `tag/${tag.id}`, tag);
    }

    function deleteTag(tag) {
        return httpService.doDelete(config.webAPIRoot + `tag/${tag.id}`);
    }

    function checkPermissionForAssignProtectedTag(assetType, assetId) {
        return authService.isPermitted(`${assetType}:${assetId}:protectedtag:post`);
    }

    function checkPermissionForUnassignProtectedTag(assetType, assetId, tagId) {
        return authService.isPermitted(`${assetType}:${assetId}:protectedtag:${tagId}:delete`);
    }

    async function getAssignmentPermissions() {
        const res = await httpService.doGet(config.webAPIRoot + `tag/assignmentPermissions`);
        return res.data;
    }

    function decorateComponent(component, { assetTypeGetter, assetGetter, addTagToAsset, removeTagFromAsset }) {

        component.isTagsModalShown = ko.observable(false);

        component.tagsList = () => {
            const tags = ko.unwrap(assetGetter().tags);
            return tags && tags.filter(t => t.groups && t.groups.length > 0)
                .sort((t1, t2) => t1.groups[0].id - t2.groups[0].id);
        }

        component.tagGroupsList = () => {
            const tags = component.tagsList();
            const tagGroups = [];
            tags.forEach(tag => {
                tag.groups.forEach(tg => tagGroups.push(tg));
            });
            return tagGroups
                .filter((tg, index, self) => self.findIndex(t => t.id === tg.id) === index)
                .sort((a, b) => a.id - b.id)
                .map((group) => {
                    return {
                        name: group.name,
                        tags: tags.filter(t => t.groups.filter(tg => tg.id === group.id).length > 0).map(t => t.name).join(', ')
                    }
                });
        }

        component.assignTag = (tag) => {
            const assignPromise = tag.permissionProtected
                ? assignProtectedTag(assetTypeGetter(), ko.unwrap(assetGetter().id), tag.id)
                : assignTag(assetTypeGetter(), ko.unwrap(assetGetter().id), tag.id);
            return assignPromise.then(() => {
                addTagToAsset(tag);
            });
        };

        component.unassignTag = (tag) => {
            const unassignPromise = tag.permissionProtected
                ? unassignProtectedTag(assetTypeGetter(), ko.unwrap(assetGetter().id), tag.id)
                : unassignTag(assetTypeGetter(), ko.unwrap(assetGetter().id), tag.id)
            return unassignPromise.then(() => {
                removeTagFromAsset(tag);
            });
        };

        component.loadTagsSuggestions = (searchStr) => {
            return loadTagsSuggestions(searchStr);
        };

        component.loadAvailableTags = () => {
            return loadAvailableTags();
        };

        component.createNewTag = (tag) => {
            return createNewTag(tag);
        };

        component.checkAssignPermission = (tag) => {
            return checkPermissionForAssignProtectedTag(assetTypeGetter(), ko.unwrap(assetGetter().id));
        }

        component.checkUnassignPermission = (tag) => {
            return checkPermissionForUnassignProtectedTag(assetTypeGetter(), ko.unwrap(assetGetter().id), tag.id);
        }
    }

    return {
        ASSET_TYPE,
        assignTag,
        unassignTag,
        loadTagsSuggestions,
        decorateComponent,
        loadAvailableTags,
        getAssignmentPermissions,
        multiAssign,
        multiUnassign,
        createNewTag,
        getTag,
        updateTag,
        deleteTag
    };
});