/**
 * Creates a function that maps entries of an input record to different property names of the output record according
 * to the given mapping. Only properties with an existing mapping will be copied.
 * @param {Record<string,string>} mapping Maps property names of the output record to those of the input record.
 * @returns {(input:Record<string,any>)=>Record<string,any>} Mapper function.
 */
export function createRecordMapper(mapping) {
	return function (input) {
		/** @type {Record<string,any>} */
		let output = {};
		for (let outputProperty in mapping) {
			const inputProperty = mapping[outputProperty];
			const value = input[inputProperty];
			if (value !== undefined) {
				output[outputProperty] = value;
			}
		}
		return output;
	};
}
