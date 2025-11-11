const ensureModule = (name, factory) => {
	if (!requirejsInstance.defined(name)) {
		requirejsInstance.define(name, [], factory);
	}
};

let ChartUtils;
const createModuleArray = () => {
	// Use ChartUtils itself to create an Array instance from the AMD context so instanceof checks succeed.
	const [series] = ChartUtils.mapMonthYearDataToSeries({ x: [], y: [], p: [] });
	series.values.length = 0;
	return series.values;
};

beforeAll(() => {
	ensureModule('d3', () => ({
		format: () => (value) => value,
		keys: Object.keys,
	}));

	ensureModule('lodash', () => ({
		isFinite: Number.isFinite,
	}));

	ensureModule('html2canvas', () => jest.fn(() => Promise.resolve()));
	ensureModule('file-saver', () => ({}));
	ensureModule('svgsaver', () => class MockSvgSaver {});
});

beforeAll(async () => {
	ChartUtils = await requireAmd(['utils/ChartUtils']);
});

describe('ChartUtils', () => {
	describe('mapConceptData', () => {
		test('transforms simple concept array and sorts alphabetically', () => {
			const dataset = createModuleArray();
			dataset.push(
				{ conceptId: '2', conceptName: 'Beta', countValue: '15' },
				{ conceptId: '1', conceptName: 'Alpha', countValue: '10' },
				{ conceptName: null, countValue: '5' },
			);

			const result = ChartUtils.mapConceptData(dataset);

			expect(result).toEqual([
				{ id: 1, label: 'Alpha', value: 10 },
				{ id: 2, label: 'Beta', value: 15 },
				{ id: null, label: 'NULL (empty)', value: 5 },
			]);
		});

		test('creates rows from single-value datasets', () => {
			const dataset = {
				conceptId: 7,
				conceptName: 'Solo',
				countValue: 3,
			};

			const result = ChartUtils.mapConceptData(dataset);

			expect(result).toEqual([
				{ id: 7, label: 'Solo', value: 3 },
			]);
		});
	});

	test('normalizeArray numerifies string values when requested', () => {
		const table = createModuleArray();
		table.push(
			{ a: '1', b: '2' },
			{ a: '3', b: '4' },
		);

		const normalized = ChartUtils.normalizeArray(table, true);

		expect(normalized).toEqual({
			a: [1, 3],
			b: [2, 4],
		});
	});

	test('mapMonthYearDataToSeries converts integers to chronological series', () => {
		const data = {
			x: [202201, 202112],
			y: [10, 5],
			p: [0.5, 0.25],
		};

		const [series] = ChartUtils.mapMonthYearDataToSeries(data);

		expect(series.name).toBe('All Time');
		expect(series.values).toHaveLength(2);
		expect(series.values[0].xValue).toEqual(new Date(2021, 11, 1));
		expect(series.values[0].yValue).toBe(5);
		expect(series.values[0].yPercent).toBe(0.25);
		expect(series.values[1].xValue).toEqual(new Date(2022, 0, 1));
	});

	test('buildHierarchyFromJSON constructs nested nodes honoring threshold', () => {
		const data = {
			conceptPath: ['Root||ChildA', 'Root||ChildB'],
			percentPersons: [70, 30],
			numPersons: [7, 3],
			conceptId: [1, 2],
			agg: [100, 50],
		};

		const hierarchy = ChartUtils.buildHierarchyFromJSON(data, 0.2, { name: 'agg' });

		expect(hierarchy.name).toBe('root');
		expect(hierarchy.children).toHaveLength(1);
		const root = hierarchy.children[0];
		expect(root.name).toBe('Root');
		expect(root.children).toHaveLength(2);
		expect(root.children[0]).toMatchObject({
			name: 'ChildA',
			num_persons: 7,
			agg_value: 100,
		});
	});

	test('filterByConcept returns predicate matching concept ids', () => {
		const predicate = ChartUtils.filterByConcept(99);

		expect(predicate({ conceptId: 99 })).toBe(true);
		expect(predicate({ conceptId: 1 })).toBe(false);
	});
});
