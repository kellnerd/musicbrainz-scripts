/**
 * - Simplifies the addition of “spoken vocals” relationships (at release level) by providing a pre-filled dialogue in the relationship editor.
 */

import { createVoiceActorDialog } from '../voiceActorCredits.js';

createVoiceActorDialog().open(document.createEvent('MouseEvent'));
