const constStub = {
	generationStatuses: {
		STARTED: 'STARTED',
		RUNNING: 'RUNNING',
		COMPLETED: 'COMPLETED',
	},
	executionStatuses: {
		PENDING: 'PENDING',
		STARTED: 'STARTED',
		RUNNING: 'RUNNING',
		COMPLETED: 'COMPLETED',
	},
};

let executionUtils;
let ko;

beforeAll(() => {
	if (requirejsInstance.defined('const')) {
		requirejsInstance.undef('const');
	}

	requirejsInstance.define('const', [], () => constStub);
});

beforeAll(async () => {
	[executionUtils, ko] = await requireAmd(['utils/ExecutionUtils', 'knockout']);
	ko.i18n = jest.fn(() => () => 'Start a new execution?');
});

describe('ExecutionUtils', () => {
	describe('StartExecution', () => {
		test('rejects when no execution group is provided', async () => {
			await expect(executionUtils.StartExecution()).rejects.toBeUndefined();
		});

		test('resolves immediately when generation is not running', async () => {
			const executionGroup = { status: () => constStub.generationStatuses.COMPLETED };

			await expect(executionUtils.StartExecution(executionGroup)).resolves.toBeUndefined();
		});
	});

	describe('getExecutionGroupStatus', () => {
		test('prioritizes pending over other statuses', () => {
			const submissions = ko.observableArray([
				{ status: constStub.executionStatuses.RUNNING },
				{ status: constStub.executionStatuses.PENDING },
			]);

			expect(executionUtils.getExecutionGroupStatus(submissions)).toBe(constStub.executionStatuses.PENDING);
		});

		test('falls back to completed when no active submissions remain', () => {
			const submissions = ko.observableArray([
				{ status: constStub.executionStatuses.COMPLETED },
			]);

			expect(executionUtils.getExecutionGroupStatus(submissions)).toBe(constStub.executionStatuses.COMPLETED);
		});
	});
});
