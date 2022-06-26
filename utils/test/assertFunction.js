import assert from 'assert';

/**
 * Asserts that the given test function returns the expected output for each input of the given test cases.
 * @template Input
 * @template Output
 * @template Args
 * @param {(input:Input,...args:Args)=>Output} testFunction Function which should be applied to the input values.
 * @param {[Input,Output][]} testCases Array of test cases, each element should contain the input and its expected output.
 * @param  {Args} args Additional arguments for the test function.
 * @returns {number} The number of failed test cases.
 */
export function assertFunction(testFunction, testCases, ...args) {
	const totalChecks = testCases.length;
	let failures = 0;
	testCases.forEach(([input, expectedOutput]) => {
		try {
			assert.deepStrictEqual(testFunction(input, ...args), expectedOutput);
		} catch (assertionError) {
			failures++;
			console.error(assertionError.message);
		}
	});
	if (failures) {
		console.error(testFunction, `${failures} of ${totalChecks} test cases failed!`);
	} else {
		console.log(testFunction, `Successfully executed all ${totalChecks} test cases.`);
	}
	return failures;
}
