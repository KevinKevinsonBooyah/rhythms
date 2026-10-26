# Fieldbook: Marching Drill Reader

Buildless application at the existing `/rhythms/pdf-reader/` GitHub Pages path. All application changes are confined to this directory. No Rhythms game files or Firebase services are used.

## Rehearsal workflow

1. Import up to three PDFs. All pages are read sequentially with progress and cancellation between pages. Text extraction uses PDF.js; scanned pages use local Tesseract OCR.
2. Review rows before generating. Filter by performer, edit any column, and inspect source page text. Extracted, OCR, corrected, verified, and missing values have distinct status labels. Conflicting duplicate coordinates remain unknown. An unknown endpoint is never replaced by a fabricated dot.
3. Generate the field, then confirm **Set sequence → Edit**. Counts default to the number of marching pulses arriving at that set. The first position is count zero. Titles such as `After 3` and `16+12` are never interpreted as durations. Source-set count convention is available as an explicit conversion. Conflicting or missing timings block playback, but set positions can still be inspected.
4. Select a marcher, or search the Marchers tab. The inspector shows exact source coordinates, next position, distance in yards/standard steps, and required step length per count. Adjacent markers and estimated straight paths apply to the selected marcher.
5. Attach audio to the selected movement. Set the first-count offset, BPM/tempo map and optional count-to-audio markers under Audio & timing. Sync markers interpolate the tempo-integrated clock between anchors; the audio element's current time is the master while attached. Playback rate, seeking and loops update both audio and dots.
6. Save in browser (IndexedDB, including audio), export/import JSON, or export CSV. JSON does not embed audio or the original PDFs; reattach tracks on a new device. Browser-local storage can be cleared by the browser, so keep JSON backups.

## Geometry and identity

Canonical coordinates are yards: x=0 at the Side 1 goal, y=0 at the front sideline. The field is 100 by 160/3 yards. Hashes are exactly 160/9 and 320/9 yards from the front sideline. Default standard step = 22.5 inches = 0.625 yards. Inside moves toward the 50; outside toward the nearer goal. In front moves toward the front sideline; behind toward the back sideline. Rotation and side swapping affect display, not exported canonical data.

Identity is instrument + symbol + label, normalized for case/outer whitespace; the same identity is stable across movements. If a person's instrument or label changes between cards, manually standardize the identity fields. Movement identity comes from the show/movement footer; a filename fallback is editable. Set identifiers are sorted naturally, preserving subsets, and can be reordered manually.

## Architecture

- `core.mjs`: coordinates, validation, identity/merge, movement compilation and timing.
- `parser.mjs`: geometric row reconstruction, conservative text fallback, all-page PDF/OCR pipeline.
- `field.mjs`: SVG field, zoom/pan/pinch, selection and rendering.
- `storage.mjs`: IndexedDB and export helpers.
- `app.mjs`: application state, transport and UI wiring.
- `styles.css`: desktop and responsive mobile layout.
- `vendor/`: bundled PDF.js 5.6.205, Tesseract.js/core 7.0.0 and English trained data. Runtime document processing does not transmit PDFs or audio. Fonts are optional Google Fonts requests; system fonts are fallback.

## Tests

Run `node --test pdf-reader/tests/core.test.mjs` from the repository root. No npm install required. Coverage includes exact HS geometry, all coordinate anchors, fractions/quarter steps, Side 1/2 crossing, natural subsets, holds, unknown endpoints, reverse scrubbing, timing conflicts, independent movements, duplicate provenance, tempo changes, sync markers and the cumulative three-file limit.

Synthetic end-to-end fixtures can be generated with `python pdf-reader/tests/make_fixtures.py` after installing ReportLab/Pillow. They are written to `tmp/pdfs/`; create that directory first. The generator uses the DejaVu font from a typical Linux installation. Fixtures are synthetic and are not real band drill.

Verified in Chromium: 108-page PDF, 648 extracted rows, 108 unique performers, one-page duplicate import, six scanned/OCR rows, browser save/load, subset navigation, audio attach, tempo/marker calibration and backward audio seeking. A 390px embedded viewport checks the responsive layout. Physical phone gestures and iOS audio policies still need device testing.

## Known limits

- Real user PDFs were not supplied during implementation. Spatial extraction targets the supplied six-column dot-card format. Unusual layouts, rotated tables, multiple performers on a single printed page, OCR errors, or absent metadata need manual review. Source text is retained for pages with no recognized rows.
- OCR is slower than selectable text and can confuse glyphs. It never auto-verifies results. `yd In` is accepted as the common OCR rendering of `yd ln`; numeric values are never silently repaired.
- A PDF page with substantial unrelated selectable text but an image-only table may need an externally OCR'd copy or manual entry; automatic OCR is triggered by very sparse selectable text.
- Timing cannot be reliably inferred from these cards alone. Arrival counts are a visible convention, not a claim of verified show timing. Set timings and sync markers are editable.
- Beat grouping and counts-per-beat are configured per movement. A mid-movement meter-change editor is not included; explicit count/audio markers still synchronize such passages.
- Paths are linear estimates. No curved choreography, body orientation, or follow-the-leader behavior is inferred.
- Metronome clicks are animation-scheduled, not a sample-accurate professional audio sequencer. Dots follow audio time and therefore do not accumulate separate-clock drift.
- Latest evergreen browsers are recommended. Audio format decoding and fullscreen availability depend on browser support. MP3/WAV are the safest choices; M4A is browser-dependent.

## Audio cutter and timing calibration update

Add audio now opens a waveform editor. Every current movement gets a start/end range that must be confirmed before applying. Drag the gold handles, use Start here/End here at the preview playhead, or enter seconds. Nonoverlapping ranges create separate PCM WAV blobs for each movement and persist in browser saves. Initial equal divisions are only suggestions. Times and delay controls become relative to the resulting clip; previous sync markers are cleared when replacing clips.

Hide labels/Show labels is an explicit button above the field. New Atlantis template projects use a 12.7-second Movement 1 offset. The first transition still uses the source card's 40 counts; default tempo is not a verified Atlantis tempo. Audio & timing includes a preview and set alignment control that creates count/audio sync anchors, allowing real recording timings to replace the default tempo-derived durations. Pausing during the initial wait now resumes the remaining wait rather than restarting it.

## Mobile layout and Atlantis score timing (update 8)

First visit asks Mobile or Computer; Device layout changes the saved preference.
Mobile has separate Field, Sets and Marchers views. Landscape phones enter a
viewport-fitted field player with play/pause, previous/next, set and movement
selectors, sets/marchers drawers, and a Tools menu (dot size, labels, fit, zoom,
flip, speed, volume, metronome, loops and timing). X exits; rotating back or
leaving fullscreen pauses playback. The in-page player works without a native
fullscreen API. Selection/ghost outlines scale with the dot-size slider; the
browser focus rectangle around the SVG label is replaced with a dot outline.

Atlantis now loads `movement-1.mp3`, `movement-2.mp3`, and `movement-3.mp3`.
Reload Templates > Atlantis to get the update; existing saved custom projects
are not silently overwritten. Tempo markings were visually read from the
user's Clarinet in Bb 1 part (pages 1 and 3):

| Movement | Base quarter-note BPM | Change | Drill count |
| --- | --- | --- | --- |
| 1 | 140 | measure 29: 172 | 140 |
| 2 | 86 | measure 142: 90 | 96 |
| 3 | 90 | measure 173: 172 | 32 |

Count mappings use the original arrival counts and measure ranges on the dot
cards. Movement 1 retains the user-requested 12.7-second delay. No recording
sync markers are invented: score timings and recordings do not completely
agree. In particular, M1 ends after its 189.48-second track under these inputs;
M2's recording origin relative to measure 118 is unconfirmed; M3 set 32 has
20 card counts over four 4/4 bars (16 score beats). The app preserves card
counts and displays these notes in Audio & timing, where exact set/audio
alignment can be edited. The clarinet PDF is not redistributed by the site.

Validation: `node --test pdf-reader/tests/*.test.mjs` from the repository root.

Update 11 supersedes the opening-count assumptions above: provisional removal
of the printed +20 gives 15 counts into 1A and 15 into set 2. The user suspects
+20 is a card mistake; this remains unconfirmed. Set 2 is now count 30, the
measure-29 tempo change is count 120, and the final dot is count 476 at about
188.31 seconds, compared with the 189.48-second recording. Matching the overall
duration is supporting evidence, not proof of individual set alignment.

Update 12 supersedes the provisional opening above with the user's observed
COUNT-display cue: set 2 arrives at 20.7 and immediately starts moving to 2A.
Set 1A remains at 15, and 2A, 2B, 3 arrive at 30.7, 40.7, 50.7. These fractional
counts are provisional playback calibration, not verified source counts.
The subsequent tempo cue moves to 110.7 to preserve its location within the
drill after shortening the opening.


Update 13 introduces independent marching and holding phases. Atlantis opts into
its user-confirmed title convention: first number marches, numbers after plus
hold. The phrase spans all subset intervals since the preceding main set.
Only exact total matches resolve automatically. A proposed all-hold interval
with changing coordinates is flagged; unknown coordinates are not filled in.
Manual march counts can override each interval. Total interval counts and
existing audio anchors are unchanged. This fixes 15 hold intervals across the
show; 5 conflicting phrases remain (M1: 2, 5, 13; M3: 32, 38). The opening
calibration remains provisional. Timing audit is visible under Audio & timing.
The clock already followed audio.currentTime; the main defect was allocating
all elapsed counts to motion instead of modeling a hold at the destination.


Update 14 fixes all 48 missing Atlantis coordinate rows, which used the valid
centerline form `On 50 yd ln` without a side prefix. That form now resolves to
x=50; unprefixed non-center yard lines remain ambiguous. All 108 performers
have known coordinates at all sets and sampled transitions in all movements.

Atlantis enables optional estimated early arrival on already-resolved hold
phrases: shorter paths use ceil(distance / configured step size) march counts,
capped by the phrase's march window, then hold. Zero-distance paths stay still.
This is explicitly an estimate, not reconstructed choreography. Disable it in
Audio & timing. Per-marcher custom start/march counts override the estimate via
Select marcher > Marcher timing. Overrides persist in project settings without
changing the shared count/audio clock.


Update 15 loads Atlantis automatically on startup, without autoplaying music
or replacing an existing IndexedDB save. Manual template selection still asks
before replacing an open project. A prominent red warning uses the user's
exact wording and remains visible in the fullscreen player when controls fade.


Update 18 adds a selected-marcher coordinate card below the field in normal
view and as a compact overlay in the fullscreen/landscape player. Source
Side 1/Side 2 and front/back wording is preserved at known dots. Between dots,
the readout formats the interpolated position as an explicitly labeled live
estimate using the configured step size. Next dot expands to show the
destination's source coordinates. X hides the card; selecting or following a
marcher opens it again. The inspector also separates left/right and front/back
values. Coordinates retain canonical card orientation when the field is flipped.

Update 19 replaces the floating coordinate card with two small text lines above
the selected/followed dot. The annotation follows movement and stays readable
through zoom and viewport changes. Identifiers use the original performer
symbol and label, centered inside each circle; SVG text bounds are measured to
fit the glyphs, including wider symbols. The separate inspector retains the
coordinate details. Existing coordinate formatting and timing are unchanged.

Update 20 increases the label size while keeping the measured glyphs within
each dot. Darker text and a thin light outline improve contrast across the
instrument colors. The device choice uses phone and laptop emojis.

Update 21 draws the selected marcher's route from its current interpolated
position to the next known dot as a thin solid line with an endpoint marker.
Thin horizontal and vertical guides show screen left/right and up/down travel
in standard steps when there is room to label them. The field adds subdued
end zones, yard stripes, sideline ticks and brighter turf without changing
the canonical coordinate system.

Update 22 labels the end zones Side 1 and Side 2, respecting field swaps and
rotation, and renames Templates to Current shows. Edit dots is available beside
Marchers and in the mobile navigation. Choose a performer and set to correct
card coordinates or yard positions, nudge by standard steps, copy a neighboring
dot, or restore the original PDF position. Per-performer wait and marching
counts, shared interval length and march/hold split, count arrival shifts, BPM,
set-linked audio seconds, set title/measure, and performer notes can be edited.
Set-linked tempo and audio markers follow a set when its count changes. Edited
projects and attached audio resume from browser storage on the next visit;
Atlantis remains the default for a fresh browser. Export JSON from Project for
a portable backup; movement audio must be attached again after JSON import.

Update 23 keeps the selected route anchored to the starting and destination
dot for the whole transition. The moving marcher leaves a fixed ring at its
starting position; the thin route, orthogonal step guides, and their numbers
do not shrink as the marcher travels. The field annotation shows the printed
coordinates of the destination, and the inspector retains the printed current
and next coordinates until the set boundary. There is no live interpolated
front/back or left/right coordinate display.

Update 24 emphasizes the fixed directional measurements with larger text and
dark backed labels, softens the starting ring, and marks the corner where both
orthogonal guides meet. Search fades other marchers to 55% opacity, or keeps
them fully bright with the new Marchers checkbox. Edit sets makes shared
transition and marching counts the main controls; music alignment and one
marcher's wait, position, and notes are optional sections. The Set sequence
Edit button opens this simpler panel. Saved data and timing behavior are
unchanged.
