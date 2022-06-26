
/**
 * Creates a hidden input element.
 * @param {string} name Name of the input element.
 * @param {string} value Value of the input element.
 */
export function createHiddenInput(name, value) {
	const input = document.createElement('input');
	input.setAttribute('type', 'hidden');
	input.name = name;
	input.value = value;
	return input;
}

/**
 * Creates a form with hidden inputs for the given data.
 * @param {FormDataRecord} data Record with one or multiple values for each key.
 */
export function createHiddenForm(data) {
	const form = document.createElement('form');
	form.append(...
		Object.entries(data).flatMap(([key, value]) => {
			if (Array.isArray(value)) {
				return value.map((singleValue) => createHiddenInput(key, singleValue));
			}
			return createHiddenInput(key, value);
		})
	);
	return form;
}
