import { punctuationRules } from '../utils/string/punctuation.js';
import { transform } from '../utils/string/transform.js';
import { assertFunction } from '../utils/test/assertFunction.js';

const punctuationTestCases = [
	/* single and double quotes */
	['Are \'Friends\' Electric?', 'Are ‘Friends’ Electric?'],
	['Axel F (from "Beverly Hills Cop" soundtrack)', 'Axel F (from “Beverly Hills Cop” soundtrack)'],
	['"Hasta La Vista, Baby"', '“Hasta La Vista, Baby”'], // whole text in quotes
	['One of These Days (\'French Windows\')', 'One of These Days (‘French Windows’)'], // surrounded by brackets

	/* apostrophes */
	['I\'m Free', 'I’m Free'], // contraction
	['Lovin\' You', 'Lovin’ You'], // omitted last letter
	['Talkin\' \'Bout You', 'Talkin’ ’Bout You'], // omitted last letter followed by omitted first letter
	['Summer \'68', 'Summer ’68'], // before a number
	['\'39', '’39'], // before a number, at the beginning
	['Atom Heart Mother (\'71 Hakone Aphrodite)', 'Atom Heart Mother (’71 Hakone Aphrodite)'], // after an opening bracket
	['Rock \'n\' Roll', 'Rock ’n’ Roll'], // special case, no single quotes!
	['Rock \'N\' Roll', 'Rock ’N’ Roll'], // case-insensitive, “Guess punctuation” used before “Guess case”
	['Back to the 70\'s', 'Back to the 70’s'],

	/* multiple ASCII quotes and apostrophes with different meaning */
	['Little Billy (aka \'Little Billy\'s Doing Fine\')', 'Little Billy (aka ‘Little Billy’s Doing Fine’)'],
	['"I am 12" 7" edit of 12" remix', '“I am 12” 7″ edit of 12″ remix'],
	['2\'59" hardcore \'Master\'s Crown Take \'Em to the Limit\' 80\'s 7" edit',
		'2′59″ hardcore ‘Master’s Crown Take ’Em to the Limit’ 80’s 7″ edit'],
	// failing: ['Here \'Tis (version for \'Ready, Steady, Go!\')', 'Here ’Tis (version for ‘Ready, Steady, Go!’)'],

	/* IS0 8601 dates and date ranges */
	['live, 1987-07-30', 'live, 1987‐07‐30'],
	['live, 2016-04', 'live, 2016‐04'],
	['The Early Years: 1965-1972', 'The Early Years: 1965–1972'],
	['advanced date range 1234-05-06-1789-10-11', 'advanced date range 1234‐05‐06–1789‐10‐11'],
	['1989-90', '1989–90'], // second year abbreviated, not a valid date

	/* other numbers */
	['Volumes 1-5', 'Volumes 1–5'], // numeric range (en dash)
	['ISBN 978-0-12345-678-9', 'ISBN 978‒0‒12345‒678‒9'], // figure dash to group digits
	['2345-67-89', '2345‒67‒89'], // figure dash to group digits, not a valid date
	// failing: ['555-1212', '555‒1212'], // figure dash, phone number with only two groups of digits (could be a range)
	// failing: ['\'74-\'75', '’74–’75'], // would work with spaces

	/* hyphens */
	['Bron-Yr-Aur Stomp', 'Bron‐Yr‐Aur Stomp'],

	/* dashes */
	['Journal de Paris - Les Pink Floyd', 'Journal de Paris – Les Pink Floyd'],

	/* ellipses */
	['Wot\'s... Uh the Deal', 'Wot’s… Uh the Deal'],
	['...Baby One More Time', '…Baby One More Time'], // at the beginning
	['The Gold It\'s in The...', 'The Gold It’s in The…'], // at the end
	['Is This the World We Created...?', 'Is This the World We Created…?'], // before another punctuation symbol

	/* non-Latin scripts */
	['Όσο Και Να Σ\' Αγαπάω (Υπ\' Ευθύνη Μου)',	'Όσο Και Να Σ’ Αγαπάω (Υπ’ Ευθύνη Μου)'],

	/* ignored cases */
	['Death on Two Legs (Dedicated to......', 'Death on Two Legs (Dedicated to......'],
	['Royal Days -another version-', 'Royal Days -another version-'], // dashes used as brackets (Japanese)
];

export default function testPunctuationRules() {
	console.log('Testing punctuation transformation rules for titles...');
	return assertFunction(transform, punctuationTestCases, punctuationRules);
}
