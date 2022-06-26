type CopyrightItem = {
	/** Name of the copyright owner (label or artist). */
	name: string;
	/** Types of copyright or legal information, will be mapped to relationship types. */
	types: string[];
	/** Numeric year, has to be a string with four digits, otherwise MBS complains. Can be an array in case of multiple years. */
	year?: string | string[];
};

type CreditParserOptions = {
	/** Pattern which matches the name of a copyright holder. */
	nameRE: RegExp;
	/** Pattern which is used to split the names of multiple copyright holders. */
	nameSeparatorRE: RegExp;
	/** Pattern which terminates a credit. */
	terminatorRE: RegExp;
};

type CreditParserLineStatus = 'skipped' | 'partial' | 'done';
