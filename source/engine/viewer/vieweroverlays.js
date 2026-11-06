import { EdgeHighlightResult, PrepareEdgeHighlights } from '../edgehighlight/edgehighlight.js';
import { PrepareSurfaceStrain, SurfaceStrainParams, SurfaceStrainResult } from '../surfacestrain/surfacestrain.js';
import { CreateSurfaceStrainColorScale } from '../surfacestrain/surfacestraincolor.js';

/**
 * Draws the surface strain and the edge highlights of a model on a {@link Viewer}. It is shared by
 * {@link EmbeddedViewer} and the website, see their methods with the same names for details.
 */
export class ViewerOverlays
{
    /**
     * @param {Viewer} viewer The viewer to draw on.
     */
    constructor (viewer)
    {
        this.viewer = viewer;
        this.model = null;
        this.surfaceStrainHeader = null;
        // Bumped whenever a pending ShowSurfaceStrain must not paint anymore: the model changed,
        // the strain was cleared, or the viewer was destroyed.
        this.surfaceStrainRequest = 0;
    }

    /**
     * Sets the model the overlays belong to. It must be called with null when a new model starts
     * loading and with the model when it is shown. The viewer is cleared by its owner.
     * @param {Model} model The shown model or null.
     */
    SetModel (model)
    {
        this.model = model;
        this.surfaceStrainHeader = null;
        this.surfaceStrainRequest += 1;
    }

    /**
     * @returns {boolean} True if a model is set.
     */
    HasModel ()
    {
        return this.model !== null;
    }

    /**
     * See {@link EmbeddedViewer#ShowSurfaceStrain}.
     * @param {ArrayBuffer} buffer Content of surface_strain.bin.
     * @param {SurfaceStrainParams} [params] Parameters.
     * @returns {Promise<SurfaceStrainResult>} Resolves with ok false and a reason on failure.
     */
    ShowSurfaceStrain (buffer, params)
    {
        return new Promise ((resolve) => {
            if (this.model === null) {
                let result = new SurfaceStrainResult ();
                result.reason = 'no model is loaded';
                resolve (result);
                return;
            }
            let model = this.model;
            let request = this.surfaceStrainRequest;
            // Let the browser render before the mapping blocks the main thread.
            setTimeout (() => {
                let result = new SurfaceStrainResult ();
                if (request !== this.surfaceStrainRequest || this.model !== model) {
                    result.reason = 'the model changed or the surface strain was cleared before it was shown';
                    resolve (result);
                    return;
                }
                try {
                    result = PrepareSurfaceStrain (model, buffer, params);
                    if (result.ok) {
                        this.surfaceStrainHeader = result.header;
                        this.viewer.SetSurfaceStrain (result.mapping, result.colorScale);
                    }
                } catch (error) {
                    result = new SurfaceStrainResult ();
                    result.reason = error.message;
                }
                resolve (result);
            }, 0);
        });
    }

    /**
     * See {@link EmbeddedViewer#SetSurfaceStrainColors}.
     * @param {SurfaceStrainParams} params Color parameters.
     * @returns {{ok: boolean, reason: string|null, colorScale: object|null}} On failure the
     * current colors stay.
     */
    SetSurfaceStrainColors (params)
    {
        if (!this.viewer.HasSurfaceStrain () || this.surfaceStrainHeader === null) {
            return { ok : false, reason : 'no surface strain is shown', colorScale : null };
        }
        let colorScale = null;
        try {
            colorScale = CreateSurfaceStrainColorScale (params || new SurfaceStrainParams (), this.surfaceStrainHeader);
        } catch (error) {
            return { ok : false, reason : error.message, colorScale : null };
        }
        this.viewer.SetSurfaceStrainColorScale (colorScale);
        return { ok : true, reason : null, colorScale : colorScale };
    }

    /**
     * See {@link EmbeddedViewer#ClearSurfaceStrain}.
     */
    ClearSurfaceStrain ()
    {
        this.viewer.ClearSurfaceStrain ();
        this.surfaceStrainHeader = null;
        this.surfaceStrainRequest += 1;
    }

    /**
     * See {@link EmbeddedViewer#ShowEdgeHighlights}.
     * @param {EdgeHighlight[]} edges Edges with polyline, color and an optional width in pixels.
     * @param {EdgeHighlightParams} [params] Parameters.
     * @returns {EdgeHighlightResult} On failure ok is false and reason says why.
     */
    ShowEdgeHighlights (edges, params)
    {
        if (this.model === null) {
            let result = new EdgeHighlightResult ();
            result.reason = 'no model is loaded';
            return result;
        }
        try {
            let prepared = PrepareEdgeHighlights (this.model, edges, params);
            if (prepared.result.ok) {
                this.viewer.SetEdgeHighlights (prepared.prepared);
            }
            return prepared.result;
        } catch (error) {
            let result = new EdgeHighlightResult ();
            result.reason = error.message;
            return result;
        }
    }

    /**
     * See {@link EmbeddedViewer#ClearEdgeHighlights}.
     */
    ClearEdgeHighlights ()
    {
        this.viewer.ClearEdgeHighlights ();
    }

    /**
     * See {@link EmbeddedViewer#SetModelOpacity}.
     * @param {number} opacity In (0, 1], 1 shows the model solid.
     * @returns {{ok: boolean, reason: string|null}} On failure nothing changes.
     */
    SetModelOpacity (opacity)
    {
        if (!this.viewer.SetModelOpacity (opacity)) {
            return { ok : false, reason : 'opacity must be a number in (0, 1]' };
        }
        return { ok : true, reason : null };
    }
}
