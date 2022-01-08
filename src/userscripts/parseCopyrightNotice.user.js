import { addCopyrightRelationships } from '../copyrightRelationships.js';
import { addParserButton, buildCreditParserUI } from '../creditParserUI.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import { parseCopyrightNotice } from '../parseCopyrightNotice.js';

function buildUI() {
	buildCreditParserUI();
	addParserButton('Parse copyright notice', async (credits, event) => {
		const copyrightInfo = parseCopyrightNotice(credits);
		if (copyrightInfo.length) {
			const automaticMode = event.altKey;
			await addCopyrightRelationships(copyrightInfo, automaticMode);
			nameToMBIDCache.store();
			return true;
		} else {
			return false;
		}
	});
}

nameToMBIDCache.load();
buildUI();
