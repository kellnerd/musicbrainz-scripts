import { addCopyrightRelationships } from '../copyrightRelationships.js';
import { addParserButton, buildCreditParserUI } from '../creditParserUI.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import { parseCopyrightNotice } from '../parseCopyrightNotice.js';

function buildUI() {
	buildCreditParserUI();
	addParserButton('Parse copyright notice', async (creditLine, event) => {
		const copyrightInfo = parseCopyrightNotice(creditLine);
		if (copyrightInfo.length) {
			const result = await addCopyrightRelationships(copyrightInfo);
			nameToMBIDCache.store();
			return result;
		} else {
			return false;
		}
	});
}

nameToMBIDCache.load();
buildUI();
