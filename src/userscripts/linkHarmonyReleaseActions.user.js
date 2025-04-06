import { extractEntityFromURL } from "../entity";
import { onReactHydrated } from "../reactHydration";

// --- Configuration ---
const harmonyIconUrl = "https://harmony.pulsewidth.org.uk/favicon.svg";
const harmonyBaseUrl =
  "https://harmony.pulsewidth.org.uk/release/actions?release_mbid=";
const iconSize = "1em"; // Adjust size as needed (e.g., '16px', '1.1em')
const iconMarginRight = "5px"; // Adjust spacing between icon and title
// --- End Configuration ---

/**
 * Creates the Harmony link anchor (<a>) element with the icon (<img>).
 * @param {string} mbid - The MusicBrainz Release MBID.
 * @returns {HTMLAnchorElement|null} The created anchor element or null if mbid is invalid.
 */
function createHarmonyLinkElement(mbid) {
  // Basic validation remains useful here
  if (!mbid || typeof mbid !== "string" || !/^[a-f0-9\-]{36}$/.test(mbid)) {
    console.warn(
      "Harmony Link Script: Invalid MBID passed to createHarmonyLinkElement:",
      mbid
    );
    return null;
  }

  const harmonyLink = document.createElement("a");
  harmonyLink.href = `${harmonyBaseUrl}${mbid}`;
  harmonyLink.target = "_blank"; // Open in new tab
  harmonyLink.rel = "noopener noreferrer"; // Security best practice for target="_blank"
  harmonyLink.title = `View Harmony Actions for ${mbid} (opens in new tab)`;
  harmonyLink.style.marginRight = iconMarginRight; // Add space after the icon link
  harmonyLink.style.textDecoration = "none"; // Avoid underline on the icon link itself
  harmonyLink.classList.add("harmony-release-link-icon"); // Add class for potential future styling/selection

  const harmonyIcon = document.createElement("img");
  harmonyIcon.src = harmonyIconUrl;
  harmonyIcon.alt = "Harmony Logo";
  harmonyIcon.style.height = iconSize;
  harmonyIcon.style.width = iconSize; // Assuming square icon, keep aspect ratio
  harmonyIcon.style.verticalAlign = "middle"; // Align vertically with text/icons
  harmonyIcon.style.border = "none"; // Ensure no border is added by browser/CSS

  harmonyLink.appendChild(harmonyIcon);
  return harmonyLink;
}

// NOTE: extractMbid function is removed, using extractEntityFromURL instead.

/**
 * Main function to execute the script logic.
 */
function runHarmonyLinker() {
  // Use the provided utility function to get entity info from the current URL
  const currentEntity = extractEntityFromURL(window.location.href);

  // 1. Handle Single Release Page
  if (currentEntity && currentEntity.type === "release" && currentEntity.mbid) {
    const mbid = currentEntity.mbid;
    const headingElement = document.querySelector("div.releaseheader h1");
    // Ensure we get the *specific* link containing the BDI title
    const releaseTitleLink = headingElement
      ? headingElement.querySelector('a[href*="/release/"] > bdi')
          ?.parentElement
      : null;

    if (headingElement && releaseTitleLink) {
      const harmonyLink = createHarmonyLinkElement(mbid);
      if (harmonyLink) {
        headingElement.insertBefore(harmonyLink, releaseTitleLink);
        // console.log(`Harmony link added for Release page: ${mbid}`);
      }
    } else {
      console.error(
        "Harmony Link Script: Could not find H1 or title link (with BDI) on release page.",
        headingElement,
        releaseTitleLink
      );
    }
  }

  // 2. Handle Release Group Page
  else if (currentEntity && currentEntity.type === "release-group") {
    const releaseTable = document.querySelector(
      "table.tbl.mergeable-table tbody"
    );
    if (!releaseTable) {
      console.error(
        "Harmony Link Script: Could not find release table body on release group page."
      );
      return; // Exit this specific part of the function
    }

    // Find the BDI elements within the correct links in the table
    const releaseTitleBDIElements = releaseTable.querySelectorAll(
      'tr:not(.subh) > td:nth-of-type(2) a[href*="/release/"] > bdi'
    );

    releaseTitleBDIElements.forEach((bdiElement) => {
      const releaseLink = bdiElement.parentElement; // Get the parent <a> tag
      if (!releaseLink || releaseLink.tagName !== "A") return; // Skip if parent isn't an anchor

      // Extract entity info from the link's href
      const linkEntity = extractEntityFromURL(releaseLink.href);

      if (linkEntity && linkEntity.type === "release" && linkEntity.mbid) {
        const mbid = linkEntity.mbid;
        const harmonyLink = createHarmonyLinkElement(mbid);
        const parentTd = releaseLink.closest("td"); // Get the parent cell

        if (harmonyLink && parentTd) {
          // Insert the Harmony link *before* the release title link within its cell
          parentTd.insertBefore(harmonyLink, releaseLink);
          // console.log(`Harmony link added for release in RG table: ${mbid}`);
        }
      } else {
        console.warn(
          "Harmony Link Script: Could not extract valid release MBID from link in table row:",
          releaseLink.href
        );
      }
    });

    if (releaseTitleBDIElements.length === 0) {
      console.log(
        "Harmony Link Script: No release title links (with BDI) found in the table on the release group page."
      );
    }
  }
  // else {
  //     // Optional: Log if the page is neither release nor release-group if needed
  //     if (currentEntity) {
  //         console.log(`Harmony Link Script: Not a release or release-group page (Type: ${currentEntity.type}).`);
  //     } else {
  //         console.log("Harmony Link Script: Could not determine entity type from URL.");
  //     }
  // }
}

// --- Execution ---
// Ensure the utility functions are loaded/available before running
// Assuming extractEntityFromURL is globally available or imported correctly by the bundler
if (typeof extractEntityFromURL === "function") {
  runHarmonyLinker();
} else {
  console.error(
    "Harmony Link Script: extractEntityFromURL function is not defined!"
  );
}
