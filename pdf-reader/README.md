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
