import { RG_EDIT_FIELDS } from './MBS.js';
import { flatten } from './formTools.js';

/**
 * Sends an edit request for the given release group to MBS.
 * @param {string} mbid MBID of the release group.
 * @param {Object} editData Fields of the release group and their new values.
 * @returns {Promise<boolean>}
 */
export async function editReleaseGroup(mbid, editData) {
	let response;
	// build body of the edit request and pre-fill with the required (unchanged) values
	response = await fetch(`/ws/2/release-group/${mbid}?fmt=json`);
	const rg = await response.json();
	const editBody = flatten({
		'edit-release-group': {
			name: rg.title, // required to submit the form
			// TODO: preserve values for primary & secondary type IDs...
			make_votable: 1,
			edit_note: buildEditNote(),
			...editData, // can also be used to overwrite the above defaults
		}
	});
	response = await fetch(`/release-group/${mbid}/edit`, {
		method: 'POST',
		body: new URLSearchParams(editBody),
	});
	if (response.redirected) {
		return true;
	} else {
		console.error(`Failed to edit '${rg.title}' (MBS did not redirect)`);
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
		if (typeof value === 'object') { // recursively scan the edit data object
			value = replaceNamesByIds(value);
		} else if (property in RG_EDIT_FIELDS) { // known property
			const nameToId = RG_EDIT_FIELDS[property];
			if (typeof nameToId === 'object') { // mapping exists for this property
				value = nameToId[value] || value; // fallback: use the (possibly numerical) value as-is
			}
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
