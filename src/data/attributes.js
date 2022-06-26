
/**
 * Contains all relevant edit data properties of attributes (which are named the same as the corresponding source data properties).
 */
export const ATTRIBUTE_DATA = [
	'type', // contains a `gid` property (MBID of the attribute)
	'typeName', // redundant (ignored by MBS), just for convenience (TODO: replace by a UI "translation")
	'text_value', // only exists if "free_text" is true
	'credited_as', // only exists if "creditable" is true (used for instrument/vocal type credits)
];
