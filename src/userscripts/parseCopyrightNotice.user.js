import { addCopyrightRelationships } from '../copyrightRelationships.js';
import { addParserButton, buildCreditParserUI } from '../creditParserUI.js';
import { dom } from '../dom.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import { parseCopyrightNotice } from '../parseCopyrightNotice.js';
import { getPatternAsRegExp } from '../regex.js';

function buildUI() {
	buildCreditParserUI();

	const terminatorInput = dom('credit-terminator');
	const nameSeparatorInput = dom('name-separator');

	addParserButton('Parse copyright notice', async (creditLine, event) => {
		/** @type {CreditParserOptions} */
		const customOptions = {
			terminatorRE: getPatternAsRegExp(terminatorInput.value || '/$/'),
			nameSeparatorRE: getPatternAsRegExp(nameSeparatorInput.value || '/$/'),
		};

		const copyrightInfo = parseCopyrightNotice(creditLine, customOptions);
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
