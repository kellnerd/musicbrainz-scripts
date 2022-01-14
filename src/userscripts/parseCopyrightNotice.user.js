import { addCopyrightRelationships } from '../copyrightRelationships.js';
import { addParserButton, buildCreditParserUI } from '../creditParserUI.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import { parseCopyrightNotice } from '../parseCopyrightNotice.js';

function buildUI() {
	buildCreditParserUI();
	addParserButton('Parse copyright notice', async (creditLine, event) => {
		const copyrightInfo = parseCopyrightNotice(creditLine);
		if (copyrightInfo.length) {
			const bypassCache = event.ctrlKey;
			const result = await addCopyrightRelationships(copyrightInfo, bypassCache);
			nameToMBIDCache.store();
			return result;
		} else {
			return false;
		}
	}, 'CTRL key to bypass the cache and force a search');
}

nameToMBIDCache.load();
buildUI();
