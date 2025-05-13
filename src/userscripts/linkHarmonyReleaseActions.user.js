import { extractEntityFromURL } from "../entity";

// --- Default Configuration ---
const DEFAULT_ENABLE_ON_RELEASE_GROUP = true;
const DEFAULT_ENABLE_ON_ARTIST_RELEASES = true;
const DEFAULT_DIGITAL_MEDIA_ONLY = true;
const DEFAULT_ICON_SIZE = "1.1em";
const DEFAULT_ICON_MARGIN_LEFT = "5px";
const DEFAULT_HARMONY_ICON_URL =
  "https://harmony.pulsewidth.org.uk/favicon.svg";
const DEFAULT_HARMONY_BASE_URL =
  "https://harmony.pulsewidth.org.uk/release/actions?release_mbid=";

// --- Key names for GM storage ---
const KEY_ENABLE_RG = "harmonyEnableRG";
const KEY_ENABLE_ARTIST = "harmonyEnableArtist";
const KEY_DIGITAL_ONLY = "harmonyDigitalOnly";
const KEY_ICON_SIZE = "harmonyIconSize";
const KEY_ICON_MARGIN = "harmonyIconMarginLeft";

// --- CSS Class Names ---
const CSS_LINK_CLASS = "harmony-userscript-link";
const CSS_ICON_CLASS = "harmony-userscript-icon";
// --- Common Selectors ---
const releaseTableSelector = "table.tbl.mergeable-table tbody";
const releaseTitleLinkSelector = 'a[href*="/release/"] > bdi';

/**
 * Injects CSS rules into the document's head.
 * Prevents duplicate injection using an ID.
 * @param {string} css - The CSS rules to inject.
 * @param {string} id - An ID for the style element to prevent duplicates.
 */
function injectStylesheet(css, id) {
  const styleId = `harmony-userscript-style-${id}`;
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Fetches a configuration value from GM storage, using a default if not found.
 * @param {string} key - The key for GM_getValue.
 * @param {any} defaultValue - The default value to return if the key is not found.
 * @returns {Promise<any>} - The retrieved or default value.
 */
async function getConfigValue(key, defaultValue) {
  try {
    let value = await GM_getValue(key, defaultValue);
    if (typeof defaultValue === "boolean") {
      value = Boolean(value);
    }
    if (typeof value !== typeof defaultValue && defaultValue !== undefined) {
      console.warn(
        `Harmony Link Script: Config value for '${key}' has unexpected type. Using default.`
      );
      return defaultValue;
    }
    return value;
  } catch (e) {
    console.error(
      `Harmony Link Script: Error getting config value for '${key}'. Using default.`,
      e
    );
    return defaultValue;
  }
}

/**
 * Creates the Harmony link anchor (<a>) element with the icon (<img>).
 * @param {string} mbid - The MusicBrainz Release MBID.
 * @returns {HTMLAnchorElement|null} The created anchor element or null if mbid is invalid.
 */
function createHarmonyLinkElement(mbid) {
  if (!mbid || typeof mbid !== "string" || !/^[a-f0-9\-]{36}$/.test(mbid)) {
    console.warn(
      "Harmony Link Script: Invalid MBID passed to createHarmonyLinkElement:",
      mbid
    );
    return null;
  }

  const harmonyLink = document.createElement("a");
  harmonyLink.href = `${DEFAULT_HARMONY_BASE_URL}${mbid}`;
  harmonyLink.target = "_blank";
  harmonyLink.rel = "noopener noreferrer";
  harmonyLink.title = `View Harmony Release Actions (opens in new tab)`;
  harmonyLink.classList.add(CSS_LINK_CLASS);

  const harmonyIcon = document.createElement("img");
  harmonyIcon.src = DEFAULT_HARMONY_ICON_URL;
  harmonyIcon.alt = "Harmony Logo";
  harmonyIcon.classList.add(CSS_ICON_CLASS);

  harmonyLink.appendChild(harmonyIcon);
  return harmonyLink;
}

/**
 * Processes a table containing release links, adding Harmony icons.
 * @param {string} tableBodySelector - CSS selector for the table body (tbody).
 * @param {boolean} digitalOnly - If true, only add icons for "Digital Media" releases.
 */
function processReleaseTable(tableBodySelector, digitalOnly) {
  const releaseTableBody = document.querySelector(tableBodySelector);
  if (!releaseTableBody) {
    console.error(
      `Harmony Link Script: Could not find release table body using selector: "${tableBodySelector}".`
    );
    return;
  }

  // Select BDI elements within release links in the second column
  const releaseTitleBDIElements = releaseTableBody.querySelectorAll(
    `tr:not(.subh) > td:nth-of-type(2) ${releaseTitleLinkSelector}`
  );
  let addedCount = 0;

  releaseTitleBDIElements.forEach((bdiElement) => {
    const releaseLink = bdiElement.parentElement;
    if (!releaseLink || releaseLink.tagName !== "A") return;

    const parentRow = releaseLink.closest("tr"); // Get the table row
    if (!parentRow) return;

    // --- Format Check ---
    if (digitalOnly) {
      const formatCell = parentRow.querySelector("td:nth-of-type(4)"); // 4th column is Format
      const formatText = formatCell ? formatCell.textContent.trim() : "";
      if (!formatText.includes("Digital Media")) {
        console.debug("Skipping non-digital:", formatText);
        return;
      }
      console.debug("Found digital:", formatText);
    }

    const linkEntity = extractEntityFromURL(releaseLink.href);

    if (linkEntity && linkEntity.type === "release" && linkEntity.mbid) {
      const mbid = linkEntity.mbid;
      const harmonyLink = createHarmonyLinkElement(mbid);
      const parentTd = releaseLink.closest("td"); // The containing cell (TD)

      if (harmonyLink && parentTd) {
        let nodeToInsertAfter = releaseLink;
        // Traverse up the DOM tree from the release link
        // until we find the element that is a DIRECT child of the TD.
        // This handles cases where the link is wrapped in other elements (like span.mp).
        while (nodeToInsertAfter.parentElement !== parentTd) {
          nodeToInsertAfter = nodeToInsertAfter.parentElement;
          if (
            !nodeToInsertAfter ||
            nodeToInsertAfter === parentTd ||
            nodeToInsertAfter === document.body
          ) {
            console.error(
              "Harmony Link Script: Could not find the correct insertion point within the TD for link:",
              releaseLink.href
            );
            nodeToInsertAfter = null; // Prevent insertion if logic fails
            break;
          }
        }

        // Only insert if we successfully found the correct reference node
        if (nodeToInsertAfter) {
          try {
            parentTd.insertBefore(harmonyLink, nodeToInsertAfter.nextSibling);
            addedCount++;
          } catch (e) {
            console.error("Harmony Link Script: Error during insertion:", e);
          }
        }
      }
    }
  });
  console.debug(
    `Harmony Link Script: Processed table "${tableBodySelector}". Added ${addedCount} icons.`
  );
}

/**
 * Main async function to execute the script logic.
 */
async function runHarmonyLinker() {
  // --- Get Configuration from GM Storage ---
  const enableRG = await getConfigValue(
    KEY_ENABLE_RG,
    DEFAULT_ENABLE_ON_RELEASE_GROUP
  );
  const enableArtist = await getConfigValue(
    KEY_ENABLE_ARTIST,
    DEFAULT_ENABLE_ON_ARTIST_RELEASES
  );
  const digitalOnly = await getConfigValue(
    KEY_DIGITAL_ONLY,
    DEFAULT_DIGITAL_MEDIA_ONLY
  );
  const iconSize = await getConfigValue(KEY_ICON_SIZE, DEFAULT_ICON_SIZE);
  const iconMarginLeft = await getConfigValue(
    KEY_ICON_MARGIN,
    DEFAULT_ICON_MARGIN_LEFT
  );

  // --- Inject CSS ---
  const dynamicCSS = `
    .${CSS_LINK_CLASS} {
      margin-left: ${iconMarginLeft};
      text-decoration: none !important;
      display: inline-flex;
      vertical-align: middle;
      line-height: 1;
    }
    .${CSS_ICON_CLASS} {
      height: ${iconSize};
      width: ${iconSize};
      vertical-align: middle;
      border: none;
      line-height: 1;
    }
  `;
  injectStylesheet(dynamicCSS, "harmony-dynamic-styles");

  // --- Page Specific Logic ---
  const currentPath = window.location.pathname;
  const currentEntity = extractEntityFromURL(window.location.href);

  // 1. Handle Single Release Page
  if (currentEntity && currentEntity.type === "release") {
    let applyLink = true; // Assume we apply unless digitalOnly says otherwise

    if (digitalOnly) {
      // Need to find the format on the release page header.
      const formatDt = Array.from(
        document.querySelectorAll("#sidebar dl.properties dt")
      ).find((dt) => dt.textContent.trim() === "Format:");
      const formatDd = formatDt?.nextElementSibling; // Should be the <dd>
      const formatText = formatDd ? formatDd.textContent.trim() : "";
      if (!formatText.includes("Digital Media")) {
        applyLink = false; // Do not apply if format isn't digital
      }
      console.debug(
        "Release page format check:",
        formatText,
        "Apply:",
        applyLink
      );
    }

    if (applyLink) {
      const mbid = currentEntity.mbid;
      const headingElement = document.querySelector("div.releaseheader h1");
      const releaseTitleBDI = headingElement
        ? headingElement.querySelector(releaseTitleLinkSelector)
        : null;
      const releaseTitleLink = releaseTitleBDI?.parentElement;

      if (headingElement && releaseTitleLink) {
        const harmonyLink = createHarmonyLinkElement(mbid);
        if (harmonyLink) {
          try {
            headingElement.insertBefore(
              harmonyLink,
              releaseTitleLink.nextSibling
            );
          } catch (e) {
            console.error("Harmony Link Script: Error inserting into H1:", e);
          }
        }
      }
    }
  }

  // 2. Handle Release Group Page
  else if (
    enableRG &&
    currentEntity &&
    currentEntity.type === "release-group"
  ) {
    processReleaseTable(releaseTableSelector, digitalOnly);
  }

  // 3. Handle Artist Releases Page
  else if (
    enableArtist &&
    currentEntity &&
    currentEntity.type === "artist" &&
    currentPath.includes("/releases")
  ) {
    processReleaseTable(releaseTableSelector, digitalOnly);
  }
}

// --- Initial Setup & Execution ---
(async () => {
  // Set default values in storage if they don't exist
  await GM_setValue(
    KEY_ENABLE_RG,
    await GM_getValue(KEY_ENABLE_RG, DEFAULT_ENABLE_ON_RELEASE_GROUP)
  );
  await GM_setValue(
    KEY_ENABLE_ARTIST,
    await GM_getValue(KEY_ENABLE_ARTIST, DEFAULT_ENABLE_ON_ARTIST_RELEASES)
  );
  await GM_setValue(
    KEY_DIGITAL_ONLY,
    await GM_getValue(KEY_DIGITAL_ONLY, DEFAULT_DIGITAL_MEDIA_ONLY)
  );
  await GM_setValue(
    KEY_ICON_SIZE,
    await GM_getValue(KEY_ICON_SIZE, DEFAULT_ICON_SIZE)
  );
  await GM_setValue(
    KEY_ICON_MARGIN,
    await GM_getValue(KEY_ICON_MARGIN, DEFAULT_ICON_MARGIN_LEFT)
  );

  // Run main logic after slight delay
  setTimeout(runHarmonyLinker, 50);
})();
