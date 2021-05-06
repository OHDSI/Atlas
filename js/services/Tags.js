define(function (require) {

    const ko = require('knockout');
    const config = require('appConfig');
    const httpService = require('services/http');

    const ASSET_TYPE = {
        COHORT_DEFINITION: 'cohortdefinition',
        CONCEPT_SET: 'conseptset',
        COHORT_CHARACTERIZATION: 'cohortcharacterization',
        PATHWAY_ANALYSIS: 'pathway',
        INCIDENCE_RATE: 'ir',
        ESTIMATION: 'ple',
        PREDICTION: 'plp'
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

    function decorateComponent(component, { assetTypeGetter, assetGetter, addTagToAsset, removeTagFromAsset }) {

        component.isTagsModalShown = ko.observable(false);

        component.tagsList = () => {
            const tags = ko.unwrap(assetGetter().tags);
            return tags && tags.filter(t => t.groups && t.groups.length > 0)
                .sort((t1, t2) => t1.groups[0].id - t2.groups[0].id);
        }

        component.tagNamesList = () => {
            const tags = component.tagsList();
            return tags; // && tags.map(t => t.groups[0] + ': ' + t.name);
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
            return assignTag(assetTypeGetter(), assetGetter().id(), tag.id).then(() => {
                addTagToAsset(tag);
            });
        };

        component.unassignTag = (tag) => {
            return unassignTag(assetTypeGetter(), assetGetter().id(), tag.id).then(() => {
                removeTagFromAsset(tag);
            });
        };

        component.loadTagsSuggestions = (searchStr) => {
            return loadTagsSuggestions(searchStr);
        };

        component.loadAvailableTags = () => {
            return loadAvailableTags();
        };
    }

    return {
        ASSET_TYPE,
        assignTag,
        unassignTag,
        loadTagsSuggestions,
        decorateComponent,
    };
});