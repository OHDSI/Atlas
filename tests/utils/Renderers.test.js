let renderers;
let ko;

beforeAll(async () => {
	[renderers, ko] = await requireAmd(['utils/Renderers', 'knockout']);
});

describe('Renderers', () => {
	describe('renderCheckbox', () => {
		test('includes click binding when checkbox is interactive', () => {
			const template = renderers.renderCheckbox('isSelected');

			expect(template).toContain('click: function(d) { d.isSelected(!d.isSelected()); },');
			expect(template).toContain('css: { selected: isSelected }');
		});

		test('omits click binding when checkbox is read-only', () => {
			const template = renderers.renderCheckbox('isActive', false);

			expect(template).not.toContain('click: function');
			expect(template).toContain('css: { selected: isActive }');
		});
	});

	describe('renderConceptSetCheckbox', () => {
		test('returns interactive markup when permissions are granted', () => {
			const template = renderers.renderConceptSetCheckbox(ko.observable(true), 'isConceptSelected');

			expect(template).toContain('click: function(d) { d.isConceptSelected(!d.isConceptSelected()); },');
			expect(template).not.toContain('readonly');
		});

		test('returns readonly markup when permissions are missing or readonly flag is true', () => {
			const template = renderers.renderConceptSetCheckbox(ko.observable(false), 'isConceptSelected', true);

			expect(template).toContain('readonly');
			expect(template).not.toContain('click: function');
		});
	});
});
