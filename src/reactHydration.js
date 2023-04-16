import { waitFor } from '@kellnerd/es-utils/async/polling.js';
import { qs } from '@kellnerd/es-utils/dom/select.js';

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
	const reactRelEditor = qs('.release-relationship-editor');
	if (!reactRelEditor) return Promise.reject(new Error('Release relationship editor has not been found'));
	// wait for the loading message to disappear (takes ~1s)
	return waitFor(() => !qs('.release-relationship-editor > .loading-message'), 100);
}
