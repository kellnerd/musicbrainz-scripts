import { extractEntityFromURL, getEntityTooltip } from './entity.js';
import { fetchEntity } from './publicAPI.js';
import { toScalar } from '../utils/array/scalar.js';
import { kebabToTitleCase } from '../utils/string/casingStyle.js';

/**
 * Creates an input element where you can paste an MBID or an MB entity URL.
 * It automatically validates the content on paste, loads the name of the entity and sets the MBID as a data attribute.
 * @param {string} id ID and name of the input element.
 * @param {CoreEntityTypeT[]} [allowedEntityTypes] Entity types which are allowed for this input, defaults to all.
 * @param {string} [initialValue] Initial value of the input element.
 */
export function createMBIDInput(id, allowedEntityTypes, initialValue) {
	/** @type {HTMLInputElement} */
	const mbidInput = document.createElement('input');
	mbidInput.className = 'mbid';
	mbidInput.name = mbidInput.id = id;
	mbidInput.placeholder = 'MBID or MB entity URL';

	const mbidAttribute = 'data-mbid';
	const defaultEntityTypeRoute = toScalar(allowedEntityTypes) ?? 'mbid';

	if (initialValue) {
		setInputValue(initialValue);
	}

	mbidInput.addEventListener('input', async function () {
		const entity = await setInputValue(this.value.trim());
		if (entity) {
			mbidInput.dispatchEvent(new CustomEvent('mbid-input', { detail: entity }));
		}
	});

	return mbidInput;

	/** @param {string} entityURL */
	async function setInputValue(entityURL) {
		// create a complete entity identifier for an MBID only input
		if (entityURL.match(/^[0-9a-f-]{36}$/)) {
			entityURL = [defaultEntityTypeRoute, entityURL].join('/');
		}

		// reset previous validation results
		mbidInput.removeAttribute(mbidAttribute);
		mbidInput.classList.remove('error', 'success');
		mbidInput.title = '';

		// validate entity type and MBID
		try {
			const entity = extractEntityFromURL(entityURL);
			if (entity) {
				if (typeof allowedEntityTypes === 'undefined' || allowedEntityTypes.includes(entity.type)) {
					const result = await fetchEntity(entityURL);
					result.type ||= kebabToTitleCase(entity.type); // fallback for missing type
					mbidInput.setAttribute(mbidAttribute, result.id);
					mbidInput.value = result.name || result.title; // releases only have a title attribute
					mbidInput.classList.add('success');
					mbidInput.title = getEntityTooltip(result);
					return result;
				} else {
					throw new Error(`Entity type '${kebabToTitleCase(entity.type)}' is not allowed`);
				}
			}
		} catch (error) {
			mbidInput.classList.add('error');
			mbidInput.title = error.message ?? error.statusText;
		}
	}
}
