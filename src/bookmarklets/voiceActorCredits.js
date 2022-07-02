/**
 * - Simplifies the addition of “spoken vocals” relationships (at release level) by providing a pre-filled dialogue in the relationship editor.
 * - Parses voice actor credits from text and remembers name to MBID mappings(userscript only).
 * - Imports voice actor credits from linked Discogs pages (userscript only).
 * - Automatically matches artists whose Discogs pages are linked to MB (unlinked artists can be selected from the already opened inline search).
 */

import { createVoiceActorDialog } from '../relationshipEditor.js';

createVoiceActorDialog().open();
