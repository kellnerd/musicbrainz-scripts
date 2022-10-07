// Adapted from https://stackoverflow.com/a/46012210

const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

/**
 * Sets the value of an input element which has been manipulated by React.
 * @param {HTMLInputElement} input 
 * @param {string} value 
 */
export function setReactInputValue(input, value) {
	nativeInputValueSetter.call(input, value);
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;

/**
 * Sets the value of a textarea input element which has been manipulated by React.
 * @param {HTMLTextAreaElement} input 
 * @param {string} value 
 */
export function setReactTextareaValue(input, value) {
	nativeTextareaValueSetter.call(input, value);
	input.dispatchEvent(new Event('input', { bubbles: true }));
}
