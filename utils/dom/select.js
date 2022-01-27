
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
