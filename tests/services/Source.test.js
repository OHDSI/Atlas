const httpStub = {
	doGet: jest.fn(),
};

const appConfigStub = {
	webAPIRoot: '/api/',
};

const defineOrReplace = (name, factory) => {
	if (requirejsInstance.defined(name)) {
		requirejsInstance.undef(name);
	}
	requirejsInstance.define(name, [], factory);
};

let sourceService;

beforeAll(() => {
	defineOrReplace('services/http', () => httpStub);
	defineOrReplace('appConfig', () => appConfigStub);
});

beforeEach(() => {
	jest.clearAllMocks();
});

beforeAll(async () => {
	sourceService = await requireAmd(['services/Source']);
});

test('loadSourceList returns sources from API response', async () => {
	httpStub.doGet.mockResolvedValue({ data: [{ sourceId: 1 }] });

	const sources = await sourceService.loadSourceList();

	expect(httpStub.doGet).toHaveBeenCalledWith('/api/source/sources');
	expect(sources).toEqual([{ sourceId: 1 }]);
});
