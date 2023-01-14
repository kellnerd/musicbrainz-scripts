import { addCopyrightRelationships as _addCopyrightRelationships } from '../copyrightRelationships.js';
import { addCopyrightRelationships } from '../relationship-editor/addCopyrightRelationships.js';
import { hasReactRelEditor } from '../relationship-editor/common.js';
import { addParserButton, buildCreditParserUI } from '../creditParserUI.js';
import { nameToMBIDCache } from '../nameToMBIDCache.js';
import { parseCopyrightNotice } from '../parseCopyrightNotice.js';
import { dom } from '../../utils/dom/select.js';
import { getPatternAsRegExp } from '../../utils/regex/parse.js';

function buildCopyrightParserUI() {
	const terminatorInput = dom('credit-terminator');
	const nameSeparatorInput = dom('name-separator');

	nameToMBIDCache.load();

	// TODO: drop once the new React relationship editor has been deployed
	const addCopyrightRels = hasReactRelEditor() ? addCopyrightRelationships : _addCopyrightRelationships;

	addParserButton('Parse copyright notice', async (creditLine, event) => {
		const copyrightInfo = parseCopyrightNotice(creditLine, {
			terminatorRE: getPatternAsRegExp(terminatorInput.value || '/$/'),
			nameSeparatorRE: getPatternAsRegExp(nameSeparatorInput.value || '/$/'),
		});

		if (copyrightInfo.length) {
			const result = await addCopyrightRels(copyrightInfo, {
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
