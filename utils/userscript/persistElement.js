import { dom } from '../dom/select.js';

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
 * @param {boolean} [checkedByDefault]
 * @returns {Promise<HTMLInputElement>}
 */
export function persistCheckbox(id, checkedByDefault) {
	return persistElement(dom(id), 'checked', 'change', checkedByDefault);
}

/**
 * Persists the state of the collapsible details container with the given ID across page loads and origins.
 * @param {string} id 
 * @param {boolean} [openByDefault]
 * @returns {Promise<HTMLDetailsElement>}
 */
export function persistDetails(id, openByDefault) {
	return persistElement(dom(id), 'open', 'toggle', openByDefault);
}

/**
 * Persists the value of the given input field across page loads and origins.
 * @param {HTMLInputElement} element 
 * @param {string} [defaultValue]
 * @returns {Promise<HTMLInputElement>}
 */
export function persistInput(element, defaultValue) {
	return persistElement(element, 'value', 'change', defaultValue);
}
