import { IsDefined } from '../engine/core/core.js';
import { SurfaceStrainParams } from '../engine/surfacestrain/surfacestrain.js';

export const HostMessageType =
{
    EdgeHighlightsShow : 'o3dv:edge-highlights:show',
    EdgeHighlightsClear : 'o3dv:edge-highlights:clear',
    SurfaceStrainShow : 'o3dv:surface-strain:show',
    SurfaceStrainColors : 'o3dv:surface-strain:colors',
    SurfaceStrainClear : 'o3dv:surface-strain:clear',
    ModelOpacitySet : 'o3dv:model-opacity:set',
    Ready : 'o3dv:ready',
    ModelLoaded : 'o3dv:model-loaded',
    ModelLoadFailed : 'o3dv:model-load-failed',
    Result : 'o3dv:result'
};

function CreateSurfaceStrainParams (thresholds)
{
    let params = new SurfaceStrainParams ();
    params.thresholds = (thresholds === undefined ? null : thresholds);
    return params;
}

/**
 * Lets the page that embeds the website in an iframe draw the DFM overlays (edge highlights and
 * surface strain) over postMessage. It keeps the last requested overlays and draws them again
 * after every model load, so a command may arrive before the model and is applied when it is
 * shown. It also sets the model opacity, a viewer setting that is applied at once and that the
 * viewer keeps through model loads. Only messages from the parent window on the website's own
 * origin are accepted.
 */
export class HostMessageHandler
{
    /**
     * @param {Window} ownWindow The website's window.
     * @param {ViewerOverlays} overlays Overlays of the website's viewer.
     */
    constructor (ownWindow, overlays)
    {
        this.ownWindow = ownWindow;
        this.overlays = overlays;
        this.origin = null;
        // Last requested overlays, null if none.
        this.edges = null;
        this.strain = null;
        // Promise of the surface strain being shown, it resolves with the result.
        this.strainShowing = null;
        // Commands that arrived without a model, they are answered when it is shown.
        this.pending = {
            edges : [],
            strain : []
        };
    }

    /**
     * Starts listening if the website is in an iframe, otherwise it does nothing.
     * @returns {boolean} True if the listener is installed.
     */
    Install ()
    {
        if (this.ownWindow.parent === this.ownWindow) {
            return false;
        }
        this.origin = this.ownWindow.location.origin;
        this.ownWindow.addEventListener ('message', (event) => {
            this.OnMessage (event);
        });
        this.Post ({ type : HostMessageType.Ready });
        return true;
    }

    IsInstalled ()
    {
        return this.origin !== null;
    }

    /**
     * Must be called after a model is shown and set on the overlays.
     */
    OnModelLoaded ()
    {
        if (!this.IsInstalled ()) {
            return;
        }
        this.Post ({ type : HostMessageType.ModelLoaded });

        let edgesPending = this.TakePending ('edges');
        if (this.edges !== null) {
            let result = this.overlays.ShowEdgeHighlights (this.edges);
            this.AnswerAll (edgesPending, HostMessageType.EdgeHighlightsShow, result);
        }

        let strainPending = this.TakePending ('strain');
        if (this.strain !== null) {
            this.ShowStrain ().then ((result) => {
                this.AnswerAll (strainPending, HostMessageType.SurfaceStrainShow, result);
            });
        }
    }

    OnModelLoadFailed ()
    {
        if (!this.IsInstalled ()) {
            return;
        }
        this.Post ({ type : HostMessageType.ModelLoadFailed });
    }

    OnMessage (event)
    {
        if (event.source !== this.ownWindow.parent || event.origin !== this.origin) {
            return;
        }
        let message = event.data;
        if (message === null || typeof message !== 'object' || typeof message.type !== 'string') {
            return;
        }
        let command = {
            type : message.type,
            requestId : (message.requestId === undefined ? null : message.requestId)
        };
        if (message.type === HostMessageType.EdgeHighlightsShow) {
            this.OnEdgeHighlightsShow (command, message.edges);
        } else if (message.type === HostMessageType.EdgeHighlightsClear) {
            this.OnEdgeHighlightsClear (command);
        } else if (message.type === HostMessageType.SurfaceStrainShow) {
            this.OnSurfaceStrainShow (command, message.buffer, message.thresholds);
        } else if (message.type === HostMessageType.SurfaceStrainColors) {
            this.OnSurfaceStrainColors (command, message.thresholds);
        } else if (message.type === HostMessageType.SurfaceStrainClear) {
            this.OnSurfaceStrainClear (command);
        } else if (message.type === HostMessageType.ModelOpacitySet) {
            this.OnModelOpacitySet (command, message.opacity);
        }
    }

    OnEdgeHighlightsShow (command, edges)
    {
        this.edges = edges;
        if (!this.overlays.HasModel ()) {
            this.Supersede ('edges', 'replaced by a later command before the model loaded');
            this.pending.edges.push (command);
            return;
        }
        this.Answer (command, this.overlays.ShowEdgeHighlights (edges));
    }

    OnEdgeHighlightsClear (command)
    {
        this.edges = null;
        this.Supersede ('edges', 'the edge highlights were cleared before the model loaded');
        this.overlays.ClearEdgeHighlights ();
        this.Answer (command, { ok : true, reason : null });
    }

    OnSurfaceStrainShow (command, buffer, thresholds)
    {
        this.strain = {
            buffer : buffer,
            thresholds : thresholds
        };
        if (!this.overlays.HasModel ()) {
            this.Supersede ('strain', 'replaced by a later command before the model loaded');
            this.pending.strain.push (command);
            return;
        }
        this.ShowStrain ().then ((result) => {
            this.Answer (command, result);
        });
    }

    OnSurfaceStrainColors (command, thresholds)
    {
        if (this.strain === null) {
            this.Answer (command, { ok : false, reason : 'no surface strain is shown' });
            return;
        }
        this.strain.thresholds = thresholds;
        if (!this.overlays.HasModel ()) {
            this.pending.strain.push (command);
        } else if (this.strainShowing !== null) {
            // ShowStrain applies the new colors when the mapping is done.
            this.strainShowing.then ((result) => {
                this.Answer (command, result);
            });
        } else {
            this.Answer (command, this.overlays.SetSurfaceStrainColors (CreateSurfaceStrainParams (thresholds)));
        }
    }

    OnSurfaceStrainClear (command)
    {
        this.strain = null;
        this.Supersede ('strain', 'the surface strain was cleared before the model loaded');
        this.overlays.ClearSurfaceStrain ();
        this.Answer (command, { ok : true, reason : null });
    }

    // A viewer setting, not an overlay: the viewer keeps it through model loads, so it is applied
    // and answered at once, with or without a model.
    OnModelOpacitySet (command, opacity)
    {
        this.Answer (command, this.overlays.SetModelOpacity (opacity));
    }

    ShowStrain ()
    {
        let strain = this.strain;
        let thresholds = strain.thresholds;
        let showing = this.overlays.ShowSurfaceStrain (strain.buffer, CreateSurfaceStrainParams (thresholds)).then ((result) => {
            if (this.strainShowing === showing) {
                this.strainShowing = null;
            }
            // The colors changed while the mapping ran.
            if (result.ok && this.strain === strain && strain.thresholds !== thresholds) {
                result = this.overlays.SetSurfaceStrainColors (CreateSurfaceStrainParams (strain.thresholds));
            }
            return result;
        });
        this.strainShowing = showing;
        return showing;
    }

    TakePending (kind)
    {
        let pending = this.pending[kind];
        this.pending[kind] = [];
        return pending;
    }

    Supersede (kind, reason)
    {
        for (let command of this.TakePending (kind)) {
            this.Answer (command, { ok : false, reason : reason });
        }
    }

    // Answers the commands that waited for the model, or reports the reapplied overlay.
    AnswerAll (commands, reappliedType, result)
    {
        if (commands.length === 0) {
            commands = [{ type : reappliedType, requestId : null }];
        }
        for (let command of commands) {
            this.Answer (command, result);
        }
    }

    Answer (command, result)
    {
        let reason = null;
        if (!result.ok) {
            reason = (IsDefined (result.reason) ? String (result.reason) : 'unknown error');
        }
        this.Post ({
            type : HostMessageType.Result,
            requestId : command.requestId,
            command : command.type,
            ok : result.ok,
            reason : reason
        });
    }

    Post (message)
    {
        this.ownWindow.parent.postMessage (message, this.origin);
    }
}
