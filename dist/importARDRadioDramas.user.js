// ==UserScript==
// @name         MusicBrainz: Import ARD radio dramas
// @version      2022.1.31
// @namespace    https://github.com/kellnerd/musicbrainz-bookmarklets
// @author       kellnerd
// @description  Imports German broadcast releases from the ARD radio drama database.
// @homepageURL  https://github.com/kellnerd/musicbrainz-bookmarklets#import-ardradio-dramas
// @downloadURL  https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/importARDRadioDramas.user.js
// @updateURL    https://raw.githubusercontent.com/kellnerd/musicbrainz-bookmarklets/main/dist/importARDRadioDramas.user.js
// @supportURL   https://github.com/kellnerd/musicbrainz-bookmarklets/issues
// @grant        none
// @match        *://hoerspiele.dra.de/vollinfo.php
// ==/UserScript==

(function () {
	'use strict';

	const urlTypeIds = /** @type {const} */ ({
		'production': 72,
		'amazon asin': 77,
		'discography entry': 288,
		'license': 301,
		'get the music': 73,
		'purchase for mail-order': 79,
		'purchase for download': 74,
		'download for free': 75,
		'free streaming': 85,
		'streaming': 980,
		'crowdfunding page': 906,
		'show notes': 729,
		'other databases': 82,
		'discogs': 76,
		'vgmdb': 86,
		'secondhandsongs': 308,
		'allmusic': 755,
		'BookBrainz': 850,
	});

	/**
	 * Builds an edit note for the given message sections and adds a footer section for the active userscript.
	 * Automatically de-duplicates the sections to reduce auto-generated message and footer spam.
	 * @param {...string} sections Edit note sections.
	 * @returns {string} Complete edit note content.
	 */
	function buildEditNote(...sections) {
		sections = sections.map((section) => section.trim());

		if (typeof GM_info !== 'undefined') {
			sections.push(`${GM_info.script.name} (v${GM_info.script.version}, ${GM_info.script.namespace})`);
		}

		// drop empty sections and keep only the last occurrence of duplicate sections
		return sections
			.filter((section, index) => section && sections.lastIndexOf(section) === index)
			.join(editNoteSeparator);
	}

	const editNoteSeparator = '\n—\n';

	/**
	 * @param {MB.EntityType} entityType 
	 * @param {MB.MBID | 'add' | 'create'} mbid MBID of an existing entity or `create` for the entity creation page (`add` for releases).
	 */
	function buildEntityURL(entityType, mbid) {
		return `https://musicbrainz.org/${entityType}/${mbid}`;
	}

	/**
	 * Creates a hidden input element.
	 * @param {string} name Name of the input element.
	 * @param {string} value Value of the input element.
	 */
	function createHiddenInput(name, value) {
		const input = document.createElement('input');
		input.setAttribute('type', 'hidden');
		input.name = name;
		input.value = value;
		return input;
	}

	/**
	 * Creates a form with hidden inputs for the given data.
	 * @param {FormDataRecord} data Record with one or multiple values for each key.
	 */
	function createHiddenForm(data) {
		const form = document.createElement('form');
		form.append(...
			Object.entries(data).flatMap(([key, value]) => {
				if (Array.isArray(value)) {
					return value.map((singleValue) => createHiddenInput(key, singleValue));
				}
				return createHiddenInput(key, value);
			})
		);
		return form;
	}

	/**
	 * Flattens the given (deep) object to a single level hierarchy.
	 * Concatenates the keys in a nested structure which lead to a value with dots.
	 * @param {object} object 
	 * @param {string[]} preservedKeys Keys whose values will be preserved.
	 * @returns {object}
	 */
	function flatten(object, preservedKeys = []) {
		const flatObject = {};

		for (const key in object) {
			let value = object[key];
			if (typeof value === 'object' && value !== null && !preservedKeys.includes(key)) { // also matches arrays
				value = flatten(value, preservedKeys);
				for (const childKey in value) {
					flatObject[key + '.' + childKey] = value[childKey]; // concatenate keys
				}
			} else { // value is already flat (e.g. a string) or should be preserved
				flatObject[key] = value; // keep the key
			}
		}

		return flatObject;
	}

	/**
	 * Creates a form with hidden inputs and a submit button to seed a new release on MusicBrainz.
	 * @param {MB.ReleaseSeed} releaseData Data of the release.
	 */
	function createReleaseSeederForm(releaseData) {
		const form = createHiddenForm(flatten(releaseData, ['type']));
		form.action = buildEntityURL('release', 'add');
		form.method = 'POST';
		form.target = '_blank';
		form.name = 'musicbrainz-release-seeder';

		const importButton = document.createElement('button');
		importButton.textContent = 'Import into MusicBrainz';
		importButton.title = 'Import this release into MusicBrainz (open a new tab)';
		form.appendChild(importButton);

		return form;
	}

	/**
	 * Returns the first element that is a descendant of node that matches selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qs(selectors, node = document) {
		return node.querySelector(selectors);
	}

	/**
	 * Returns all element descendants of node that match selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qsa(selectors, node = document) {
		return node.querySelectorAll(selectors);
	}

	/**
	 * Creates an object from the given arrays of keys and corresponding values.
	 * @param {string[]} keys
	 * @param {any[]} values
	 */
	function zipObject(keys, values) {
		return Object.fromEntries(keys.map((_, index) => [keys[index], values[index]]));
	}

	// clean up the release URL
	const releaseURL = new URL(window.location);
	const releaseId = releaseURL.searchParams.get('dukey');
	releaseURL.search = new URLSearchParams({ dukey: releaseId });

	// extract data
	const authors = Array.from(qsa('.hspaut a')).map((a) => a.textContent.trim());
	const title = qs('.hsprhti').textContent.trim();
	qs('.hspunti')?.textContent.trim();
	qs('.hsprti')?.textContent.trim();

	Array.from(qsa('.vollinfoblock p > span.prefix')).map((span) => {
		const line = span.parentNode.textContent.trim();
		return line.split(/:\s+/, 2); // split prefix (attribute name) and content (attribute values)
	});

	Array.from(document.querySelectorAll('.mitwirkende tr')).map((row) => {
		// three cells which should contain: 1. actor/actress, 2. empty, 3. role(s) or empty
		const cells = row.childNodes;
		if (cells.length !== 3 || cells[0].nodeName !== 'TD') return; // skip headers and empty rows
		return Array.from(cells).map((cell) => cell.textContent.trim()).filter((text) => text);
	}).filter((credit) => credit);

	const sidebarText = Array.from(qsa('.sectionC div:not(.noPrint) > p'))
		.filter((p) => p.childElementCount === 0) // skip headings, keep only text nodes
		.map((p) => p.textContent.trim());

	let broadcasters = [], date = {}, duration;

	sidebarText.forEach((line) => {
		const productionMatch = line.match(/^(\D+?)(?:\s+(\d{4}))?$/);
		if (productionMatch) {
			broadcasters.push(...productionMatch[1].split(/\s+\/\s+/));
		}

		const broadcastMatch = line.match(/^Erstsendung:\s+(\d{2}\.\d{2}\.\d{4})\s+\|\s+(\d+'\d{2})$/);
		if (broadcastMatch) {
			date = zipObject(['day', 'month', 'year'], broadcastMatch[1].split('.'));
			duration = broadcastMatch[2].replace("'", ':');
		}
	});

	// parse and standardize the title
	let episodeTitle = title;
	let standardizedFullTitle = title;
	let disambiguationComment;

	const episodeMatch = title.match(/(.+?)\s+\((?:(\d+)\.\s+(Folge|Teil)(?:\s+\((.+?)\))?(?::\s+)?)?(.*)?\)$/);
	if (episodeMatch) {
		standardizedFullTitle = episodeMatch[1]; // main title or series title

		const episodeNumber = episodeMatch[2];
		if (episodeNumber) {
			standardizedFullTitle += `, ${episodeMatch[3]} ${episodeNumber}`;
		}

		disambiguationComment = episodeMatch[4];
		episodeTitle = episodeMatch[5];
		if (episodeTitle) {
			standardizedFullTitle += ': ' + episodeTitle;
		}
	}

	/** @type {MB.ReleaseSeed} */
	const release = {
		name: standardizedFullTitle,
		artist_credit: {
			names: authors.map((author, index) => ({
				name: author,
				artist: {
					name: author,
				},
				join_phrase: index === authors.length - 1 ? '' : ', ',
			})),
		},
		type: ['Broadcast', 'Audio drama'],
		events: [{
			country: 'DE',
			date,
		}],
		labels: broadcasters.map((name) => ({ name })),
		language: 'deu',
		script: 'Latn',
		status: 'Official',
		barcode: 'none',
		packaging: 'None',
		mediums: [{
			format: 'Digital Media',
			track: [{
				number: 1,
				name: episodeTitle ?? standardizedFullTitle,
				length: duration,
			}],
		}],
		urls: [{
			url: releaseURL.href,
			link_type: urlTypeIds['discography entry'],
		}],
		edit_note: buildEditNote(`Imported radio drama from ${releaseURL}`),
	};

	if (disambiguationComment) release.comment = disambiguationComment;

	const form = createReleaseSeederForm(release);
	qs('.sectionC .noPrint > p').prepend(form);

})();
