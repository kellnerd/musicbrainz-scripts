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
		const copyrightInfo = parseCopyrightNotice(creditLine, {
			terminatorRE: getPatternAsRegExp(terminatorInput.value || '/$/'),
			nameSeparatorRE: getPatternAsRegExp(nameSeparatorInput.value || '/$/'),
		});

		if (copyrightInfo.length) {
			const result = await addCopyrightRelationships(copyrightInfo, {
				forceArtist: event.shiftKey,
				bypassCache: event.ctrlKey,
			});
			nameToMBIDCache.store();
			return result;
		} else {
			return 'skipped';
		}
	}, [
		'SHIFT key to force names to be treated as artist names',
		'CTRL key to bypass the cache and force a search',
	].join('\n'));
}

nameToMBIDCache.load();
buildUI();
