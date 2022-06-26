// adapted from https://stackoverflow.com/a/25621277

/**
 * Resizes the bound element to be as tall as necessary for its content.
 * @this {HTMLElement}
 */
export function automaticHeight() {
	this.style.height = 'auto';
	this.style.height = this.scrollHeight + 'px';
}

/**
 * Resizes the bound element to be as wide as necessary for its content.
 * @this {HTMLElement} this 
 */
export function automaticWidth() {
	this.style.width = 'auto';
	this.style.width = this.scrollWidth + 10 + 'px'; // account for border and padding
}
