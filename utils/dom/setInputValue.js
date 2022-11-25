
/**
 * Sets the value of the given input and triggers the given event.
 * @param {HTMLInputElement | HTMLTextAreaElement} input 
 * @param {string} value 
 * @param {Event} event Input event, defaults to a change event.
 */
export function setInputValue(input, value, event = new Event('change')) {
	input.value = value;
	input.dispatchEvent(event);
}
