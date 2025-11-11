const httpStub = {
	doGet: jest.fn(),
	doPost: jest.fn(),
	doDelete: jest.fn(),
};

const appConfigStub = {
	webAPIRoot: '/api/',
	userAuthenticationEnabled: true,
};

const authApiStub = {
	subject: jest.fn(() => 'owner'),
};

const defineOrReplace = (name, factory) => {
	if (requirejsInstance.defined(name)) {
		requirejsInstance.undef(name);
	}
	requirejsInstance.define(name, [], factory);
};

let permissionService;
let ko;

beforeAll(() => {
	defineOrReplace('appConfig', () => appConfigStub);
	defineOrReplace('services/http', () => httpStub);
	defineOrReplace('services/AuthAPI', () => authApiStub);
});

beforeEach(() => {
	jest.clearAllMocks();
});

beforeAll(async () => {
	[permissionService, ko] = await requireAmd(['services/Permission', 'knockout']);
});

describe('Permission service', () => {
	test('loadRoleSuggestions forwards role search term to backend', async () => {
		httpStub.doGet.mockResolvedValue({ data: ['admin'] });

		const data = await permissionService.loadRoleSuggestions('adm');

		expect(httpStub.doGet).toHaveBeenCalledWith('/api/permission/access/suggest', { roleSearch: 'adm' });
		expect(data).toEqual(['admin']);
	});

	test('loadEntityAccessList defaults perm_type to WRITE', async () => {
		httpStub.doGet.mockResolvedValue({ data: [{ id: 1 }] });

		const data = await permissionService.loadEntityAccessList('cohort', 42);

		expect(httpStub.doGet).toHaveBeenCalledWith('/api/permission/access/cohort/42/WRITE');
		expect(data).toEqual([{ id: 1 }]);
	});

	test('grantEntityAccess posts access request payload', () => {
		permissionService.grantEntityAccess('cohort', 42, 99, 'READ');

		expect(httpStub.doPost).toHaveBeenCalledWith(
			'/api/permission/access/cohort/42/role/99',
			{ accessType: 'READ' }
		);
	});

	test('revokeEntityAccess sends delete with chosen access type', () => {
		permissionService.revokeEntityAccess('cohort', 42, 99, 'CUSTOM');

		expect(httpStub.doDelete).toHaveBeenCalledWith(
			'/api/permission/access/cohort/42/role/99',
			{ accessType: 'CUSTOM' }
		);
	});

	test('decorateComponent wires owner checks and proxy methods', async () => {
		httpStub.doGet.mockResolvedValue({ data: [] });
		const component = {};
		const getters = {
			entityTypeGetter: () => 'cohort',
			entityIdGetter: () => 12,
			createdByUsernameGetter: () => 'owner',
		};

		permissionService.decorateComponent(component, getters);

		expect(component.isAccessModalShown()).toBe(false);
		expect(component.isOwner()).toBe(true);

		await component.loadAccessList('READ');
		expect(httpStub.doGet).toHaveBeenCalledWith('/api/permission/access/cohort/12/READ');

		component.grantAccess(5, 'READ');
		expect(httpStub.doPost).toHaveBeenLastCalledWith(
			'/api/permission/access/cohort/12/role/5',
			{ accessType: 'READ' }
		);

		component.revokeAccess(5, 'READ');
		expect(httpStub.doDelete).toHaveBeenLastCalledWith(
			'/api/permission/access/cohort/12/role/5',
			{ accessType: 'READ' }
		);

		await component.loadAccessRoleSuggestions('adm');
		expect(httpStub.doGet).toHaveBeenLastCalledWith('/api/permission/access/suggest', { roleSearch: 'adm' });
	});
});
