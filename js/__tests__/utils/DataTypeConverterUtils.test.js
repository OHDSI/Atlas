let utils;

beforeAll(async () => {
	utils = await requireAmd(['utils/DataTypeConverterUtils']);
});

describe('DataTypeConverterUtils', () => {
	test('splits comma delimited values into arrays and numbers', () => {
		expect(utils.commaDelimitedListToArray('A,B,C')).toEqual(['A', 'B', 'C']);
		expect(utils.commaDelimitedListToArray('')).toEqual([]);

		expect(utils.commaDelimitedListToNumericArray('1,2,3')).toEqual([1, 2, 3]);
	});

	test('converts comma delimited percents into normalized fractions', () => {
		expect(utils.commaDelimitedListToPercentArray('50,1,0.25')).toEqual([0.5, 0.01, 0.25]);
		expect(utils.percentArrayToCommaDelimitedList([0.5, 0.01, 2])).toBe('50,1,2');
	});

	test('converts to and from YYYYMMDD R date format', () => {
		const date = new Date(2023, 4, 7); // Month is 0-based
		expect(utils.convertToDateForR(date)).toBe('20230507');

		const converted = utils.convertFromRDateToDate('20230507');
		expect(converted.getFullYear()).toBe(2023);
		expect(converted.getMonth()).toBe(4);
		expect(converted.getDate()).toBe(7);
	});
});
