/**
 * - Opens [Harmony’s](https://harmony.pulsewidth.org.uk) Release Actions page for the currently visited MusicBrainz release.
 */

/**
 * @param {string} mbid MBID of the release.
 */
function openHarmonyReleaseActions(mbid) {
	if (mbid) {
		open('https://harmony.pulsewidth.org.uk/release/actions?release_mbid=' + mbid);
	}
}

const mbid = location.pathname.match(/release\/([0-9a-f-]{36})/)?.[1];
openHarmonyReleaseActions(mbid);
