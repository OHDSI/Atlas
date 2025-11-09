let AutoBind;

beforeAll(async () => {
	AutoBind = await requireAmd(['utils/AutoBind']);
});

describe('AutoBind', () => {
	test('binds prototype methods to the instance context', () => {
		class Example extends AutoBind() {
			constructor() {
				super();
				this.counter = 1;
			}

			increment() {
				return ++this.counter;
			}
		}

		const instance = new Example();
		const { increment } = instance;

		expect(increment()).toBe(2);
		expect(instance.counter).toBe(2);
	});

	test('leaves non-function prototype properties untouched', () => {
		class Sample extends AutoBind() {
			constructor() {
				super();
			}

			getName() {
				return this.componentName;
			}
		}

		Sample.prototype.componentName = 'sample-component';

		const instance = new Sample();

		expect(instance.componentName).toBe('sample-component');
		expect(instance.getName()).toBe('sample-component');
	});
});
