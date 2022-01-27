import { dom } from './dom.js';

/**
 * Persists the desired attribute of the given element across page loads and origins.
 * @param {HTMLElement} element 
 * @param {keyof HTMLElement} attribute 
 * @param {keyof HTMLElementEventMap} eventType
 * @param {string|number|boolean} [defaultValue] Default value of the attribute.
 */
async function persistElement(element, attribute, eventType, defaultValue) {
	if (!element.id) {
		throw new Error('Can not persist an element without ID');
	}

	const key = ['persist', element.id, attribute].join('.');

	// initialize attribute
	const persistedValue = await GM.getValue(key, defaultValue);
	if (persistedValue) {
		element[attribute] = persistedValue;
	}

	// persist attribute once the event occurs
	element.addEventListener(eventType, () => {
		GM.setValue(key, element[attribute]);
	});

	return element;
}

/**
 * Persists the state of the checkbox with the given ID across page loads and origins.
 * @param {string} id 
 */
export function persistCheckbox(id) {
	return persistElement(dom(id), 'checked', 'change');
}

/**
 * Persists the state of the collapsible details container with the given ID across page loads and origins.
 * @param {string} id 
 */
export function persistDetails(id) {
	return persistElement(dom(id), 'open', 'toggle');
}

/**
 * Persists the value of the given input field across page loads and origins.
 * @param {HTMLInputElement} element 
 * @param {string} defaultValue
 */
export function persistInput(element, defaultValue) {
	return persistElement(element, 'value', 'change', defaultValue);
}
