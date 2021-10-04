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

/**
 * Returns a reference to the first DOM element with the specified value of the ID attribute.
 * @param {string} elementId String that specifies the ID value.
 */
export function dom(elementId) {
	return document.getElementById(elementId);
}

/**
 * Returns the first element that is a descendant of node that matches selectors.
 * @param {string} selectors 
 * @param {ParentNode} node 
 */
export function qs(selectors, node = document) {
	return node.querySelector(selectors);
}

/**
 * Returns all element descendants of node that match selectors.
 * @param {string} selectors 
 * @param {ParentNode} node 
 */
export function qsa(selectors, node = document) {
	return node.querySelectorAll(selectors);
}

export default {
	css: injectStylesheet,
	el: createElement,
	id: dom,
	qs,
	qsa,
}
