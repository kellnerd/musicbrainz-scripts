import type {
	primaryTypeIds,
	secondaryTypeIds,
} from '../../data/releaseGroup.js';
import type {
	statusTypeIds,
	packagingTypeIds,
	urlTypeIds,
} from '../../data/release.js';

namespace MB {
	// adapted from https://musicbrainz.org/doc/Development/Release_Editor_Seeding
	type ReleaseSeed = {
		/** The name of the release. Non-empty string. Required. */
		name: string;
	} & Partial<{
		/**
		 * The MBID of an existing release group.
		 * Alternatively we can create a new release group which will have the name of the release by listing its type(s).
		 */
		release_group: string;
		/**
		 * The type(s) of the release group that will be created.
		 * The possible values are the names of the release group types, in English (see the documentation).
		 * This can be specified multiple times to select multiple secondary types, though only one primary type should be
		 * specified (if you specify more than one, only one will be set).
		 */
		type: MaybeArray<ReleaseGroupSeed.Type>;
		/** A disambiguation comment for the release. Non-empty string. */
		comment: string;
		/** Text to place in the releases annotation. Use a text area / multi-line text. */
		annotation: string;
		/** The barcode of the release. May be any valid barcode without whitespace. To indicate there is no barcode, seed "none". */
		barcode: string;
		/**
		 * The language of the release.
		 * May be any valid [ISO 639-3](https://en.wikipedia.org/wiki/List_of_ISO_639-3_codes) code (for example: `eng`, `deu`, `jpn`).
		 */
		language: string;
		/**
		 * The script of the text on the release.
		 * May be any valid [ISO 15924](https://en.wikipedia.org/wiki/ISO_15924) code (for example: `Latn`, `Cyrl`).
		 */
		script: string;
		/** The status of the release, as defined by MusicBrainz. */
		status: ReleaseSeed.Status;
		/** The type of packaging of the release. The possible values are the names of the release group types, in English (see the documentation). */
		packaging: ReleaseSeed.Packaging;

		/**
		 * A release can have zero, one or several release events. Each release event is composed of a date and a country.
		 * Any of the fields can be omitted or sent blank if unknown (so, you can seed only the year and country, or only the month and day).
		 */
		events: Array<Partial<{
			/** The date of the release event. Each field is an integer. */
			date: Partial<{
				year: number;
				month: number;
				day: number;
			}>;
			/** The country of the release event. May be any valid country ISO code (for example: `GB`, `US`, `FR`). */
			country: string;
		}>>;

		/** Releases may be associated with multiple labels and catalog numbers. */
		labels: Array<Partial<{
			/** The MBID of the label. */
			mbid: string;
			/** The catalog number of this release, for the current label. */
			catalog_number: string;
			/**
			 * The name of the label (to prefill the field in order to search for the label via the site interface).
			 * If an MBID is present, this value is ignored.
			 */
			name: string;
		}>>;

		/** A release may be credited to multiple artists via what is known as an Artist Credit. */
		artist_credit: ArtistCreditSeed;

		/** Tracklist data. */
		mediums: Array<Partial<{
			/** Any valid medium format name. The possible values are the names of the medium formats, in English (see the documentation). */
			format: string;
			position: number;
			name: string;

			track: Array<Partial<{
				/** The name of the track. */
				name: string;
				/** The free-form track number. */
				number: string;
				/** The MBID of an existing recording in the database which should be associated with the track. */
				recording: string;
				/** The tracks duration, in MM:SS form or a single integer as milliseconds. */
				length: string | number;
				artist_credit: ArtistCreditSeed;
			}>>;
		}>>;

		/** You can seed a list of URLs to add as relationships to the release. */
		urls: Array<{
			/** The URL to relate to. Non-empty string. */
			url: string;
			/** The integer link type ID to use for the relationship. Not required; if left blank, can be selected in the release editor. */
			link_type?: ReleaseSeed.UrlLinkTypeId;
		}>;

		/** Specify the content of the edit note. Use a text area / multi-line text. */
		edit_note: string;
		/**
		 * A URI to redirect to after the release is submitted.
		 * The release's MBID will be added to this URI under the `release_mbid` query parameter.
		 * E.g., if http://example.com/ is provided for this, the user will be redirected to a URI like http://example.com/?release_mbid=4587fe99-db0e-4553-a56a-164dd38ab380.
		 */
		redirect_uri: string;
	}>;

	type ArtistCreditSeed = {
		names: Array<Partial<{
			/**
			 * The MBID of the artist.
			 * If omitted you will be able to either create the artist in the release editor, or search MusicBrainz for this artist.
			 */
			mbid: string;
			/** The name of the artist, as credited on the release. Optional, if omitted it will default to the artist’s current name. */
			name: string;
			artist: {
				/**
				 * The name of the artist as it is usually referred too (to prefill the field in order to search for the artist via the site interface).
				 * Unneeded if you already specified both credited name and MBID.
				 */
				name: string;
			};
			/**
			 * An optional phrase to join this artist with the next artist.
			 * For example, you could use “ & ” to join “Calvin” with “Hobbes” to get the final text “Calvin & Hobbes”.
				*/
			join_phrase: string;
		}>>;
	};

	namespace ReleaseSeed {
		type Status = Lowercase<keyof typeof statusTypeIds>;

		type Packaging = keyof typeof packagingTypeIds;

		type UrlLinkTypeId = typeof urlTypeIds[keyof typeof urlTypeIds];
	}

	namespace ReleaseGroupSeed {
		type PrimaryType = keyof typeof primaryTypeIds;

		type SecondaryType = keyof typeof secondaryTypeIds;

		type Type = PrimaryType | SecondaryType;
	}
}
