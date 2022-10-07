import { qs } from '../utils/dom/select.js';

/**
 * Runs a callback when React has finished rendering for the given element.
 * @param {Element} element
 * @param {Function} callback
 * @see https://github.com/metabrainz/musicbrainz-server/pull/2566#issuecomment-1155799353 (based on an idea by ROpdebee)
 */
export function onReactHydrated(element, callback) {
	const alreadyHydrated = Object.keys(element)
		.some((propertyName) => propertyName.startsWith('_reactListening') && element[propertyName]);

	if (alreadyHydrated) {
		callback();
	} else {
		element.addEventListener('mb-hydration', callback, { once: true });
	}
}

/** Resolves as soon as the React relationship editor is ready. */
export function readyRelationshipEditor() {
	return new Promise((resolve) => {
		const reactRelEditor = qs('.release-relationship-editor');
		if (reactRelEditor) onReactHydrated(reactRelEditor, resolve);
		else resolve(); // TODO: reject after the new React relationship editor has been deployed everywhere
	});
}
