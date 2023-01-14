/**
 * - Removes all release events except for the first one and changes its country to [Worldwide].
 * - Allows to replace an exhaustive list of release countries/events with a single release event.
 */

$('.remove-release-event:not(:first)').trigger('click');

const countryIdForWorldwide = 240;
$('#country-0').val(countryIdForWorldwide).trigger('change');
