/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
  name: "MusicBrainz: Link Harmony release actions",
  namespace: "https://github.com/Dr-Blank",
  author: "Dr.Blank",
  description:
    "Adds a Harmony actions link icon next to release titles on MusicBrainz release, release group, and artist releases pages.",
  match: [
    "*://*.musicbrainz.org/release/*",
    "*://*.musicbrainz.org/release-group/*",
    "*://*.musicbrainz.org/artist/*/releases*",
  ],
  "run-at": "document-idle",
  icon: "https://harmony.pulsewidth.org.uk/favicon.svg",
  grant: ["GM_getValue", "GM_setValue"],
};

export default metadata;
