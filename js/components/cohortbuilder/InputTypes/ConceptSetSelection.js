define(['knockout'], function (ko) {

    function ConceptSetSelection(data, conceptSets) {
        var self = this;
        data = data || {};
        self.IsExclusion = ko.observable(data.IsExclusion);
        self.CodesetId = ko.observable(data.CodesetId);

        // set up subscription to update CodesetId if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
							self.CodesetId(null);
					}
			});
		}, null, "arrayChange");

    }

    return ConceptSetSelection;
});