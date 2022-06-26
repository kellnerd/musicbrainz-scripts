
/**
 * Creates a DOM element from the given HTML fragment.
 * @param {string} html HTML fragment.
 */
export function createElement(html) {
	const template = document.createElement('template');
	template.innerHTML = html;
	return template.content.firstElementChild;
}

/**
 * Creates a style element from the given CSS fragment and injects it into the document's head.
 * @param {string} css CSS fragment.
 * @param {string} userscriptName Name of the userscript, used to generate an ID for the style element.
 */
export function injectStylesheet(css, userscriptName) {
	const style = document.createElement('style');
	if (userscriptName) {
		style.id = [userscriptName, 'userscript-css'].join('-');
	}
	style.innerText = css;
	document.head.append(style);
}
