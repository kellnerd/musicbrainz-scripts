import {
	MBID_REGEX,
	RG_EDIT_FIELDS,
	RG_SOURCE_DATA,
} from './MBS.js';
import {
	flatten,
	urlSearchMultiParams,
} from './formTools.js';

/**
 * Gets the default edit data for the given release group.
 * @param {string} mbid MBID of the release group.
 * @returns {Promise<Object>}
 */
export async function getReleaseGroupEditData(mbid) {
	const editUrl = buildEditUrl('release-group', mbid);
	const sourceData = await fetchEditSourceData(editUrl);
	return parseSourceData(sourceData, true);
}

/**
 * Sends an edit request for the given release group to MBS.
 * @param {string} mbid MBID of the release group.
 * @param {Object} editData Properties of the release group and their new values.
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
		body: urlSearchMultiParams(editBody),
	});
	if (!response.redirected) {
		throw new Error(`Failed to edit “${sourceData.name}” (MBS did not redirect).`);
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
 * @param {*} debugData Additional debug data which should be included as JSON (optional).
 * @returns {string}
 */
export function buildEditNote(message = '', debugData) {
	let scriptInfo = '';
	if (typeof GM_info !== 'undefined') {
		scriptInfo = `${GM_info.script.name} (${GM_info.script.version})`;
	}
	const lines = [message, JSON.stringify(debugData), scriptInfo];
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
	const sourceData = /sourceData: (.*),\n/.exec(await response.text())?.[1];
	console.debug(sourceData);
	return JSON.parse(sourceData);
}

/**
 * Parses edit source data of the entity and builds the relevant default edit data.
 * @param {Object} sourceData JSON edit source data.
 * @param {boolean} parseOptionalProps Enables parsing of artist credits, relationships and URLs.
 * @returns {Object} JSON edit data.
 */
function parseSourceData(sourceData, parseOptionalProps = false) {
	let editData = {};
	for (let property in RG_SOURCE_DATA) {
		const sourceKey = RG_SOURCE_DATA[property];
		const value = sourceData[sourceKey];
		if (value) {
			editData[property] = value;
		}
	}
	if (parseOptionalProps) {
		editData = {
			...editData,
			artist_credit: parseArtistCreditSourceData(sourceData),
			...parseRelationshipSourceData(sourceData),
		};
	}
	console.debug(editData);
	return editData;
}

/**
 * Parses edit source data for the artist credit and builds the relevant default edit data of the artist credit.
 * @param {Object} sourceData JSON edit source data.
 * @returns {{names:[]}} JSON artist credit edit data.
 */
function parseArtistCreditSourceData(sourceData) {
	return {
		names: sourceData.artistCredit.names.map((name) => ({
			name: name.name, // name as credited
			join_phrase: name.joinPhrase,
			artist: {
				id: name.artist.id, // internal ID
				name: name.artist.name, // redundant, has no effect
			}
		}))
	};
}

/**
 * Parses edit source data for relationships/URLs and builds their relevant default edit data.
 * @param {Object} sourceData JSON edit source data.
 * @returns {{url:Array,rel:Array}} JSON edit data.
 */
function parseRelationshipSourceData(sourceData) {
	// these are optional edit data properties, empty arrays will be removed during flattening
	const editData = {
		rel: [],
		url: [],
	};
	sourceData.relationships.forEach((rel) => {
		const relData = {
			relationship_id: rel.id, // internal ID, left out for new relationships
			link_type_id: rel.linkTypeID, // internal ID of the rel type
		};
		if (rel.target_type === 'url') {
			relData.text = rel.target.name; // URL itself
			editData.url.push(relData); // TODO: URL array index does not start with 0 in MBS requests!?
		} else {
			relData.target = rel.target.gid; // MBID of the target entity
			relData.attributes = rel.attributes.map((attribute) => ({ // optional property (array)
				type: attribute.type, // contains a `gid` property (MBID of the attribute)
				text_value: attribute.text_value,
			}));
			editData.rel.push(relData);
		}
	});
	return editData;
}

/**
 * Attempts to fetch the given ressource.
 * Performs the same request again if the response was not successful before it fails with an error.
 * @param {RequestInfo} input
 * @param {RequestInit} init
 * @param {number} retries Number of retries.
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(input, init, retries = 5) {
	try {
		const response = await fetch(input, init);
		if (response.ok) {
			return response;
		}
		throw new Error(`HTTP status ${response.status} for ${input.url || input}`);
	} catch (error) {
		if (retries <= 0) {
			throw error;
		}
		console.warn('Retrying fetch:', error);
		return await fetchWithRetry(input, init, retries - 1);
	}
}

/**
 * Extracts MBIDs from the given URLs.
 * @param  {string[]} urls
 * @param  {string} entityType Filter URLs by entity type (optional).
 * @param {boolean} unique Removes duplicate MBIDs from the results (optional).
 * @returns {string[]} Array of valid MBIDs.
 */
export function extractMbids(urls, entityType = '', unique = false) {
	const pattern = new RegExp(`${entityType}/(${MBID_REGEX.source})`);
	const mbids = urls
		.map((url) => url.match(pattern)?.[1]) // returns first capture group or `undefined`
		.filter((mbid) => mbid); // remove undefined MBIDs
	if (unique) {
		return [...new Set(mbids)];
	} else {
		return mbids;
	}
}
