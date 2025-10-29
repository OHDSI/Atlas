let exceptionUtils;

beforeAll(async () => {
	exceptionUtils = await requireAmd(['utils/ExceptionUtils']);
});

describe('ExceptionUtils', () => {
	test('translates 403 errors into a permission message', () => {
		expect(exceptionUtils.translateException({ status: 403 })).toBe('You have insufficient permissions!');
	});

	test('translates other errors into a generic message', () => {
		expect(exceptionUtils.translateException({ status: 500 })).toBe('Oops, Something went wrong!');
	});

	test('extracts messages from server payloads', () => {
		const payload = { data: { payload: { message: 'Something broke' } } };
		expect(exceptionUtils.extractServerMessage(payload)).toBe('Something broke');
	});

	test('falls back to default server message when payload missing', () => {
		expect(exceptionUtils.extractServerMessage({})).toBe('Error! Please see server logs for details.');
	});
});
