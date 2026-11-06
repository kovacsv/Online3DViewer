# Model opacity in the viewer: host integration contract

What the frontend (the host app) must do to fade the part for the DFM "see through" toggle, and
what the Online3DViewer package guarantees in return. Fading lets the risky edges on the far side
of the part show through it. The edges themselves are described in
[`frequency-analysis-viewer-contract.md`](frequency-analysis-viewer-contract.md#edge-highlights).
This document must change with the public API described below.

## Scope

| Integration path | Model opacity |
|---|---|
| npm package, `OV.EmbeddedViewer` (`CadModelViewerLite` in `CadModel.tsx`) | **Supported.** `SetModelOpacity`. |
| Prebuilt website in a same-origin iframe, driven over postMessage (`useWebsiteViewerOverlays.ts`) | **Supported.** `o3dv:model-opacity:set`. |
| Prebuilt website opened standalone | No UI for it. |

Both paths run the same engine code (`Viewer.SetModelOpacity`), so they behave the same.

## Packaging

- Available from package version `0.0.13`.
- There are no new runtime dependencies. `o3dv.module.d.ts` declares `EmbeddedViewer.SetModelOpacity`
  and `Viewer.SetModelOpacity`.

## API

### `EmbeddedViewer.SetModelOpacity (opacity) → { ok, reason }`

`opacity` is a number in `(0, 1]`. `1` shows the model solid and is the default.

```ts
const result = viewer.SetModelOpacity(seeThrough ? 0.2 : 1);
if (!result.ok) {
  console.warn("opacity not set:", result.reason);
}
```

- **Success:** `{ ok: true, reason: null }`.
- **Failure:** a value that isn't a finite number in `(0, 1]`, such as `0`, `-1`, `1.5`, `NaN`,
  `Infinity`, `"0.5"`, `null` or `undefined`, returns
  `{ ok: false, reason: "opacity must be a number in (0, 1]" }`. Nothing changes.

The lower-level `Viewer.SetModelOpacity (opacity)` returns `true` or `false` with the same rules.
`Viewer.GetModelOpacity ()` returns the current value.

## What it does

| Shown object | While `opacity < 1` |
|---|---|
| The model's meshes | Faded |
| Surface strain overlay | Faded |
| Selected (highlighted) meshes | Faded |
| Edge highlights (`ShowEdgeHighlights`) | Full color, drawn on top of the faded surfaces |
| The website's own edge display (black lines) | Solid, unchanged |
| Line geometry in the model itself, the measure tool's markers | Unchanged |

- **Fading.** Each faded material becomes `transparent`, its `opacity` becomes its own opacity times
  `opacity`, and it stops writing depth. Without depth writes, edges behind the part pass the depth
  test and are drawn.
- **Edges on top.** While faded, the edge highlight lines are transparent too, with a higher
  `renderOrder` than the meshes. three.js draws them after the faded surfaces, so the surfaces don't
  blend over the lines and dim them. Edge width and color don't change; the host passes `width` per
  edge as before.
- **Exact restore.** The viewer keeps each material's own `transparent`, `opacity` and `depthWrite`.
  Setting `1` restores them exactly, including materials the model made transparent itself.
- **No double fading.** The faded value is always computed from the original, so a material shared
  by several meshes, a repeated call, or a re-apply after an overlay change fades it only once.
  `0.2` gives `0.2`, never `0.04`.

## Lifecycle

It is a **viewer setting, not an overlay.** The host sets it when the toggle changes and doesn't
handle anything else.

- It may be called before a model loads. The model is faded when it is shown.
- It stays through model loads, `GetViewer ().Clear ()`, surface strain shows, recolors and clears,
  edge highlight shows and clears, selection changes and edge display changes.
- Changing the opacity while a mesh is selected also updates that mesh's own materials, so it has the
  right opacity when it is deselected.
- `Destroy ()` ends it with the viewer.

## Website in an iframe (postMessage)

| Parent → website `type` | Payload | Same as |
|---|---|---|
| `o3dv:model-opacity:set` | `opacity: number` in `(0, 1]`, `requestId?` | `SetModelOpacity` |

```ts
iframe.contentWindow.postMessage({ type: "o3dv:model-opacity:set", opacity: 0.2, requestId: 7 }, origin);
// → { type: "o3dv:result", requestId: 7, command: "o3dv:model-opacity:set", ok: true, reason: null }
```

- **Answered at once,** with or without a model. Nothing is queued: the website's viewer keeps the
  setting across model loads, so a load doesn't apply it again or post another result.
- **Origin.** The same rules as the other commands apply. Only messages from `window.parent` on the
  website's own origin are handled.
- **Reloads.** A reloaded iframe starts solid. Send the current opacity when the website posts
  `o3dv:ready`, along with the overlays.
- **Toolbar.** It stays through the website's theme, edge display, projection and measure mode
  changes.

## Host integration (Uptool)

- `DfmOverlays` carries `modelOpacity: number`: `0.2` when see through is on, `1` otherwise.
- **Inline:** in `CadModelViewerLite`, call `viewer.SetModelOpacity(modelOpacity)` in an effect on
  `[modelOpacity, viewer]`. Delete `seeThrough.ts` and its effect; loads and recolors need no handling.
- **Full screen:** in `useWebsiteViewerOverlays`, post `o3dv:model-opacity:set` when `modelOpacity`
  changes and on `o3dv:ready`. It gets its own entry in the request bookkeeping, like each overlay.
- Both views share the toggle state.

## Known limits

- Faded surfaces don't write depth, so where the part overlaps itself, its far and near faces blend
  in draw order instead of strict depth order. Inner faces can look a little lighter or darker than
  a depth-sorted render would show them.
- Edge highlights keep the depth test, so solid geometry still hides them. Only faded surfaces let
  them through.

## Compatibility

- **Non-breaking.** The default is `1`. Nothing changes until `SetModelOpacity` or
  `o3dv:model-opacity:set` is used.

## Testing

- `npm test`: the `Model Opacity` suite (`test/tests/modelopacity_test.js`) and the `Host Messages`
  suite (`test/tests/hostmessages_test.js`).
- By eye: `sandbox/embed_surface_strain.html` has a "See through" slider. Load a STEP part, show
  **Inside corners** or **Demo edges**, and drag the slider down. Edges on the far side should show at
  full color. Check light and dark themes, perspective and orthographic.
