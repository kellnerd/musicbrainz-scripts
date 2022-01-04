import { parseCopyrightNotice } from '../src/parseCopyrightNotice.js';
import { assertFunction } from '../tools/test.js';

/** @type {Array<[string, import('../src/parseCopyrightNotice.js').CopyrightData]>} */
const copyrightTestCases = [
	/* simple copyrights */
	['© 2021 Universal Music New Zealand Limited', [{
		name: 'Universal Music New Zealand Limited',
		types: ['©'],
		year: '2021',
	}]],
	['℗ 2021 Universal Music New Zealand Limited', [{
		name: 'Universal Music New Zealand Limited',
		types: ['℗'],
		year: '2021',
	}]],

	/* copyright notice with French quotes from a-tisket */
	['© «2021 Universal Music New Zealand Limited»', [{
		name: 'Universal Music New Zealand Limited',
		types: ['©'],
		year: '2021',
	}]],

	/* combined (P) & (C) copyright */
	['℗ & © 2021 Universal Music New Zealand Limited', [{
		name: 'Universal Music New Zealand Limited',
		types: ['℗', '©'],
		year: '2021',
	}]],

	/* copyright with additional text */
	['© «2017 Elektra Records. All Rights Reserved.»', [{
		name: 'Elektra Records',
		types: ['©'],
		year: '2017',
	}]],

	/* copyright & legal information */
	['℗ «2017 Elektra Records. All Rights Reserved. Marketed by Rhino Entertainment Company, a Warner Music Group Company»', [{
		name: 'Elektra Records',
		types: ['℗'],
		year: '2017',
	}, {
		name: 'Rhino Entertainment Company',
		types: ['marketed by'],
	}]],
	['℗ «2007 Turbo Artist AS, Licenced from Turbo Artist AS»', [{
		name: 'Turbo Artist AS',
		types: ['℗'],
		year: '2007',
	}, {
		name: 'Turbo Artist AS',
		types: ['licensed from'],
	}]],
];

export default function testCopyrightParser() {
	console.log('Testing copyright parser...');
	return assertFunction(parseCopyrightNotice, copyrightTestCases);
}
