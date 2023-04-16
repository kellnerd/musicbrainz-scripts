import { addCopyrightRelationships } from '../relationship-editor/addCopyrightRelationships.js';
import { addParserButton, buildCreditParserUI } from '../creditParserUI.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import { parseCopyrightNotice } from '../parseCopyrightNotice.js';
import { dom } from '@kellnerd/es-utils/dom/select.js';
import { getPatternAsRegExp } from '@kellnerd/es-utils/regex/parse.js';

function buildCopyrightParserUI() {
	const terminatorInput = dom('credit-terminator');
	const nameSeparatorInput = dom('name-separator');

	nameToMBIDCache.load();

	addParserButton('Parse copyright notice', async (creditLine, event) => {
		const copyrightInfo = parseCopyrightNotice(creditLine, {
			terminatorRE: getPatternAsRegExp(terminatorInput.value || '/$/'),
			nameSeparatorRE: getPatternAsRegExp(nameSeparatorInput.value || '/$/'),
		});

		if (copyrightInfo.length) {
			const result = await addCopyrightRelationships(copyrightInfo, {
				forceArtist: event.shiftKey,
				bypassCache: event.ctrlKey,
				useAllYears: event.altKey,
			});
			nameToMBIDCache.store();
			return result;
		} else {
			return 'skipped';
		}
	}, [
		'SHIFT key to force names to be treated as artist names',
		'CTRL key to bypass the cache and force a search',
		'ALT key to add multiple relationships for multiple years',
	].join('\n'));
}

buildCreditParserUI(buildCopyrightParserUI);
