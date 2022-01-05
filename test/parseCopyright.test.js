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

	/* combined (P) & (C) copyright without date */
	['℗ & © «Rare»', [{
		name: 'Rare',
		types: ['℗', '©'],
		year: undefined,
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
	['℗ & © «2016 Maspeth Music BV, under exclusive license to Republic Records, a division of UMG Recordings, Inc. (Eddie O Ent.)»', [{
		name: 'Maspeth Music BV',
		types: ['℗', '©'],
		year: '2016',
	}, {
		name: 'Republic Records',
		types: ['licensed to'],
	}]],
	['℗ & © «2019 Magic Quid Limited under exclusive licence to BMG Rights Management (UK) Limited»', [{
		name: 'Magic Quid Limited',
		types: ['℗', '©'],
		year: '2019',
	}, {
		name: 'BMG Rights Management (UK) Limited',
		types: ['licensed to'],
	}]],

	/* distribution & marketing */
	['Distributed By Republic Records.', [{
		name: 'Republic Records',
		types: ['distributed by'],
	}]],

	/* labels with company suffixes */
	['© 2021 SSA Recording, LLP, under exclusive license to Republic Records, a division of UMG Recordings, Inc.', [{
		name: 'SSA Recording, LLP',
		types: ['©'],
		year: '2021',
	}, {
		name: 'Republic Records',
		types: ['licensed to'],
	}]],
	['Distributed By Republic Records.; ℗ 2011 The Weeknd XO, Inc.', [{
		name: 'The Weeknd XO, Inc.',
		types: ['℗'],
		year: '2011',
	}, {
		name: 'Republic Records',
		types: ['distributed by'],
	}]],
];

export default function testCopyrightParser() {
	console.log('Testing copyright parser...');
	return assertFunction(parseCopyrightNotice, copyrightTestCases);
}
