import { buildEditNote } from './editNote.js';
import { buildEditUrl } from './entity.js';
import { ATTRIBUTE_DATA } from './data/attributes.js';
import {
	RG_EDIT_FIELDS,
	RG_SOURCE_DATA,
} from './data/releaseGroup.js';
import { fetchCoreEntity } from './internalAPI.js';
import { limit } from '../utils/async/rateLimit.js';
import { flatten } from '../utils/object/flatten.js';
import { urlSearchMultiParams } from '../utils/url/searchParams.js';

/**
 * Gets the default edit data for the given release group.
 * @param {string} mbid MBID of the release group.
 * @returns {Promise<Object>}
 */
export async function getReleaseGroupEditData(mbid) {
	const sourceData = await fetchEditSourceData(mbid);
	return parseSourceData(sourceData, true);
}

// Limit editing to 5 concurrent edits
export const editReleaseGroup = limit(_editReleaseGroup, 5);

/**
 * Sends an edit request for the given release group to MBS.
 * @param {string} mbid MBID of the release group.
 * @param {Object} editData Properties of the release group and their new values.
 */
async function _editReleaseGroup(mbid, editData) {
	const editUrl = buildEditUrl('release-group', mbid);

	// build body of the edit request and preserve values of unaffected properties
	const sourceData = await fetchEditSourceData(mbid);
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
 * Fetches the JSON edit source data of the given entity.
 * @param {string} mbid MBID of the entity.
 */
function fetchEditSourceData(mbid) {
	return fetchCoreEntity(mbid, ['rels']);
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
	sourceData.relationships?.forEach((rel) => {
		const relData = {
			relationship_id: rel.id, // internal ID, left out for new relationships
			link_type_id: rel.linkTypeID, // internal ID of the rel type, always required
			verbosePhrase: rel.verbosePhrase, // redundant (ignored by MBS), just for convenience (TODO: replace by a UI "translation")
		};
		if (rel.target_type === 'url') {
			relData.text = rel.target.name; // URL itself
			editData.url.push(relData); // TODO: URL array index does not start with 0 in MBS requests!?
		} else {
			relData.target = rel.target.gid; // MBID of the target entity
			relData.backward = Number(rel.direction === 'backward'); // defaults to 0, requires `target` on change
			// all of the following relationship properties are optional (TODO: leave out if empty?)
			relData.attributes = rel.attributes.map(parseAttributeSourceData);
			relData.period = buildDatePeriod(rel.begin_date, rel.end_date, rel.ended);
			relData.entity0_credit = rel.entity0_credit;
			relData.entity1_credit = rel.entity1_credit;
			editData.rel.push(relData);
		}
	});
	return editData;
}

function parseAttributeSourceData(attribute) {
	const result = {};
	// copy relevant properties if they exist
	ATTRIBUTE_DATA.forEach((property) => {
		const value = attribute[property];
		if (value) {
			result[property] = value;
		}
	});
	return result;
}

function buildDatePeriod(begin_date = null, end_date = null, ended = false) {
	if (begin_date || end_date || ended) {
		[begin_date, end_date].filter((x) => x !== null).forEach((date) => {
			['year', 'month', 'day'].forEach((property) => {
				date[property] ??= ''; // MBS expects an empty string instead of null
			});
		});
		return {
			begin_date,
			end_date,
			ended: Number(Boolean(ended)),
		};
	} else {
		return {}; // empty objects will be removed during flattening
	}
}
