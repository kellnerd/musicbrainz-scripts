/**
 * - Opens [kepstin’s MagicISRC](https://magicisrc.kepstin.ca) and loads the currently visited MusicBrainz release.
 */

/**
 * @param {string} mbid MBID of the release.
 */
function loadReleaseWithMagicISRC(mbid) {
	if (mbid) {
		open('https://magicisrc.kepstin.ca?mbid=' + mbid);
	}
}

const mbid = location.pathname.match(/release\/([0-9a-f-]{36})/)?.[1];
loadReleaseWithMagicISRC(mbid);
