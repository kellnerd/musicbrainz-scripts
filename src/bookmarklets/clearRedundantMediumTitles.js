/**
 * - Clears medium titles if they are redundant and contain only the medium format and position.
 * - Adds a link to the relevant guideline to the edit note.
 */

$('input[id^=medium-title]')
	.val((index, value) => value.replace(/^(Cassette|CD|Dis[ck]|DVD|SACD|Vinyl)\s*\d+/i, '').trim())
	.trigger('change');

$('#edit-note-text')
	.val((index, value) => 'Clear redundant medium titles, see https://musicbrainz.org/doc/Style/Release#Medium_title\n' + value)
	.trigger('change');
