const appConfigStub = {
	commonDataTableOptions: {
		pageLength: {
			XS: 5,
			M: 25,
		},
		lengthMenu: {
			XS: [[5, 10], ['5', '10']],
			M: [[10, 25, 50], ['10', '25', '50']],
		},
	},
};

let commonUtils;
let ko;
let appConfig;

beforeAll(() => {
	if (!requirejsInstance.defined('atlas-state')) {
		requirejsInstance.define('atlas-state', [], () => ({
			selectedConceptsIndex: {},
			localeSettings: {},
		}));
	}
	if (!requirejsInstance.defined('appConfig')) {
		requirejsInstance.define('appConfig', [], () => appConfigStub);
	}
	if (!requirejsInstance.defined('pages/Page')) {
		requirejsInstance.define('pages/Page', [], () => class MockPage {});
	}
	if (!requirejsInstance.defined('services/MomentAPI')) {
		requirejsInstance.define('services/MomentAPI', [], () => ({
			DESIGN_DATE_TIME_FORMAT: 'YYYY-MM-DD H:mm',
			formatDateTimeWithFormat: (value, format) => `${value}:${format}`,
		}));
	}
	if (!requirejsInstance.defined('const')) {
		requirejsInstance.define('const', [], () => ({
			maxEntityNameLength: 255,
		}));
	}
});

beforeAll(async () => {
	[commonUtils, ko, appConfig] = await requireAmd(['utils/CommonUtils', 'knockout', 'appConfig']);
});

describe('CommonUtils', () => {
	test('normalizeUrl combines segments without duplicate slashes', () => {
		expect(commonUtils.normalizeUrl('/path/', '/to/', 'resource')).toBe('/path/to/resource');
	});

	test('cartesian produces all permutations across multiple arrays', () => {
		const result = commonUtils.cartesian([1, 2], ['a'], ['x', 'y']);
		expect(result).toEqual([
			[1, 'a', 'x'],
			[1, 'a', 'y'],
			[2, 'a', 'x'],
			[2, 'a', 'y'],
		]);
	});

	test('escapeTooltip escapes both single and double quotes', () => {
		const escaped = commonUtils.escapeTooltip(`Bob's "quote"`);
		expect(escaped).toBe(`Bob\\'s &quot;quote&quot;`);
	});

	test('getSelectedConcepts returns copies of selected items without selection flag', () => {
		const concepts = ko.observableArray([
			{ id: 1, name: 'A', isSelected: () => true },
			{ id: 2, name: 'B', isSelected: () => false },
		]);

		const result = commonUtils.getSelectedConcepts(concepts);
		expect(result).toEqual([{ id: 1, name: 'A' }]);
		expect(result[0]).not.toHaveProperty('isSelected');
	});

	test('clearConceptsSelectionState resets observable selection flags', () => {
		const first = { id: 1, isSelected: ko.observable(true) };
		const second = { id: 2, isSelected: ko.observable(false) };
		const conceptList = ko.observableArray([first, second]);

		commonUtils.clearConceptsSelectionState(conceptList);

		expect(first.isSelected()).toBe(false);
		expect(second.isSelected()).toBe(false);
	});

	test('buildConceptSetItems merges shared options into each entry', () => {
		const options = ko.observable({
			includeDescendants: true,
			isExcluded: false,
		});
		const concepts = [
			{ conceptId: 1 },
			{ conceptId: 2 },
		];

		const items = commonUtils.buildConceptSetItems(concepts, options);

		expect(items).toEqual([
			{ concept: concepts[0], includeDescendants: true, isExcluded: false },
			{ concept: concepts[1], includeDescendants: true, isExcluded: false },
		]);
	});

	test('getTableOptions returns variant specific datatable preferences', () => {
		expect(commonUtils.getTableOptions('XS')).toEqual({
			pageLength: appConfig.commonDataTableOptions.pageLength.XS,
			lengthMenu: appConfig.commonDataTableOptions.lengthMenu.XS,
		});
	});
});
