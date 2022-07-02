export class EventNotifier
{
    constructor ()
    {
        this.eventListeners = new Map ();
    }

    AddEventListener (name, listener)
    {
        if (!this.eventListeners.has (name)) {
            this.eventListeners.set (name, []);
        }
        let listeners = this.eventListeners.get (name);
        listeners.push (listener);
    }

    HasEventListener (name)
    {
        return this.eventListeners.has (name);
    }

    NotifyEventListeners (name, ...args)
    {
        if (!this.eventListeners.has (name)) {
            return;
        }
        let listeners = this.eventListeners.get (name);
        for (let listener of listeners) {
            listener (...args);
        }
    }
}
