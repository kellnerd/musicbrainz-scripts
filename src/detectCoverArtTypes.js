import { qs, qsa } from '@kellnerd/es-utils/dom/select.js';

const typeCheckboxQuery = 'ul.cover-art-type-checkboxes input[type="checkbox"]';

/**
 * Detects and fills the image types and comment of all pending uploads using their filenames.
 * @param {Object} options 
 * @param {string[]} [options.additionalTypes] Additional image types which should be selected for all images.
 * @param {RegExp} [options.commentPattern] Regex to extract an image comment from the filename.
 */
export function detectCoverArtTypesAndComment({
	additionalTypes = [],
	commentPattern,
} = {}) {
	const pendingUploadRows = qsa('tbody[data-bind="foreach: files_to_upload"] > tr');

	/** @type {Record<string, string>} */
	const typeNameToId = {};

	// extract the name to ID mapping from the checkboxes of the first pending upload (could be any)
	qsa(typeCheckboxQuery, pendingUploadRows[0]).forEach((/** @type {HTMLInputElement} */ checkbox) => {
		const label = checkbox.parentElement.textContent.trim().toLowerCase();
		// use e.g. `raw` and `unedited` individually instead of `raw/unedited`
		label.split('/').forEach((label) => typeNameToId[label] = checkbox.value);
	});

	/**
	 * Match type names which are separate words.
	 * Using `\b` as word boundary is not sufficient because underscores would be treated as part of the word.
	 */
	const typeNameRegex = new RegExp(
		String.raw`(?<=\W|_|^)(${Object.keys(typeNameToId).join('|')})(?=\W|_|$)`,
		'gi',
	);

	pendingUploadRows.forEach((uploadRow) => {
		const filename = qs('.file-info span[data-bind="text: name"]', uploadRow).textContent;

		const typeNames = Array.from(filename.matchAll(typeNameRegex), (match) => match[0]);
		if (additionalTypes) typeNames.push(...additionalTypes);

		if (typeNames.length) {
			const typeIds = typeNames.map((name) => typeNameToId[name.toLowerCase()]);
			setCoverArtTypes(uploadRow, typeIds);
		}

		if (commentPattern) {
			const commentMatch = filename.match(commentPattern);
			if (commentMatch) fillComment(uploadRow, commentMatch[0]);
		}
	});
}

/**
 * Enables the checkboxes for the given type IDs inside the given row.
 * @param {HTMLTableRowElement} uploadRow 
 * @param {string[]} typeIds 
 */
function setCoverArtTypes(uploadRow, typeIds = []) {
	qsa(typeCheckboxQuery, uploadRow).forEach((/** @type {HTMLInputElement} */ checkbox) => {
		if (typeIds.includes(checkbox.value)) {
			checkbox.checked = true;
			checkbox.dispatchEvent(new Event('click'));
		}
	});
}

/**
 * Fills the comment input inside the given row.
 * @param {HTMLTableRowElement} uploadRow 
 * @param {string} comment 
 */
function fillComment(uploadRow, comment) {
	/** @type {HTMLInputElement} */
	const commentInput = qs('input.comment', uploadRow);
	commentInput.value = comment;
	commentInput.dispatchEvent(new Event('change'));
}
