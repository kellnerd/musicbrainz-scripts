import { extractEntityFromURL, getEntityTooltip } from './entity.js';
import { fetchEntity } from './publicAPI.js';
import { toScalar } from '../utils/array/scalar.js';

/**
 * Creates an input element where you can paste an MBID or an MB entity URL.
 * It automatically validates the content on paste, loads the name of the entity and sets the MBID as a data attribute.
 * @param {string} id ID and name of the input element.
 * @param {MB.EntityType[]} [allowedEntityTypes] Entity types which are allowed for this input, defaults to all.
 */
export function createMBIDInput(id, allowedEntityTypes) {
	/** @type {HTMLInputElement} */
	const mbidInput = document.createElement('input');
	mbidInput.className = 'mbid';
	mbidInput.name = mbidInput.id = id;
	mbidInput.placeholder = 'MBID or MB entity URL';

	const mbidAttribute = 'data-mbid';
	const defaultEntityTypeRoute = toScalar(allowedEntityTypes) ?? 'mbid';

	mbidInput.addEventListener('input', async function () {
		// create a complete entity identifier for an MBID only input
		let entityURL = this.value.trim();
		if (entityURL.match(/^[0-9a-f-]{36}$/)) {
			entityURL = [defaultEntityTypeRoute, entityURL].join('/');
		}

		// reset previous validation results
		this.removeAttribute(mbidAttribute);
		this.classList.remove('error', 'success');
		this.title = '';

		// validate entity type and MBID
		try {
			const entity = extractEntityFromURL(entityURL);
			if (entity) {
				if (typeof allowedEntityTypes === 'undefined' || allowedEntityTypes.includes(entity.type)) {
					const result = await fetchEntity(entityURL);
					this.setAttribute(mbidAttribute, result.id);
					this.value = result.name || result.title; // releases only have a title attribute
					this.classList.add('success');
					this.title = getEntityTooltip(result);
				} else {
					throw new Error(`Entity type '${entity.type}' is not allowed`);
				}
			}
		} catch (error) {
			this.classList.add('error');
			this.title = error.message ?? error.statusText;
		}
	});

	return mbidInput;
}
