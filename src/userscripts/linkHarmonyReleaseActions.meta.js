/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
  name: "MusicBrainz: Link Harmony release actions",
  author: "Dr-Blank",
  description:
    "Adds a Harmony actions link icon next to release titles on MusicBrainz release pages and release group pages.",
  match: [
    "*://*.musicbrainz.org/release/*",
    "*://*.musicbrainz.org/release-group/*",
  ],
  "run-at": "document-idle",
  icon: "https://harmony.pulsewidth.org.uk/favicon.svg",
  grant: "none",
};

export default metadata;
