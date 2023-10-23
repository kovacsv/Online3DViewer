import { CreateModelUrlParameters, CreateUrlParser } from '../engine/parameters/parameterlist.js';

export class HashHandler
{
    constructor ()
    {
        this.skipNextEvent = false;
        this.eventListener = null;
    }

    SetEventListener (eventListener)
    {
        this.eventListener = eventListener;
        window.onhashchange = this.OnChange.bind (this);
    }

    SkipNextEventHandler ()
    {
        this.skipNextEvent = true;
    }

    HasHash ()
    {
        let hash = this.GetHash ();
        return hash.length > 0;
    }

    ClearHash ()
    {
        this.SetHash ('');
    }

    GetModelFilesFromHash ()
    {
        let parser = CreateUrlParser (this.GetHash ());
        return parser.GetModelUrls ();
    }

    SetModelFilesToHash (files)
    {
        let params = CreateModelUrlParameters (files);
        this.SetHash (params);
    }

    GetCameraFromHash ()
    {
        let parser = CreateUrlParser (this.GetHash ());
        return parser.GetCamera ();
    }

    GetProjectionModeFromHash ()
    {
        let parser = CreateUrlParser (this.GetHash ());
        return parser.GetProjectionMode ();
    }

    GetBackgroundFromHash ()
    {
        let parser = CreateUrlParser (this.GetHash ());
        return parser.GetBackgroundColor ();
    }

    GetEnvironmentSettingsFromHash ()
    {
        let parser = CreateUrlParser (this.GetHash ());
        return parser.GetEnvironmentSettings ();
    }

    GetDefaultColorFromHash ()
    {
        let parser = CreateUrlParser (this.GetHash ());
        return parser.GetDefaultColor ();
    }

    GetDefaultLineColorFromHash ()
    {
        let parser = CreateUrlParser (this.GetHash ());
        return parser.GetDefaultLineColor ();
    }

    GetEdgeSettingsFromHash ()
    {
        let parser = CreateUrlParser (this.GetHash ());
        return parser.GetEdgeSettings ();
    }

    GetHash ()
    {
        return window.location.hash.substring (1);
    }

    SetHash (hash)
    {
        window.location.hash = hash;
    }

    OnChange ()
    {
        if (this.skipNextEvent) {
            this.skipNextEvent = false;
            return;
        }
        this.eventListener ();
    }
}
