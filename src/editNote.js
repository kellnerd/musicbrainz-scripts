
/**
 * Adds the given message and a footer for the active userscript to the edit note.
 * @param {string} message Edit note message.
 */
export function addMessageToEditNote(message) {
	/** @type {HTMLTextAreaElement} */
	const editNoteInput = document.querySelector('#edit-note-text, .edit-note');
	const previousContent = editNoteInput.value.split(editNoteSeparator);
	editNoteInput.value = buildEditNote(...previousContent, message);
	editNoteInput.dispatchEvent(new Event('change'));
}

/**
 * Builds an edit note for the given message sections and adds a footer section for the active userscript.
 * Automatically de-duplicates the sections to reduce auto-generated message and footer spam.
 * @param {...string} sections Edit note sections.
 * @returns {string} Complete edit note content.
 */
export function buildEditNote(...sections) {
	sections = sections.map((section) => section?.trim());

	if (typeof GM_info !== 'undefined') {
		sections.push(`${GM_info.script.name} (v${GM_info.script.version}, ${GM_info.script.namespace})`);
	}

	// drop empty sections and keep only the last occurrence of duplicate sections
	return sections
		.filter((section, index) => section && sections.lastIndexOf(section) === index)
		.join(editNoteSeparator);
}

const editNoteSeparator = '\n—\n';
