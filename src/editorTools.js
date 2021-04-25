import {
	RG_EDIT_FIELDS,
	RG_SOURCE_DATA,
} from './MBS.js';
import { flatten } from './formTools.js';

/**
 * Sends an edit request for the given release group to MBS.
 * @param {string} mbid MBID of the release group.
 * @param {Object} editData Properties of the release group and their new values.
 * @returns {Promise<boolean>}
 */
export async function editReleaseGroup(mbid, editData) {
	const editUrl = buildEditUrl('release-group', mbid);

	// build body of the edit request and preserve values of unaffected properties
	const sourceData = await fetchEditSourceData(editUrl);
	const editBody = flatten({
		'edit-release-group': {
			...parseSourceData(sourceData), // preserve old values (MBS discards some of them if they are missing)
			make_votable: 1,
			edit_note: buildEditNote(),
			...editData, // can also be used to overwrite the above defaults
		}
	}, ['secondary_type_ids']);
	console.debug(editBody);

	// submit edit request
	const response = await fetch(editUrl, {
		method: 'POST',
		body: new URLSearchParams(editBody),
	});
	if (response.redirected) {
		return true;
	} else {
		console.error(`Failed to edit '${sourceData.name}' (MBS did not redirect)`);
		return false;
	}
}

/**
 * Replaces the names of various type values by their internal IDs.
 * @param {Object} editData Edit data.
 * @returns {Object} Raw edit data.
 */
export function replaceNamesByIds(editData) {
	for (let property in editData) {
		let value = editData[property];
		if (property in RG_EDIT_FIELDS) { // known property
			const nameToId = RG_EDIT_FIELDS[property];
			if (typeof nameToId === 'object' && nameToId !== null) { // mapping exists for this property
				if (Array.isArray(value)) {
					value = value.map((value) => (nameToId[value] || value));
				} else {
					value = nameToId[value] || value; // fallback: use the (possibly numerical) value as-is
				}
			}
		} else if (typeof value === 'object' && value !== null) { // recursively scan the edit data object
			value = replaceNamesByIds(value);
		}
		editData[property] = value;
	}
	return editData;
}

/**
 * Builds an edit note for the given message, including information about the active userscript.
 * @param {string} message Edit note message (optional).
 * @returns {string}
 */
export function buildEditNote(message = '') {
	let scriptInfo = '';
	if (typeof GM_info !== 'undefined') {
		scriptInfo = `${GM_info.script.name} (${GM_info.script.version})`;
	}
	const lines = [message, scriptInfo];
	return lines.filter((line) => line).join('\n—\n');
}

/**
 * Builds the URL to the MBS edit page of the given entity.
 * @param {string} entityType Type of the entity.
 * @param {string} mbid MBID of the entity.
 * @returns {string}
 */
function buildEditUrl(entityType, mbid) {
	return `/${entityType}/${mbid}/edit`;
}

/**
 * Fetches the given edit page and extracts the JSON edit source data of the entity from it.
 * @param {string} editUrl URL of the entity edit page.
 * @returns {Promise<Object>} JSON edit source data.
 */
async function fetchEditSourceData(editUrl) {
	const response = await fetch(editUrl);
	const [, sourceData] = /sourceData: (.*),\n/.exec(await response.text());
	console.debug(sourceData);
	return JSON.parse(sourceData);
}

/**
 * Parses edit source data of the entity and builds the relevant default edit data.
 * @param {Object} sourceData JSON edit source data.
 * @returns {Object} JSON edit data.
 */
function parseSourceData(sourceData) {
	const editData = {};
	for (let property in RG_SOURCE_DATA) {
		const value = sourceData[RG_SOURCE_DATA[property]];
		if (value) {
			editData[property] = value;
		}
	}
	console.debug(editData);
	return editData;
}
