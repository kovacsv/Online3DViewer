# Surface strain in the viewer: host integration contract

What the frontend (the host app) must do to show the frequency-analysis hot zones on a part, and
what the Online3DViewer package guarantees in return. The file format and the mapping rules are in
[`frequency-analysis-surface-contract.md`](frequency-analysis-surface-contract.md). How the viewer
implements them is in [`source/engine/surfacestrain/README.md`](source/engine/surfacestrain/README.md).
This document must change with the public API described below.

## Scope

| Integration path                                                                                        | Surface strain                          |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| npm package, `import * as OV from "online-3d-viewer"`, `OV.EmbeddedViewer` (`CadModelViewerLite` in `CadModel.tsx`) | **Supported.** This contract.           |
| Prebuilt website in iframes (`/Online3DViewer/build/package/website/index.html#model=…`: Files panel, `popup.html`) | **Not supported.** No hash parameter, no UI. |
| Hidden iframe that reads the website's `ov_*` cookies                                                   | Unaffected.                             |

The website build contains the new engine code, but it has no way to receive a strain artifact.
Adding one (for example `#model=…$strain=<url>`) would be a separate change.

## Packaging

- Rebuild the package tarball the same way as today, then update `online-3d-viewer.tgz` and its
  integrity hash in `pnpm-lock.yaml`. Bump the package `version` (currently `0.0.13`) so the two
  builds can be told apart.
- `occt-import-js` stays at `0.0.22`. The `vite-plugin-static-copy` setup, the `/occt-import-js/`
  location and `OV.SetExternalLibLocation ("occt-import-js", "/occt-import-js/")` don't change.
- There are no new runtime dependencies. The TypeScript declarations (`o3dv.module.d.ts`) include
  every API below.

## Preconditions (host responsibilities)

1. **Same STEP.** The model loaded with `LoadModelFromUrlList([fileUrl])` must be the exact STEP the
   analysis ran on. The viewer checks the bounding boxes and refuses a mismatch, but two revisions of
   a part with the same bounding box would pass that check. For certainty, compare the analysis
   response's `input_sha256` with the loaded bytes: `await OV.IsSurfaceStrainSourceFile(stepArrayBuffer, input_sha256)`.
   This needs the STEP bytes, so the host fetches `fileUrl` itself for that check.
2. **Loaded through OCCT.** The part must be STEP or IGES (`.stp`, `.step`, `.igs`, `.iges`), so the
   model is in millimetres and carries BREP face ranges. Other formats still work if the model's unit
   is known or can be inferred, but they are mapped as one face per mesh.
3. **Model finished loading.** Call `ShowSurfaceStrain` only after the `onModelLoaded` callback of
   `OV.EmbeddedViewer` has fired. Before that, the call resolves with `ok: false`.
4. **The host fetches the artifact.** The viewer never fetches `surface_strain.bin`. The host
   downloads it with its own auth (`fetch(url).then(r => r.arrayBuffer())`) and passes the `ArrayBuffer`.
5. **Don't move the model.** Don't apply transforms to the loaded model. The artifact is in the
   STEP's own frame, and the check relies on that. Camera changes (`SetCamera`, projection mode,
   up vector) are fine.
6. **No unit handling.** The artifact is always in metres. The viewer converts it to the model's unit
   (mm for STEP, whatever unit the STEP declares) and checks the result. The host must not scale or
   convert anything.

## API

All names are exported from `online-3d-viewer`.

### `EmbeddedViewer.ShowSurfaceStrain (buffer, params?) → Promise<SurfaceStrainResult>`

- `buffer`: `ArrayBuffer`, the content of `surface_strain.bin`.
- `params`: optional `OV.SurfaceStrainParams`.

  | Field                   | Default                               | Meaning                                                                                         |
  | ----------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
  | `colorRange`            | `OV.SurfaceStrainColorRange.Absolute` | Fixed 1–50 µε scale across parts. `Relative` uses the part's own range and must be labelled as relative. Ignored when `thresholds` is set. |
  | `thresholds`            | `null`                                | Threshold bands instead of the continuous scale, see [Threshold bands](#threshold-bands). `null` or `[]` keeps the continuous scale. |
  | `belowThresholdColor`   | `null` (`#c8c8c8`)                    | Hex colour for points below every threshold, and for points that couldn't be mapped. Used only with `thresholds`. |
  | `frameToleranceFactor`  | `2.0`                                 | Allowed bounding box difference, in FE mesh sizes.                                               |
  | `maxFailedFraction`     | `0.005`                               | The mapping fails if more vertices than this can't reach the FE surface.                         |
  | `mappingParams.maxVertexCount` | `4000000`                      | Refinement budget.                                                                               |

- The promise **never rejects**. Failures, including unexpected errors during the mapping, resolve
  with `ok: false`.
- A shown overlay is replaced only when the call succeeds. It stays on screen while the mapping
  runs, and it also stays if the call fails.
- The mapping runs after a `setTimeout` (see [Performance](#performance)). If `ClearSurfaceStrain`
  is called, a new model starts loading, or the viewer is destroyed in that gap, the call resolves
  with `ok: false` and nothing is painted.
- A later `ShowSurfaceStrain` doesn't cancel an earlier one. Both run in order, and the last one
  that succeeds is shown, whatever the timing. If the later call fails, the earlier call's overlay
  stays on screen, so use the `ok` of the call you care about, not the screen, to decide what to
  show.

`SurfaceStrainResult`:

| Field        | Type                           | Meaning                                                                                  |
| ------------ | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `ok`         | `boolean`                      | `true` means the overlay is shown.                                                        |
| `reason`     | `string \| null`               | Why nothing is shown. English text for logs, not for end users.                           |
| `header`     | `object \| null`               | The artifact's JSON header, set whenever decoding succeeded, even when `ok` is `false`.   |
| `unit`       | `OV.Unit \| null`              | The unit the artifact was converted to, `OV.Unit.Millimeter` for STEP.                    |
| `mapping`    | `SurfaceStrainMapping \| null` | `vertexCount`, `failedCount`, `capped`. For diagnostics.                                  |
| `colorScale` | `SurfaceStrainColorScale \| SurfaceStrainThresholdScale \| null` | Use it to draw the legend, see [Legend](#legend). |

Failure reasons the host may see (the texts aren't stable, don't parse them):

- The file is invalid: bad magic, unsupported version, or a length that disagrees with the header.
- `no model is loaded`, or `the model is empty`.
- `the model changed or the surface strain was cleared before it was shown`: superseded by a
  clear or a model load.
- `unit mismatch, …`: the artifact fits the model only in another unit.
- `bounding box size differs …`, or `bounding box position differs …`: another part, or a moved model.
- `N of M vertices are farther than …`: the surfaces don't line up.
- `threshold N …`, or `thresholds must be …`: invalid `thresholds`. This is checked before the
  mapping, so it fails fast.

When `ok` is `false`, **show nothing on the model**. If an earlier overlay may still be shown, call
`ClearSurfaceStrain` to remove it. Show a neutral message such as "Vibration map unavailable for
this file". Never fall back to a guessed heat map.

### `EmbeddedViewer.SetSurfaceStrainColors (params) → { ok, reason, colorScale }`

Changes the colours of the overlay that is shown **without mapping again**. It's instant, so use it
for a threshold editor or a band/continuous toggle. Only the colour fields of `params` are read:
`thresholds`, `belowThresholdColor` and `colorRange`. On failure (no overlay shown, or invalid
thresholds) it returns `ok: false` with a reason, and the current colours stay.

### `EmbeddedViewer.ClearSurfaceStrain ()`

Removes the overlay and shows the model's own colours again. Safe to call at any time. It also
cancels a `ShowSurfaceStrain` that hasn't run its mapping yet.

### `OV.IsSurfaceStrainSourceFile (stepArrayBuffer, sha256Hex) → Promise<boolean>`

This is the optional SHA-256 check from precondition 1.

## Lifecycle

```
new OV.EmbeddedViewer (container, { onModelLoaded })
        │
LoadModelFromUrlList ([fileUrl])
        │
onModelLoaded ──► fetch surface_strain.bin ──► ShowSurfaceStrain (buffer)
                                                    │
                                   ok ──► legend
                                   !ok ─► neutral message, log reason
        │
LoadModelFromUrlList (another file)  ──► the overlay is cleared automatically
Destroy ()                           ──► everything is freed
```

- Loading a new model always clears the overlay and cancels a pending `ShowSurfaceStrain`. Call
  `ShowSurfaceStrain` again after the next `onModelLoaded`.
- Applying edge settings or projection mode from the `ov_*` cookies is safe before or after
  `ShowSurfaceStrain`. Edges stay visible on top of the overlay, and the overlay is drawn with a
  polygon offset so they don't flicker against it.
- Per-mesh visibility set through `GetViewer ().SetMeshesVisibility (…)` is kept. A mesh the host
  hid stays hidden while the overlay is shown and after it's cleared, its edges stay hidden, and
  its part of the overlay is hidden too. `SetMeshesVisibility` can be called before or after
  `ShowSurfaceStrain`.
- While the overlay is shown, the model's own meshes are hidden. `GetMeshUserDataUnderMouse`,
  `GetMeshIntersectionUnderMouse` and the measure tool don't hit anything.
- The overlay is display only. There is no hover or picking of strain values.

## Performance

The mapping runs on the main thread after one `setTimeout`, so the page can paint a loading state
first. Measured on a 5 m assembly with 18 meshes: 1–2 s at a 20 mm FE mesh size, and about 6 s
at 1 mm, where the 4M-vertex budget is reached (`mapping.capped` is `true`). Show a spinner until
the promise resolves. Typical parts with a few mm mesh size fall between those numbers.

## Threshold bands

`thresholds` is a list of `{ color, strain }`:

- `color`: hex colour, `"#rrggbb"` or `"rrggbb"`.
- `strain`: threshold in **microstrain** (µε), a positive number. It's compared with the envelope
  strain, the worst over all modes at the reference acceleration.

Every point takes the colour of the **highest threshold it reaches** (strain ≥ threshold). The
order of the list doesn't matter. Points below every threshold take `belowThresholdColor`.

```ts
params.thresholds = [
  { color: "#ff0000", strain: 100 },   // ≥ 100 µε: red
  { color: "#ffa500", strain: 50 },    // 50 to 100 µε: orange
  { color: "#ffff00", strain: 25 },    // 25 to 50 µε: yellow
];                                     // < 25 µε: #c8c8c8
```

Rules, each checked with a clear `reason`:

- 1 to 16 thresholds.
- Every `strain` is a positive, finite number, and no two are equal.
- Every `color` is a 6-digit hex colour.

Band borders are drawn per pixel from the interpolated strain, so they are crisp lines on the part,
not colours blended across triangles.

## Legend

Draw the legend from the returned scale, so it always matches the overlay:

```ts
const { log10Low, log10High } = result.colorScale;   // absolute: -6 and log10(50e-6)
const rgb = [0, 0, 0];
result.colorScale.GetColor (log10Value, rgb, 0);      // float RGB in 0..1
```

- Label the ends in microstrain, `10 ** log10 * 1e6`: 1 µε and 50 µε for the absolute range.
  Values outside the range are clamped.
- Grey (`OV.SurfaceStrainMissingColor`) marks vertices that couldn't be mapped.

For threshold bands (`result.colorScale instanceof OV.SurfaceStrainThresholdScale`), draw one swatch
per band from `colorScale.thresholds`. It's sorted highest first, and each entry has `color` (float
RGB 0..1) and `microstrain`. Add a last swatch for `colorScale.belowColor`, labelled
"below <lowest> µε".

## UI requirements

These come from the artifact contract, and the host owns them:

- **Wording.** Use "Relative vibration strain at 10 g", computed from
  `header.reference_acceleration_m_s2 / 9.80665`. Never say "stress", "failure" or "predicted strain".
- **One view only.** The overlay is always the max envelope: at each point, the worst strain over
  all modes. There is no per-mode view. If `header.modes` is listed (`frequency_hz`, `peak_strain`),
  it is information only.
- **Risk badge.** Use `header.stats.p999` and `header.stats.volume_fraction_above`. These are
  volume-weighted over the whole solid. Never recompute peaks from the painted surface.
- **Low confidence.** When `header.element_type === "C3D8"`, show a lower-confidence note.
- **Relative range.** If offered, it must be labelled as relative.
- **Threshold bands.** Label each band with its range in µε (for example "≥ 100 µε", "50–100 µε").
  They are still relative vibration strain at the reference acceleration, not allowable limits, so
  don't call them pass or fail.

## Example (CadModelViewerLite)

```ts
import * as OV from "online-3d-viewer";

const viewer = new OV.EmbeddedViewer(container, {
  onModelLoaded: async () => {
    const buffer = await fetch(strainUrl, { credentials: "include" }).then((r) => r.arrayBuffer());
    const result = await viewer.ShowSurfaceStrain(buffer);
    if (!result.ok) {
      console.warn("surface strain not shown:", result.reason);
      setStrainState({ status: "unavailable" });
      return;
    }
    setStrainState({ status: "shown", header: result.header, scale: result.colorScale });
  },
});
viewer.LoadModelFromUrlList([fileUrl]);
```

## Edge highlights

The viewer can also draw the risky edges from the analysis (for example sharp internal corners) as
coloured lines on the part. This API is generic: it takes polylines and colours, and nothing in it
is specific to strain. The other edge fields (`edge_index`, `face_indices`, `angle_deg`,
`length_mm`) stay in the host, for its own list or tooltip.

### `EmbeddedViewer.ShowEdgeHighlights (edges, params?) → EdgeHighlightResult`

- `edges`: a list of `OV.EdgeHighlight`, or plain objects with the same fields:

  | Field      | Type         | Meaning                                                                                   |
  | ---------- | ------------ | ----------------------------------------------------------------------------------------- |
  | `polyline` | `number[][]` | `[[x, y, z], …]` with at least 2 points, in `params.unit`. Pass the edge's `polyline_xyz` unchanged. |
  | `color`    | `string`     | Hex colour, `"#rrggbb"` or `"rrggbb"`.                                                     |
  | `width`    | `number?`    | Line width in CSS pixels. Overrides `params.width` for this edge.                          |

- `params`: optional `OV.EdgeHighlightParams`.

  | Field            | Default              | Meaning                                                                          |
  | ---------------- | -------------------- | -------------------------------------------------------------------------------- |
  | `unit`             | `OV.Unit.Millimeter` | Unit of the coordinates: `Millimeter`, `Centimeter`, `Meter`, `Inch` or `Foot`. They are converted to the model's unit. If the model's unit is unknown, they are used as they are. |
  | `width`            | `4`                  | Default line width in CSS pixels. Lines keep this width at any zoom.          |
  | `surfaceTolerance` | `0.002`              | Every point must lie this close to the model's surface, as a fraction of the largest size of its bounding box. That is twice the deflection the viewer tessellates STEP with. |

- `EdgeHighlightResult` is `{ ok, reason, edgeCount }`.
- The call is **synchronous** and **never throws**. Call it after `onModelLoaded`. Before that it
  returns `ok: false` with `no model is loaded`.
- It is **all or nothing**. One invalid edge fails the whole call, and `reason` names it, for
  example `edge 3: polyline needs at least 2 points`. A colour that isn't hex, a coordinate that
  isn't finite, a width that isn't positive and an unsupported `unit` are refused the same way.
  The texts aren't stable, so don't parse them.
- **Same part, same unit.** The polylines are tessellation vertices of the part's own edges, so
  every point must lie on the model's surface. That refuses edges of another part, and edges in a
  unit that is too large. Edges in a unit that is too small shrink toward the origin, and they can
  land on the surface there, but only loosely. The viewer refuses them in two cases: when they
  collapse to a point in the declared unit but fit in another unit (`… collapse to a point in mm …`),
  and when another unit fits them at least 4 times more closely (`… only loosely in mm …`). Edges
  that fit closely in the declared unit are accepted, even if they would fit in another unit too,
  because an edge on a line or a face through the origin stays on it when it's scaled. The same
  preconditions as for surface strain apply: the same STEP, and the model is never moved.
- The first call on a model builds a surface index, which takes a few tens of milliseconds for a
  typical part. Later calls on the same model reuse it.
- Each successful call **replaces** every shown edge, and `[]` clears them. A failed call keeps
  the edges that are on screen. If you can't show the requested set, call `ClearEdgeHighlights`.
- The edges are depth-tested, so the part hides the edges behind it. While edges are shown, the
  model's meshes and the strain overlay get a larger polygon offset factor, sized to the widest
  line. Each wall is pushed back by its own depth slope, so the lines stay whole at inside corners
  at any viewing angle. Faces turned to the camera barely move, so hidden edges don't show
  through them. Steep walls can lose about a line's half width near their silhouette, which can
  leave a few light pixels where a steep side meets the part behind it.
- **Independent of surface strain.** Both can be shown at the same time, and the edges are drawn
  over the strain overlay. Clearing one leaves the other.
- Loading a new model, `Destroy ()` and `GetViewer ().Clear ()` remove the edges. Per-mesh
  `SetMeshesVisibility` doesn't hide them. They are display only: they can't be picked, and they
  don't affect the camera fit.

### `EmbeddedViewer.ClearEdgeHighlights ()`

Removes the edges. Safe to call at any time.

```ts
const result = viewer.ShowEdgeHighlights(
  riskyEdges.map((edge) => ({ polyline: edge.polyline_xyz, color: edge.angle_deg <= 90 ? "#ff0000" : "#ffa500" }))
);
if (!result.ok) {
  console.warn("risky edges not shown:", result.reason);
}
```

## Model opacity

`EmbeddedViewer.SetModelOpacity (opacity) → { ok, reason }` fades the part so the edge highlights
behind it show through. Its contract is in [`model-opacity-contract.md`](model-opacity-contract.md).

## Website in an iframe (postMessage)

The website (`build/package/website/index.html#model=<url>`) accepts the same overlays from the page
that embeds it in a same-origin iframe. It uses the same engine code as `EmbeddedViewer`
(`ViewerOverlays`), so results and failure semantics are identical. Opened standalone
(`window.parent === window`) it installs no listener and posts nothing.

Messages are plain objects. Each command may carry a `requestId`, echoed in its result.

| Parent → website `type` | Payload | Same as |
|---|---|---|
| `o3dv:edge-highlights:show` | `edges: { polyline: [x,y,z][], color, width? }[]` (mm) | `ShowEdgeHighlights` |
| `o3dv:edge-highlights:clear` | | `ClearEdgeHighlights` |
| `o3dv:surface-strain:show` | `buffer: ArrayBuffer` (send it as a transferable), `thresholds?` | `ShowSurfaceStrain` |
| `o3dv:surface-strain:colors` | `thresholds` | `SetSurfaceStrainColors` |
| `o3dv:surface-strain:clear` | | `ClearSurfaceStrain` |
| `o3dv:model-opacity:set` | `opacity: number` in `(0, 1]` | `SetModelOpacity` |

| Website → parent `type` | When |
|---|---|
| `o3dv:ready` | The listener is installed, the parent may send from then on. |
| `o3dv:model-loaded` | A model finished loading, before the overlays are reapplied. |
| `o3dv:model-load-failed` | A model failed to load. |
| `o3dv:result` | `{ requestId, command, ok, reason }`. `command` is the command's `type`, `reason` is a string when `ok` is false, null otherwise. |

- **Origin.** Only messages with `event.source === window.parent` and `event.origin` equal to the
  website's own origin are handled. Replies are posted to that origin. Anything else is ignored.
- **Stored state.** The website keeps the last requested edges and strain (buffer and thresholds)
  and reapplies them after every model load, including one started from the website's own UI. A
  reapply posts a result with `requestId: null`. A failed show keeps the previous drawing, as in
  the engine; the parent decides whether to clear.
- **Before the model.** A command sent before a model is shown is answered when it is applied on
  load. If a later show or clear of the same overlay arrives first, it is answered with `ok: false`.
  `colors` without any requested strain fails at once; with a pending strain it gets the strain's
  result, and the new colors are used.
- **Model opacity.** `o3dv:model-opacity:set` is a setting, not an overlay. It is answered at
  once and kept across model loads. See [`model-opacity-contract.md`](model-opacity-contract.md).
- **Toolbar.** The overlays stay through camera moves, measure mode and settings (edge display,
  theme), none of which rebuild the scene.

## Compatibility

- **Non-breaking.** Existing calls behave as before, with these small differences:
  - The OCCT importer now also stores the BREP face ranges on each mesh (`Mesh.GetBrepFaces ()`).
  - `Viewer.SetMeshesVisibility` stores the host's choice on each mesh's `userData.userVisible`.
  - The polygon offset that keeps edges on top of the model now sets `polygonOffsetUnits`, which a
    typo had left unset. Models with edges or lines sit very slightly further back in depth.
  - While edge highlights are shown, the model's meshes use a polygon offset factor of up to
    `ceil(width / 2 · √2) + 1` instead of 1. The factor goes back to 1 when the highlights are cleared.
- **Model opacity** (`0.0.13`) is non-breaking: the default is `1`, and nothing changes until
  `SetModelOpacity` or `o3dv:model-opacity:set` is used.
- **Versioning.** Only artifact version `1` is accepted. A newer artifact version resolves with
  `ok: false`, and it needs a package update. New header keys are ignored.
