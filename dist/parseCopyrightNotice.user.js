// ==UserScript==
// @name          MusicBrainz: Parse copyright notice
// @version       2025.6.20
// @namespace     https://github.com/kellnerd/musicbrainz-scripts
// @author        kellnerd
// @description   Parses copyright notices and automates the process of creating release and recording relationships for these.
// @homepageURL   https://github.com/kellnerd/musicbrainz-scripts#parse-copyright-notice
// @downloadURL   https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/parseCopyrightNotice.user.js
// @updateURL     https://raw.github.com/kellnerd/musicbrainz-scripts/main/dist/parseCopyrightNotice.user.js
// @supportURL    https://github.com/kellnerd/musicbrainz-scripts/issues
// @grant         GM.getValue
// @grant         GM.setValue
// @run-at        document-idle
// @match         *://*.musicbrainz.org/release/*/edit-relationships
// ==/UserScript==

(function () {
	'use strict';

	/** @returns {DatePeriodRoleT} */
	function createDatePeriodForYear(year) {
		return {
			begin_date: { year },
			end_date: { year },
			ended: true,
		};
	}

	/**
	 * @param {CoreEntityTypeT} sourceType 
	 * @param {CoreEntityTypeT} targetType 
	 */
	function isRelBackward(sourceType, targetType, changeDirection = false) {
		if (sourceType === targetType) return changeDirection;
		return sourceType > targetType;
	}

	/**
	 * Taken from https://github.com/metabrainz/musicbrainz-server/blob/bf0d5ec41c7ddb6c5a8396bf3a64f74acaef9337/root/static/scripts/relationship-editor/hooks/useRelationshipDialogContent.js
	 * @type {Partial<import('../types/MBS/scripts/relationship-editor/state').RelationshipStateT>}
	 */
	const RELATIONSHIP_DEFAULTS = {
		_lineage: [],
		_original: null,
		_status: 1, // add relationship
		attributes: null,
		begin_date: null,
		editsPending: false,
		end_date: null,
		ended: false,
		entity0_credit: '',
		entity1_credit: '',
		id: null,
		linkOrder: 0,
		linkTypeID: null,
	};

	/**
	 * Returns a promise that resolves after the given delay.
	 * @param {number} ms Delay in milliseconds.
	 */
	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Periodically calls the given function until it returns `true` and resolves afterwards.
	 * @param {(...params) => boolean} pollingFunction
	 * @param {number} pollingInterval
	 */
	function waitFor(pollingFunction, pollingInterval) {
		return new Promise(async (resolve) => {
			while (pollingFunction() === false) {
				await delay(pollingInterval);
			}
			resolve();
		});
	}

	/**
	 * Returns a reference to the first DOM element with the specified value of the ID attribute.
	 * @param {string} elementId String that specifies the ID value.
	 */
	function dom(elementId) {
		return document.getElementById(elementId);
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
	 * Creates a dialog to add a relationship to the given source entity.
	 * @param {Object} options 
	 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
	 * @param {CoreEntityT | string} [options.target] Target entity object or name.
	 * @param {CoreEntityTypeT} [options.targetType] Target entity type, fallback if there is no full entity given.
	 * @param {number} [options.linkTypeId] Internal ID of the relationship type.
	 * @param {ExternalLinkAttrT[]} [options.attributes] Attributes for the relationship type.
	 * @param {boolean} [options.batchSelection] Batch-edit all selected entities which have the same type as the source.
	 * The source entity only acts as a placeholder in this case.
	 */
	async function createDialog({
		source = MB.relationshipEditor.state.entity,
		target,
		targetType,
		linkTypeId,
		attributes,
		batchSelection = false,
	} = {}) {
		const onlyTargetName = (typeof target === 'string');

		// prefer an explicit target entity option over only a target type
		if (target && !onlyTargetName) {
			targetType = target.entityType;
		}

		// open dialog modal for the source entity
		MB.relationshipEditor.dispatch({
			type: 'update-dialog-location',
			location: {
				source,
				batchSelection,
			},
		});

		// TODO: currently it takes ~2ms until `relationshipDialogDispatch` is exposed
		await waitFor(() => !!MB.relationshipEditor.relationshipDialogDispatch, 1);

		if (targetType) {
			MB.relationshipEditor.relationshipDialogDispatch({
				type: 'update-target-type',
				source,
				targetType,
			});
		}

		if (linkTypeId) {
			const linkType = MB.linkedEntities.link_type[linkTypeId];

			if (linkType) {
				MB.relationshipEditor.relationshipDialogDispatch({
					type: 'update-link-type',
					source,
					action: {
						type: 'update-autocomplete',
						source,
						action: {
							type: 'select-item',
							item: entityToSelectItem(linkType),
						},
					},
				});
			}
		}

		if (attributes) {
			setAttributes(attributes);
		}

		if (!target) return;

		/** @type {AutocompleteActionT[]} */
		const autocompleteActions = onlyTargetName ? [{
			type: 'type-value',
			value: target,
		}, { // search dropdown is unaffected by future actions which set credits or date periods
			type: 'search-after-timeout',
			searchTerm: target,
		}] : [{
			type: 'select-item',
			item: entityToSelectItem(target),
		}];

		// autofill the target entity as good as possible
		autocompleteActions.forEach((autocompleteAction) => {
			MB.relationshipEditor.relationshipDialogDispatch({
				type: 'update-target-entity',
				source,
				action: {
					type: 'update-autocomplete',
					source,
					action: autocompleteAction,
				},
			});
		});

		// focus target entity input if it could not be auto-selected
		if (onlyTargetName) {
			qs('input.relationship-target').focus();
		}
	}

	/**
	 * Creates a dialog to batch-add a relationship to each of the selected source entities.
	 * @param {import('weight-balanced-tree').ImmutableTree<CoreEntityT>} sourceSelection Selected source entities.
	 * @param {Omit<Parameters<typeof createDialog>[0], 'batchSelection' | 'source'>} options
	 */
	function createBatchDialog(sourceSelection, options = {}) {
		return createDialog({
			...options,
			source: sourceSelection.value, // use the root node entity as a placeholder
			batchSelection: true,
		});
	}

	/**
	 * Resolves after the current/next relationship dialog has been closed.
	 * @returns {Promise<RelationshipDialogFinalStateT>} The final state of the dialog when it was closed by the user.
	 */
	async function closingDialog() {
		return new Promise((resolve) => {
			// wait for the user to accept or cancel the dialog
			document.addEventListener('mb-close-relationship-dialog', (event) => {
				const finalState = event.dialogState;
				finalState.closeEventType = event.closeEventType;
				resolve(finalState);
			}, { once: true });
		});
	}

	/** @param {string} creditedAs Credited name of the target entity. */
	function creditTargetAs(creditedAs) {
		MB.relationshipEditor.relationshipDialogDispatch({
			type: 'update-target-entity',
			source: MB.relationshipEditor.state.dialogLocation.source,
			action: {
				type: 'update-credit',
				action: {
					type: 'set-credit',
					creditedAs,
				},
			},
		});
	}

	/**
	 * Sets the begin or end date of the current dialog.
	 * @param {PartialDateT} date
	 */
	function setDate(date, isBegin = true) {
		MB.relationshipEditor.relationshipDialogDispatch({
			type: 'update-date-period',
			action: {
				type: isBegin ? 'update-begin-date' : 'update-end-date',
				action: {
					type: 'set-date',
					date: date,
				},
			},
		});
	}

	/** @param {DatePeriodRoleT} datePeriod */
	function setDatePeriod(datePeriod) {
		setDate(datePeriod.begin_date, true);
		setDate(datePeriod.end_date, false);

		MB.relationshipEditor.relationshipDialogDispatch({
			type: 'update-date-period',
			action: {
				type: 'set-ended',
				enabled: datePeriod.ended,
			},
		});
	}

	/** @param {number} year */
	function setYear(year) {
		setDatePeriod({
			begin_date: { year },
			end_date: { year },
			ended: true,
		});
	}

	/**
	 * Sets the relationship attributes of the current dialog.
	 * @param {ExternalLinkAttrT[]} attributes 
	 */
	function setAttributes(attributes) {
		MB.relationshipEditor.relationshipDialogDispatch({
			type: 'set-attributes',
			attributes,
		});
	}

	/**
	 * @param {EntityItemT} entity 
	 * @returns {OptionItemT}
	 */
	function entityToSelectItem(entity) {
		return {
			type: 'option',
			id: entity.id,
			name: entity.name,
			entity,
		};
	}

	/**
	 * @typedef {import('../types/MBS/scripts/autocomplete2.js').EntityItemT} EntityItemT
	 * @typedef {import('../types/MBS/scripts/autocomplete2.js').OptionItemT<EntityItemT>} OptionItemT
	 * @typedef {import('../types/MBS/scripts/autocomplete2.js').ActionT<EntityItemT>} AutocompleteActionT
	 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').ExternalLinkAttrT} ExternalLinkAttrT
	 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').RelationshipDialogStateT & { closeEventType: 'accept' | 'cancel' }} RelationshipDialogFinalStateT
	 */

	/**
	 * Creates a relationship between the given source and target entity.
	 * @param {RelationshipProps & { source?: CoreEntityT, target: CoreEntityT, batchSelectionCount?: number }} options
	 * @param {CoreEntityT} [options.source] Source entity, defaults to the currently edited entity.
	 * @param {CoreEntityT} options.target Target entity.
	 * @param {number} [options.batchSelectionCount] Batch-edit all selected entities which have the same type as the source.
	 * The source entity only acts as a placeholder in this case.
	 * @param {RelationshipProps} props Relationship properties.
	 */
	function createRelationship({
		source = MB.relationshipEditor.state.entity,
		target,
		batchSelectionCount = null,
		...props
	}) {
		const backward = isRelBackward(source.entityType, target.entityType, props.backward ?? false);

		MB.relationshipEditor.dispatch({
			type: 'update-relationship-state',
			sourceEntity: source,
			batchSelectionCount,
			creditsToChangeForSource: '',
			creditsToChangeForTarget: '',
			newRelationshipState: {
				...RELATIONSHIP_DEFAULTS,
				entity0: backward ? target : source,
				entity1: backward ? source : target,
				id: MB.relationshipEditor.getRelationshipStateId(),
				...props,
			},
			oldRelationshipState: null,
		});
	}

	/**
	 * Creates the same relationship between each of the selected source entities and the given target entity.
	 * @param {import('weight-balanced-tree').ImmutableTree<CoreEntityT>} sourceSelection Selected source entities.
	 * @param {CoreEntityT} target Target entity.
	 * @param {RelationshipProps} props Relationship properties.
	 */
	function batchCreateRelationships(sourceSelection, target, props) {
		return createRelationship({
			source: sourceSelection.value, // use the root node entity as a placeholder
			target,
			batchSelectionCount: sourceSelection.size,
			...props,
		});
	}

	/**
	 * @typedef {import('weight-balanced-tree').ImmutableTree<LinkAttrT>} LinkAttrTree
	 * @typedef {Partial<Omit<RelationshipT, 'attributes'> & { attributes: LinkAttrTree }>} RelationshipProps
	 * @typedef {import('../types/MBS/scripts/relationship-editor/state.js').ExternalLinkAttrT} ExternalLinkAttrT
	 */

	/**
	 * MBS relationship link type IDs (incomplete).
	 * @type {Record<CoreEntityTypeT, Record<CoreEntityTypeT, Record<string, number>>>}
	 */
	const LINK_TYPES = {
		release: {
			artist: {
				'©': 709,
				'℗': 710,
			},
			label: {
				'©': 708,
				'℗': 711,
				'licensed from': 712,
				'licensed to': 833,
				'distributed by': 361,
				'manufactured by': 360,
				'marketed by': 848,
			},
		},
		recording: {
			artist: {
				'℗': 869,
			},
			label: {
				'℗': 867,
			},
		},
	};

	/**
	 * Returns the internal ID of the requested relationship link type.
	 * @param {CoreEntityTypeT} sourceType Type of the source entity.
	 * @param {CoreEntityTypeT} targetType Type of the target entity.
	 * @param {string} relType 
	 */
	function getLinkTypeId(sourceType, targetType, relType) {
		const linkTypeId = LINK_TYPES[targetType]?.[sourceType]?.[relType];

		if (linkTypeId) {
			return linkTypeId;
		} else {
			throw new Error(`Unsupported ${sourceType}-${targetType} relationship type '${relType}'`);
		}
	}

	/**
	 * Fetches the entity with the given MBID from the internal API ws/js.
	 * @param {MB.MBID} gid MBID of the entity.
	 * @returns {Promise<CoreEntityT>}
	 */
	async function fetchEntity(gid) {
		const result = await fetch(`/ws/js/entity/${gid}`);
		return result.json();
	}

	/**
	 * @template Params
	 * @template Result
	 * @template {string | number} Key
	 */
	class FunctionCache {
		/**
		 * @param {(...params: Params) => Result | Promise<Result>} expensiveFunction Expensive function whose results should be cached.
		 * @param {Object} options
		 * @param {(...params: Params) => Key[]} options.keyMapper Maps the function parameters to the components of the cache's key.
		 * @param {string} [options.name] Name of the cache, used as storage key (optional).
		 * @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
		 * @param {Record<Key, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
		 */
		constructor(expensiveFunction, options) {
			this.expensiveFunction = expensiveFunction;
			this.keyMapper = options.keyMapper;
			this.name = options.name ?? `defaultCache`;
			this.storage = options.storage;
			this.data = options.data ?? {};
		}

		/**
		 * Looks up the result for the given parameters and returns it.
		 * If the result is not cached, it will be calculated and added to the cache.
		 * @param {Params} params 
		 */
		async get(...params) {
			const keys = this.keyMapper(...params);
			const lastKey = keys.pop();
			if (!lastKey) return;

			const record = this._get(keys);
			if (record[lastKey] === undefined) {
				// create a new entry to cache the result of the expensive function
				const newEntry = await this.expensiveFunction(...params);
				if (newEntry !== undefined) {
					record[lastKey] = newEntry;
				}
			}

			return record[lastKey];
		}

		/**
		 * Manually sets the cache value for the given key.
		 * @param {Key[]} keys Components of the key.
		 * @param {Result} value 
		 */
		set(keys, value) {
			const lastKey = keys.pop();
			this._get(keys)[lastKey] = value;
		}

		/**
		 * Loads the persisted cache entries.
		 */
		load() {
			const storedData = this.storage?.getItem(this.name);
			if (storedData) {
				this.data = JSON.parse(storedData);
			}
		}

		/**
		 * Persists all entries of the cache.
		 */
		store() {
			this.storage?.setItem(this.name, JSON.stringify(this.data));
		}

		/**
		 * Clears all entries of the cache and persists the changes.
		 */
		clear() {
			this.data = {};
			this.store();
		}

		/**
		 * Returns the cache record which is indexed by the key.
		 * @param {Key[]} keys Components of the key.
		 */
		_get(keys) {
			let record = this.data;
			keys.forEach((key) => {
				if (record[key] === undefined) {
					// create an empty record for all missing keys
					record[key] = {};
				}
				record = record[key];
			});
			return record;
		}
	}

	/**
	 * Temporary cache for fetched entities from the ws/js API.
	 */
	const entityCache = new FunctionCache(fetchEntity, {
		keyMapper: (gid) => [gid],
	});

	/**
	 * @template Params
	 * @template Result
	 * @template {string | number} Key
	 * @extends {FunctionCache<Params, Result, Key>}
	 */
	class SimpleCache extends FunctionCache {
		/**
		* @param {Object} options
		* @param {string} [options.name] Name of the cache, used as storage key (optional).
		* @param {Storage} [options.storage] Storage which should be used to persist the cache (optional).
		* @param {Record<Key, Result>} [options.data] Record which should be used as cache (defaults to an empty record).
		*/
		constructor(options) {
			// use a dummy function to make the function cache fail without actually running an expensive function
			super((...params) => undefined, {
				...options,
				keyMapper: (...params) => params,
			});
		}
	}

	/** @type {SimpleCache<[entityType: CoreEntityTypeT, name: string], MB.MBID>} */
	const nameToMBIDCache = new SimpleCache({
		name: 'nameToMBIDCache',
		storage: window.localStorage,
	});

	/**
	 * Converts an array with a single element into a scalar.
	 * @template T
	 * @param {T | T[]} maybeArray 
	 * @returns A scalar or the input array if the conversion is not possible.
	 */
	function preferScalar(maybeArray) {
		if (Array.isArray(maybeArray) && maybeArray.length === 1) return maybeArray[0];
		return maybeArray;
	}

	/**
	 * Converts a scalar into an array with a single element.
	 * @template T
	 * @param {T | T[]} maybeArray 
	 */
	function preferArray(maybeArray) {
		if (!Array.isArray(maybeArray)) return [maybeArray];
		return maybeArray;
	}

	/**
	 * Simplifies the given name to ease matching of strings.
	 * @param {string} name 
	 */
	function simplifyName(name) {
		return name.normalize('NFKD') // Unicode NFKD compatibility decomposition
			.replace(/[^\p{L}\d]/ug, '') // keep only letters and numbers, remove e.g. combining diacritical marks of decompositions
			.toLowerCase();
	}

	/**
	 * Creates and fills an "Add relationship" dialog for each piece of copyright information.
	 * Lets the user choose the appropriate target label or artist and waits for the dialog to close before continuing with the next one.
	 * @param {CopyrightItem[]} copyrightInfo List of copyright items.
	 * @param {object} [customOptions]
	 * @param {boolean} [customOptions.bypassCache] Bypass the name to MBID cache to overwrite wrong entries, disabled by default.
	 * @param {boolean} [customOptions.forceArtist] Force names to be treated as artist names, disabled by default.
	 * @param {boolean} [customOptions.useAllYears] Adds one (release) relationship for each given year instead of a single undated relationship, disabled by default.
	 * @returns {Promise<CreditParserLineStatus>} Status of the given copyright info (Have relationships been added for all copyright items?).
	 */
	async function addCopyrightRelationships(copyrightInfo, customOptions = {}) {
		// provide default options
		const options = {
			bypassCache: false,
			forceArtist: false,
			useAllYears: false,
			...customOptions,
		};

		/** @type {ReleaseT} */
		const release = MB.relationshipEditor.state.entity;
		const releaseArtistNames = release.artistCredit.names // all release artists
			.flatMap((name) => [name.name, name.artist.name]) // entity name & credited name (possible redundancy doesn't matter)
			.map(simplifyName);

		/** @type {import('weight-balanced-tree').ImmutableTree<RecordingT> | null} */
		const selectedRecordings = MB.relationshipEditor.state.selectedRecordings;

		let addedRelCount = 0;
		let skippedDialogs = false;

		for (const copyrightItem of copyrightInfo) {
			// detect artists who own the copyright of their own release
			const targetType = options.forceArtist || releaseArtistNames.includes(simplifyName(copyrightItem.name)) ? 'artist' : 'label';

			/**
			 * There are multiple ways to fill the relationship's target entity:
			 * (1) Directly map the name to an MBID (if the name is already cached).
			 * (2) Just fill in the name and let the user select an entity (in manual mode or when the cache is bypassed).
			 */
			const targetMBID = !options.bypassCache && await nameToMBIDCache.get(targetType, copyrightItem.name); // (1a)
			let targetEntity = targetMBID
				? await entityCache.get(targetMBID) // (1b)
				: copyrightItem.name; // (2a)

			for (const type of copyrightItem.types) {
				// add all copyright rels to the release
				try {
					const linkTypeId = getLinkTypeId(targetType, 'release', type);
					let years = preferArray(copyrightItem.year);

					// do not use all years if there are multiple unspecific ones (unless enabled)
					if (years.length !== 1 && !options.useAllYears) {
						years = [undefined]; // prefer a single undated relationship
					}

					for (const year of years) {
						if (typeof targetEntity === 'string') { // (2b)
							await createDialog({
								target: targetEntity,
								targetType: targetType,
								linkTypeId,
							});
							targetEntity = await fillAndProcessDialog({ ...copyrightItem, year });
						} else { // (1c)
							createRelationship({
								target: targetEntity,
								linkTypeID: linkTypeId,
								entity0_credit: copyrightItem.name,
								...(year ? createDatePeriodForYear(year) : {}),
							});
							addedRelCount++;
						}
					}
				} catch (error) {
					console.warn(`Skipping copyright item for '${copyrightItem.name}':`, error.message);
					skippedDialogs = true;
				}

				// also add phonographic copyright rels to all selected recordings
				if (type === '℗' && selectedRecordings) {
					try {
						const linkTypeId = getLinkTypeId(targetType, 'recording', type);
						if (typeof targetEntity === 'string') {
							await createBatchDialog(selectedRecordings, {
								target: targetEntity,
								linkTypeId,
							});
							targetEntity = await fillAndProcessDialog(copyrightItem);
						} else {
							// do not fill the date if there are multiple unspecific years
							let datePeriod = {};
							if (copyrightItem.year && !Array.isArray(copyrightItem.year)) {
								datePeriod = createDatePeriodForYear(copyrightItem.year);
							}

							batchCreateRelationships(selectedRecordings, targetEntity, {
								linkTypeID: linkTypeId,
								entity0_credit: copyrightItem.name,
								...datePeriod,
							});
							addedRelCount += selectedRecordings.size;
						}
					} catch (error) {
						console.warn(`Skipping copyright item for '${copyrightItem.name}':`, error.message);
						skippedDialogs = true;
					}
				}
			}
		}

		return addedRelCount > 0 ? (skippedDialogs ? 'partial' : 'done') : 'skipped';

		/**
		 * @param {CopyrightItem} copyrightItem
		 */
		async function fillAndProcessDialog(copyrightItem) {
			creditTargetAs(copyrightItem.name);

			// do not fill the date if there are multiple unspecific years
			if (copyrightItem.year && !Array.isArray(copyrightItem.year)) {
				setYear(copyrightItem.year);
			}

			// remember the entity which the user has chosen for the given name
			const finalState = await closingDialog();

			if (finalState.closeEventType === 'accept') {
				const targetEntity = finalState.targetEntity.target;
				const creditedName = finalState.targetEntity.creditedAs;
				nameToMBIDCache.set([targetEntity.entityType, creditedName || targetEntity.name], targetEntity.gid);
				addedRelCount++;
				return targetEntity;
			} else {
				skippedDialogs = true;
				return copyrightItem.name; // keep name as target entity
			}
		}
	}

	// Adapted from https://stackoverflow.com/a/46012210

	Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

	const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;

	/**
	 * Sets the value of a textarea input element which has been manipulated by React.
	 * @param {HTMLTextAreaElement} input 
	 * @param {string} value 
	 */
	function setReactTextareaValue(input, value) {
		nativeTextareaValueSetter.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}

	/**
	 * Adds the given message and a footer for the active userscript to the edit note.
	 * @param {string} message Edit note message.
	 */
	function addMessageToEditNote(message) {
		/** @type {HTMLTextAreaElement} */
		const editNoteInput = qs('#edit-note-text, .edit-note');
		const previousContent = editNoteInput.value.split(editNoteSeparator);
		setReactTextareaValue(editNoteInput, buildEditNote(...previousContent, message));
	}

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
	 * Returns the unique elements of the given array (JSON comparison).
	 * @template T
	 * @param {T[]} array 
	 */
	function getUniqueElementsByJSON(array) {
		// use a Map to keep the order of elements, the JSON representation is good enough as a unique key for our use
		return Array.from(new Map(
			array.map((element) => [JSON.stringify(element), element])
		).values());
	}

	/**
	 * Transforms the given value using the given substitution rules.
	 * @param {string} value
	 * @param {import('../types').SubstitutionRule[]} substitutionRules Pairs of values for search & replace.
	 * @returns {string}
	 */
	function transform(value, substitutionRules) {
		substitutionRules.forEach(([searchValue, replaceValue]) => {
			value = value.replace(searchValue, replaceValue);
		});
		return value;
	}

	const copyrightRE = /([©℗](?:\s*[&+]?\s*[©℗])?)(?:.+?;)?\s*(\d{4}(?:\s*[,&/+]\s*\d{4})*)?(?:[^,.]*\sby|\sthis\scompilation)?\s+/;

	const legalInfoRE = /((?:(?:licen[sc]ed?\s(?:to|from)|(?:distributed|manufactured|marketed)(?:\sby)?)(?:\sand)?\s)+)/;

	/** @type {CreditParserOptions} */
	const parserDefaults = {
		nameRE: /.+?(?:,?\s(?:LLC|LLP|(?:Corp|Inc|Ltd)\.?|Co\.(?:\sKG)?|(?:\p{Letter}\.){2,}))*/,
		nameSeparatorRE: /[/|](?=\s|\w{2})|\s[–-]\s/,
		terminatorRE: /$|(?=,|(?<!Bros)\.(?:\W|$)|\sunder\s)|(?<=(?<!Bros)\.)\W/,
	};

	/**
	 * Extracts all copyright and legal information from the given text.
	 * @param {string} text 
	 * @param {Partial<CreditParserOptions>} [customOptions]
	 */
	function parseCopyrightNotice(text, customOptions = {}) {
		// provide default options
		const options = {
			...parserDefaults,
			...customOptions,
		};

		/** @type {CopyrightItem[]} */
		const copyrightInfo = [];
		const namePattern = options.nameRE.source;
		const terminatorPattern = options.terminatorRE.source;

		// standardize copyright notice
		text = transform(text, [
			[/\(C\)/gi, '©'],
			[/\(P\)/gi, '℗'],

			// remove a-tisket's French quotes
			[/«(.+?)»/g, '$1'],

			// simplify region-specific copyrights
			[/for (.+?) and (.+?) for the world outside (?:of )?\1/g, '/ $2'],

			// simplify license text
			[/as licen[sc]ee for/gi, 'under license from'],

			// drop confusingly used ℗ symbols and text between ℗ symbol and year
			[/℗\s*(under\s)/gi, '$1'],
			[/(?<=℗\s*)digital remaster/gi, ''],

			// split © & ℗ with different years into two lines
			[/([©℗]\s*\d{4})\s*[&+]?\s*([©℗]\s*\d{4})(.+)$/g, '$1$3\n$2$3'],
		]);

		const copyrightMatches = text.matchAll(new RegExp(
			String.raw`${copyrightRE.source}(?:\s*[–-]\s+)?(${namePattern}(?:\s*/\s*${namePattern})*)(?:${terminatorPattern})`,
			'gimu'));

		for (const match of copyrightMatches) {
			const names = match[3].split(options.nameSeparatorRE).map((name) => name.trim());
			const types = match[1].split(/[&+]|(?<=[©℗])\s*(?=[©℗])/).map(cleanType);
			const years = match[2]?.split(/[,&/+]/).map((year) => year.trim());

			names.forEach((name) => {
				// skip fake copyrights which contain the release label
				if (/an?\s(.+?)\srelease/i.test(name)) return;

				copyrightInfo.push({
					name,
					types,
					year: preferScalar(years),
				});
			});
		}

		const legalInfoMatches = text.matchAll(new RegExp(
			String.raw`${legalInfoRE.source}(?:\s*[–-]\s+)?(${namePattern})(?:${terminatorPattern})`,
			'gimu'));

		for (const match of legalInfoMatches) {
			const types = match[1].split(/\sand\s/).map(cleanType);
			copyrightInfo.push({
				name: match[2],
				types,
			});
		}

		return getUniqueElementsByJSON(copyrightInfo);
	}

	/**
	 * Cleans and standardizes the given free text copyright/legal type.
	 * @param {string} type 
	 */
	function cleanType(type) {
		return transform(type.toLowerCase().trim(), [
			[/licen[sc]ed?/g, 'licensed'],
			[/(distributed|manufactured|marketed)(\sby)?/, '$1 by'],
		]);
	}

	/** Resolves as soon as the React relationship editor is ready. */
	function readyRelationshipEditor() {
		const reactRelEditor = qs('.release-relationship-editor');
		if (!reactRelEditor) return Promise.reject(new Error('Release relationship editor has not been found'));
		// wait for the loading message to disappear (takes ~1s)
		return waitFor(() => !qs('.release-relationship-editor > .loading-message'), 100);
	}

	// adapted from https://stackoverflow.com/a/25621277

	/**
	 * Resizes the bound element to be as tall as necessary for its content.
	 * @this {HTMLElement}
	 */
	function automaticHeight() {
		this.style.height = 'auto';
		this.style.height = this.scrollHeight + 'px';
	}

	/**
	 * Resizes the bound element to be as wide as necessary for its content.
	 * @this {HTMLElement} this 
	 */
	function automaticWidth() {
		this.style.width = 'auto';
		this.style.width = this.scrollWidth + 10 + 'px'; // account for border and padding
	}

	/**
	 * Creates a DOM element from the given HTML fragment.
	 * @param {string} html HTML fragment.
	 */
	function createElement(html) {
		const template = document.createElement('template');
		template.innerHTML = html;
		return template.content.firstElementChild;
	}

	/**
	 * Creates a style element from the given CSS fragment and injects it into the document's head.
	 * @param {string} css CSS fragment.
	 * @param {string} userscriptName Name of the userscript, used to generate an ID for the style element.
	 */
	function injectStylesheet(css, userscriptName) {
		const style = document.createElement('style');
		if (userscriptName) {
			style.id = [userscriptName, 'userscript-css'].join('-');
		}
		style.innerText = css;
		document.head.append(style);
	}

	/** Pattern to match an ES RegExp string representation. */
	const regexPattern = /^\/(.+?)\/([gimsuy]*)$/;

	/**
	 * Escapes special characters in the given string to use it as part of a regular expression.
	 * @param {string} string 
	 * @link https://stackoverflow.com/a/6969486
	 */
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	/**
	 * Returns the value of the given pattern as a regular expression if it is enclosed between slashes.
	 * Otherwise it returns the input string or throws for invalid regular expressions.
	 * @param {string} pattern 
	 * @returns {RegExp | string}
	 */
	function getPattern(pattern) {
		const match = pattern.match(regexPattern);
		if (match) {
			return new RegExp(match[1], match[2]);
		} else {
			return pattern;
		}
	}

	/**
	 * Converts the value of the given pattern into a regular expression and returns it.
	 * @param {string} pattern 
	 */
	function getPatternAsRegExp(pattern) {
		try {
			let value = getPattern(pattern);
			if (typeof value === 'string') {
				value = new RegExp(escapeRegExp(value));
			}
			return value;
		} catch {
			return;
		}
	}

	/**
	 * Converts a string into an identifier that is compatible with Markdown's heading anchors.
	 * @param {string} string
	 */
	function slugify(string) {
		return encodeURIComponent(
			string.trim()
				.toLowerCase()
				.replace(/\s+/g, '-')
		);
	}

	/**
	 * Persists the desired attribute of the given element across page loads and origins.
	 * @param {HTMLElement} element 
	 * @param {keyof HTMLElement} attribute 
	 * @param {keyof HTMLElementEventMap} eventType
	 * @param {string | number | boolean} [defaultValue] Default value of the attribute.
	 */
	async function persistElement(element, attribute, eventType, defaultValue) {
		if (!element.id) {
			throw new Error('Can not persist an element without ID');
		}

		const key = ['persist', element.id, attribute].join('.');

		// initialize attribute
		const persistedValue = await GM.getValue(key, defaultValue);
		if (persistedValue) {
			element[attribute] = persistedValue;
		}

		// persist attribute once the event occurs
		element.addEventListener(eventType, () => {
			GM.setValue(key, element[attribute]);
		});

		return element;
	}

	/**
	 * Persists the state of the checkbox with the given ID across page loads and origins.
	 * @param {string} id 
	 * @param {boolean} [checkedByDefault]
	 * @returns {Promise<HTMLInputElement>}
	 */
	function persistCheckbox(id, checkedByDefault) {
		return persistElement(dom(id), 'checked', 'change', checkedByDefault);
	}

	/**
	 * Persists the state of the collapsible details container with the given ID across page loads and origins.
	 * @param {string} id 
	 * @param {boolean} [openByDefault]
	 * @returns {Promise<HTMLDetailsElement>}
	 */
	function persistDetails(id, openByDefault) {
		return persistElement(dom(id), 'open', 'toggle', openByDefault);
	}

	/**
	 * Persists the value of the given input field across page loads and origins.
	 * @param {HTMLInputElement | HTMLTextAreaElement} element 
	 * @param {string} [defaultValue]
	 * @returns {Promise<HTMLInputElement>}
	 */
	function persistInput(element, defaultValue) {
		return persistElement(element, 'value', 'change', defaultValue);
	}

	const creditParserUI = `
<details id="credit-parser">
<summary>
	<h2>Credit Parser</h2>
</summary>
<form>
	<details id="credit-parser-config">
		<summary><h3>Advanced configuration</h3></summary>
		<ul id="credit-patterns"></ul>
	</details>
	<div class="row">
		<textarea name="credit-input" id="credit-input" cols="120" rows="1" placeholder="Paste credits here…"></textarea>
	</div>
	<div class="row">
		Identified relationships will be added to the release and/or the matching recordings and works (only if these are selected).
	</div>
	<div class="row">
		<input type="checkbox" name="remove-parsed-lines" id="remove-parsed-lines" />
		<label class="inline" for="remove-parsed-lines">Remove parsed lines</label>
		<input type="checkbox" name="parser-autofocus" id="parser-autofocus" />
		<label class="inline" for="parser-autofocus">Autofocus the parser on page load</label>
	</div>
	<div class="row buttons">
	</div>
</form>
</details>`;

	const css = `
details#credit-parser summary {
	cursor: pointer;
	display: block;
}
details#credit-parser summary > h2, details#credit-parser summary > h3 {
	display: list-item;
}
textarea#credit-input {
	overflow-y: hidden;
}
#credit-parser label[title] {
	border-bottom: 1px dotted;
	cursor: help;
}`;

	const uiReadyEventType = 'credit-parser-ui-ready';

	/**
	 * Injects the basic UI of the credit parser and waits until the UI has been expanded before it continues with the build tasks.
	 * @param {...(() => void)} buildTasks Handlers which can be registered for additional UI build tasks.
	 */
	async function buildCreditParserUI(...buildTasks) {
		await readyRelationshipEditor();

		/** @type {HTMLDetailsElement} */
		const existingUI = dom('credit-parser');

		// possibly called by multiple userscripts, do not inject the UI again
		if (!existingUI) {
			// inject credit parser between the sections for track and release relationships,
			// use the "Release Relationships" heading as orientation since #tracklist is missing for releases without mediums
			qs('.release-relationship-editor > h2:nth-of-type(2)').insertAdjacentHTML('beforebegin', creditParserUI);
			injectStylesheet(css, 'credit-parser');
		}

		// execute all additional build tasks once the UI is open and ready
		if (existingUI && existingUI.open) {
			// our custom event already happened because the UI builder code is synchronous
			buildTasks.forEach((task) => task());
		} else {
			// wait for our custom event if the UI is not (fully) initialized or is collapsed
			buildTasks.forEach((task) => document.addEventListener(uiReadyEventType, () => task(), { once: true }));
		}

		if (existingUI) return;

		// continue initialization of the UI once it has been opened
		persistDetails('credit-parser', true).then((UI) => {
			if (UI.open) {
				initializeUI();
			} else {
				UI.addEventListener('toggle', initializeUI, { once: true });
			}
		});
	}

	async function initializeUI() {
		const creditInput = dom('credit-input');

		// persist the state of the UI
		persistCheckbox('remove-parsed-lines');
		await persistCheckbox('parser-autofocus');
		persistDetails('credit-parser-config').then((config) => {
			// hidden pattern inputs have a zero width, so they have to be resized if the config has not been open initially
			if (!config.open) {
				config.addEventListener('toggle', () => {
					qsa('input.pattern', config).forEach((input) => automaticWidth.call(input));
				}, { once: true });
			}
		});

		// auto-resize the credit textarea on input
		creditInput.addEventListener('input', automaticHeight);

		// load seeded data from hash
		const seededData = new URLSearchParams(window.location.hash.slice(1));
		const seededCredits = seededData.get('credits');
		if (seededCredits) {
			setTextarea(creditInput, seededCredits);
			const seededEditNote = seededData.get('edit-note');
			if (seededEditNote) {
				addMessageToEditNote(seededEditNote);
			}
		}

		addButton('Load annotation', (creditInput) => {
			/** @type {ReleaseT} */
			const release = MB.relationshipEditor.state.entity;
			const annotation = release.latest_annotation;
			if (annotation) {
				setTextarea(creditInput, annotation.text);
			}
		});

		addPatternInput({
			label: 'Credit terminator',
			description: 'Matches the end of a credit (default when empty: end of line)',
			defaultValue: parserDefaults.terminatorRE,
		});

		addPatternInput({
			label: 'Credit separator',
			description: 'Splits a credit into role and artist (disabled when empty)',
			defaultValue: /\s[–-]\s|:\s|\t+/,
		});

		addPatternInput({
			label: 'Name separator',
			description: 'Splits the extracted name into multiple names (disabled when empty)',
			defaultValue: parserDefaults.nameSeparatorRE,
		});

		// trigger all additional UI build tasks
		document.dispatchEvent(new CustomEvent(uiReadyEventType));

		// focus the credit parser input (if this setting is enabled)
		if (dom('parser-autofocus').checked) {
			creditInput.scrollIntoView();
			creditInput.focus();
		}
	}

	/**
	 * Adds a new button with the given label and click handler to the credit parser UI.
	 * @param {string} label 
	 * @param {(creditInput: HTMLTextAreaElement, event: MouseEvent) => any} clickHandler 
	 * @param {string} [description] Description of the button, shown as tooltip.
	 */
	function addButton(label, clickHandler, description) {
		/** @type {HTMLTextAreaElement} */
		const creditInput = dom('credit-input');

		/** @type {HTMLButtonElement} */
		const button = createElement(`<button type="button">${label}</button>`);
		if (description) {
			button.title = description;
		}

		button.addEventListener('click', (event) => clickHandler(creditInput, event));

		return qs('#credit-parser .buttons').appendChild(button);
	}

	/**
	 * Adds a new parser button with the given label and handler to the credit parser UI.
	 * @param {string} label 
	 * @param {(creditLine: string, event: MouseEvent) => import('@kellnerd/es-utils').MaybePromise<CreditParserLineStatus>} parser
	 * Handler which parses the given credit line and returns whether it was successful.
	 * @param {string} [description] Description of the button, shown as tooltip.
	 */
	function addParserButton(label, parser, description) {
		/** @type {HTMLInputElement} */
		const removeParsedLines = dom('remove-parsed-lines');

		return addButton(label, async (creditInput, event) => {
			const credits = creditInput.value.split('\n').map((line) => line.trim());
			const parsedLines = [], skippedLines = [];

			for (const line of credits) {
				// skip empty lines, but keep them for display of skipped lines
				if (!line) {
					skippedLines.push(line);
					continue;
				}

				// treat partially parsed lines as both skipped and parsed
				const parserStatus = await parser(line, event);
				if (parserStatus !== 'skipped') {
					parsedLines.push(line);
				}
				if (parserStatus !== 'done') {
					skippedLines.push(line);
				}
			}

			if (parsedLines.length) {
				addMessageToEditNote(parsedLines.join('\n'));
			}

			if (removeParsedLines.checked) {
				setTextarea(creditInput, skippedLines.join('\n'));
			}
		}, description);
	}

	/**
	 * Adds a persisted input field for regular expressions with a validation handler to the credit parser UI.
	 * @param {object} config
	 * @param {string} [config.id] ID and name of the input element (derived from `label` if missing).
	 * @param {string} config.label Content of the label (without punctuation).
	 * @param {string} config.description Description which should be used as tooltip.
	 * @param {string} config.defaultValue Default value of the input.
	 */
	function addPatternInput(config) {
		const id = config.id || slugify(config.label);
		/** @type {HTMLInputElement} */
		const patternInput = createElement(`<input type="text" class="pattern" name="${id}" id="${id}" placeholder="String or /RegExp/" />`);

		const explanationLink = document.createElement('a');
		explanationLink.innerText = 'help';
		explanationLink.target = '_blank';
		explanationLink.title = 'Displays a diagram representation of this RegExp';

		const resetButton = createElement(`<button type="button" title="Reset the input to its default value">Reset</button>`);
		resetButton.addEventListener('click', () => setInput(patternInput, config.defaultValue));

		// auto-resize the pattern input on input
		patternInput.addEventListener('input', automaticWidth);

		// validate pattern and update explanation link on change
		patternInput.addEventListener('change', function () {
			explanationLink.href = 'https://kellnerd.github.io/regexper/#' + encodeURIComponent(getPatternAsRegExp(this.value) ?? this.value);
			this.classList.remove('error', 'success');
			this.title = '';

			try {
				if (getPattern(this.value) instanceof RegExp) {
					this.classList.add('success');
					this.title = 'Valid regular expression';
				}
			} catch (error) {
				this.classList.add('error');
				this.title = `Invalid regular expression: ${error.message}\nThe default value will be used.`;
			}
		});

		// inject label, input, reset button and explanation link
		const container = document.createElement('li');
		container.insertAdjacentHTML('beforeend', `<label for="${id}" title="${config.description}">${config.label}:</label>`);
		container.append(' ', patternInput, ' ', resetButton, ' ', explanationLink);
		dom('credit-patterns').appendChild(container);

		// persist the input and calls the setter for the initial value (persisted value or the default)
		persistInput(patternInput, config.defaultValue).then(setInput);

		return patternInput;
	}

	/**
	 * Sets the input to the given value (optional), resizes it and triggers persister and validation.
	 * @param {HTMLInputElement} input 
	 * @param {string} [value] 
	 */
	function setInput(input, value) {
		if (value) input.value = value;
		automaticWidth.call(input);
		input.dispatchEvent(new Event('change'));
	}

	/**
	 * Sets the textarea to the given value and adjusts the height.
	 * @param {HTMLTextAreaElement} textarea 
	 * @param {string} value 
	 */
	function setTextarea(textarea, value) {
		textarea.value = value;
		automaticHeight.call(textarea);
	}

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
					bypassCache: event.ctrlKey || event.metaKey,
					useAllYears: event.altKey,
				});
				nameToMBIDCache.store();
				return result;
			} else {
				return 'skipped';
			}
		}, [
			'SHIFT key to force names to be treated as artist names',
			'CTRL or ⌘ key to bypass the cache and force a search',
			'ALT key to add multiple relationships for multiple years',
		].join('\n'));
	}

	buildCreditParserUI(buildCopyrightParserUI);

})();
