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
	namespace ReleaseSeed {
		type Status = keyof typeof statusTypeIds;

		type Packaging = keyof typeof packagingTypeIds;

		type UrlLinkTypeId = typeof urlTypeIds[keyof typeof urlTypeIds];
	}

	namespace ReleaseGroupSeed {
		type PrimaryType = keyof typeof primaryTypeIds;

		type SecondaryType = keyof typeof secondaryTypeIds;

		type Type = PrimaryType | SecondaryType;
	}
}
