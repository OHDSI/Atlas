let BemHelper;

beforeAll(async () => {
	BemHelper = await requireAmd(['utils/BemHelper']);
});

describe('BemHelper', () => {
	test('builds block classes with modifiers and extra entries', () => {
		const helper = new BemHelper('atlas-block');

		const classes = helper.run({
			modifiers: ['active', 'wide'],
			extra: ['bg-blue'],
		});

		expect(classes).toBe('atlas-block atlas-block--active atlas-block--wide bg-blue');
	});

	test('builds element classes from positional arguments', () => {
		const helper = new BemHelper('atlas-block');

		const classes = helper.run('item', ['selected', 'highlighted'], 'is-visible');

		expect(classes).toBe('atlas-block__item atlas-block__item--selected atlas-block__item--highlighted is-visible');
	});
});
