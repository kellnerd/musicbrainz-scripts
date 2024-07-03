import { parseCopyrightNotice } from '../src/parseCopyrightNotice.js';
import { assertFunction } from '@kellnerd/es-utils/test/assertFunction.js';

/** @type {Array<[string, import('../src/parseCopyrightNotice.js').CopyrightItem[]]>} */
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

	/* Discogs-style copyrights with dashes */
	['Copyright (c) – Capitol Records, Inc.', [{
		name: 'Capitol Records, Inc.',
		types: ['©'],
		year: undefined,
	}]],

	/* combined (P) & (C) copyright */
	['℗ & © 2021 Universal Music New Zealand Limited', [{
		name: 'Universal Music New Zealand Limited',
		types: ['℗', '©'],
		year: '2021',
	}]],
	['℗© 1974 Asylum Records', [{
		name: 'Asylum Records',
		types: ['℗', '©'],
		year: '1974',
	}]],
	['© ℗ 2019 Interscope Records', [{
		name: 'Interscope Records',
		types: ['©', '℗'],
		year: '2019',
	}]],
	['℗ 2012 & © 2017 Casino Records Entertainment. Distributed by The Family Affair Company.', [{
		name: 'Casino Records Entertainment',
		types: ['℗'],
		year: '2012',
	}, {
		name: 'Casino Records Entertainment',
		types: ['©'],
		year: '2017',
	}, {
		name: 'The Family Affair Company',
		types: ['distributed by'],
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
	['℗ 2016 The copyright in this sound recording is owned by Pink Floyd Music Ltd.', [{
		name: 'Pink Floyd Music Ltd.',
		types: ['℗'],
		year: '2016',
	}]],
	['℗ Digital Remaster 2011 The copyright in this sound recording is owned by Pink Floyd Music Ltd/Pink Floyd (1987) Ltd under exclusive licence to EMI Records Ltd', [{
		name: 'Pink Floyd Music Ltd',
		types: ['℗'],
		year: '2011',
	}, {
		name: 'Pink Floyd (1987) Ltd',
		types: ['℗'],
		year: '2011',
	}, {
		name: 'EMI Records Ltd',
		types: ['licensed to'],
	}]],
	['℗ 2016 The copyright in this compilation is owned by Pink Floyd Music Ltd.', [{
		name: 'Pink Floyd Music Ltd.',
		types: ['℗'], // TODO: extract "compilation"
		year: '2016',
	}]],
	['© by John Doe', [{
		name: 'John Doe',
		types: ['©'],
		year: undefined,
	}]],

	/* copyright shared by multiple labels */
	['℗ «2012 Shady Records/Aftermath Records/Interscope Records»', [{
		name: 'Shady Records',
		types: ['℗'],
		year: '2012',
	}, {
		name: 'Aftermath Records',
		types: ['℗'],
		year: '2012',
	}, {
		name: 'Interscope Records',
		types: ['℗'],
		year: '2012',
	}]],
	['© 2016 Pink Floyd Music Ltd. / Pink Floyd (1987) Ltd.', [{
		name: 'Pink Floyd Music Ltd.',
		types: ['©'],
		year: '2016',
	}, {
		name: 'Pink Floyd (1987) Ltd.',
		types: ['©'],
		year: '2016',
	}]],
	['℗ 2016 Pink Floyd Music Ltd. / Pink Floyd (1987) Ltd., marketed and distributed by Parlophone Records Ltd., a Warner Music Group Company', [{
		name: 'Pink Floyd Music Ltd.',
		types: ['℗'],
		year: '2016',
	}, {
		name: 'Pink Floyd (1987) Ltd.',
		types: ['℗'],
		year: '2016',
	}, {
		name: 'Parlophone Records Ltd.',
		types: ['marketed by', 'distributed by'],
	}]],
	['℗ «2006 Data Records|Ministry of Sound Recordings Ltd»', [{
		name: 'Data Records',
		types: ['℗'],
		year: '2006',
	}, {
		name: 'Ministry of Sound Recordings Ltd',
		types: ['℗'],
		year: '2006',
	}]],
	['℗ & © «2014 Round Hill Records - Zuma Rock Records»', [{
		name: 'Round Hill Records',
		types: ['℗', '©'],
		year: '2014',
	}, {
		name: 'Zuma Rock Records',
		types: ['℗', '©'],
		year: '2014',
	}]],
	/* only one label, name contains a potential separator or terminator */
	['© «1983 Universal Music A/S»', [{
		name: 'Universal Music A/S',
		types: ['©'],
		year: '1983',
	}]],
	['℗ «2024 Living,Dining&kitchen Records»', [{
		name: 'Living,Dining&kitchen Records',
		types: ['℗'],
		year: '2024',
	}]],

	/* copyright with multiple years */
	['℗ 2014, 2017, 2018, 2019 & 2020 Bruce Springsteen', [{
		name: 'Bruce Springsteen',
		types: ['℗'],
		year: ['2014', '2017', '2018', '2019', '2020'],
	}]],
	['℗ «1983/1999 Sony Music Entertainment Germany GmbH»', [{
		name: 'Sony Music Entertainment Germany GmbH',
		types: ['℗'],
		year: ['1983', '1999'],
	}]],
	// GMR (rights society) indicates an unsupported work level copyright
	['© 1974, 1975, 1978, 1980 Bruce Springsteen (GMR)', [{
		name: 'Bruce Springsteen (GMR)',
		types: ['©'],
		year: ['1974', '1975', '1978', '1980'],
	}]],

	/* multi-line copyright input */
	['© «2017 The Media Champ»\n℗ «2003 The Media Champ»', [{
		name: 'The Media Champ',
		types: ['©'],
		year: '2017',
	}, {
		name: 'The Media Champ',
		types: ['℗'],
		year: '2003',
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
	['℗ «2022 This compilation WaterTower Music as licensee for Warner Bros. Entertainment Inc.»', [{
		name: 'WaterTower Music',
		types: ['℗'],
		year: '2022',
	}, {
		name: 'Warner Bros. Entertainment Inc.',
		types: ['licensed from'],
	}]],

	/* release label between copyright symbol and year */
	['℗Motown Records; 2021 UMG Recordings, Inc.', [{
		name: 'UMG Recordings, Inc.',
		types: ['℗'],
		year: '2021',
	}]],

	/* distribution, manufacturing & marketing */
	['Distributed By Republic Records.', [{
		name: 'Republic Records',
		types: ['distributed by'],
	}]],
	['marketed and distributed by Sony Music Entertainment', [{
		name: 'Sony Music Entertainment',
		types: ['marketed by', 'distributed by'],
	}]],
	['Distributed By – Universal Music LLC', [{
		name: 'Universal Music LLC',
		types: ['distributed by'],
	}]],
	['Manufactured and distributed by Warner Bros. Records Inc., a Warner Music Group Company.', [{
		name: 'Warner Bros. Records Inc.',
		types: ['manufactured by', 'distributed by'],
	}]],

	/* labels with company suffixes */
	['℗ & © «1977 Capitol Records, LLC»', [{
		name: 'Capitol Records, LLC',
		types: ['℗', '©'],
		year: '1977',
	}]],
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
	['℗ 2011 The Weeknd XO, Inc. Distributed By Republic Records.', [{
		name: 'The Weeknd XO, Inc.',
		types: ['℗'],
		year: '2011',
	}, {
		name: 'Republic Records',
		types: ['distributed by'],
	}]],
	['(P) 2021 Pink Floyd (87) Ltd., under exclusive licence to Sony Music Entertainment', [{
		name: 'Pink Floyd (87) Ltd.',
		types: ['℗'],
		year: '2021',
	}, {
		name: 'Sony Music Entertainment',
		types: ['licensed to'],
	}]],
	['© «2020 Revealed Music B.V.»', [{
		name: 'Revealed Music B.V.',
		types: ['©'],
		year: '2020',
	}]],
	['© Sony Music Entertainment (Greece) Α.Ε.', [{ // Greek letters!
		name: 'Sony Music Entertainment (Greece) Α.Ε.',
		types: ['©'],
		year: undefined,
	}]],
	['℗ & © «2012 ACT Music + Vision GmbH & Co. KG»', [{
		name: 'ACT Music + Vision GmbH & Co. KG',
		types: ['℗', '©'],
		year: '2012',
	}]],
	['℗ «1998 Arkadia Entertainment Corp.»', [{
		name: 'Arkadia Entertainment Corp.',
		types: ['℗'],
		year: '1998',
	}]],
	['℗ 2004 FREE-WILL Co., Ltd.', [{
		name: 'FREE-WILL Co., Ltd.',
		types: ['℗'],
		year: '2004',
	}]],

	/* region-specific copyright */
	['℗ & © «2020 Warner Music Nashville LLC for the U.S. and WEA International Inc. for the world outside the U.S.»', [{
		name: 'Warner Music Nashville LLC',
		types: ['℗', '©'],
		year: '2020',
	}, {
		name: 'WEA International Inc.',
		types: ['℗', '©'],
		year: '2020',
	}]],
	['℗ & © «2008 Atlantic Recording Corporation for the United States and WEA International Inc. for the world outside of the United States»', [{
		name: 'Atlantic Recording Corporation',
		types: ['℗', '©'],
		year: '2008',
	}, {
		name: 'WEA International Inc.',
		types: ['℗', '©'],
		year: '2008',
	}]],

	/* confusing usage of copyright symbols */
	['℗ «Under exclusive licence to Parlophone Records Limited»', [{
		name: 'Parlophone Records Limited',
		types: ['licensed to'],
	}]],
	/* fake copyright which contains the release label */
	['℗ 2017 «A Virgin EMI Records Release»', []],
];

export default function testCopyrightParser() {
	console.log('Testing copyright parser...');
	return assertFunction(parseCopyrightNotice, copyrightTestCases);
}
