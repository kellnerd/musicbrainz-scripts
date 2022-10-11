type UserscriptSpecificMetadata = {
	name: string;
	version?: string;
	description: string;
	icon?: string | URL;
	require?: string | URL;
	resource?: string;
	grant?: MaybeArray<string>;
	'run-at'?: 'document-end' | 'document-start' | 'document-idle';
	'inject-into'?: 'page' | 'content' | 'auto';
	match?: MaybeArray<string>;
	'exclude-match'?: MaybeArray<string>;
	include?: MaybeArray<string | RegExp>;
	exclude?: MaybeArray<string | RegExp>;
}

type UserscriptDefaultMetadata = {
	author: string;
	namespace: string | URL;
	homepageURL: string | URL;
	downloadURL: string | URL;
	updateURL: string | URL;
	supportURL: string | URL;
}

type UserscriptMetadata = UserscriptSpecificMetadata & Partial<UserscriptDefaultMetadata>;
