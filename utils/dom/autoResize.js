// adapted from https://stackoverflow.com/a/25621277

/**
 * Resizes the given element to be as tall as necessary for its content.
 * @param {HTMLElement} element 
 */
export function automaticHeight(element) {
	element.style.height = 'auto';
	element.style.height = element.scrollHeight + 'px';
}

/**
 * Resizes the given element to be as wide as necessary for its content.
 * @param {HTMLElement} element 
 */
export function automaticWidth(element) {
	element.style.width = 'auto';
	element.style.width = element.scrollWidth + 10 + 'px'; // account for border and padding
}
