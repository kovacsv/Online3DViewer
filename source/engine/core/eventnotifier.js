export class EventNotifier
{
    constructor ()
    {
        this.eventListeners = new Map ();
    }

    AddEventListener (eventId, listener)
    {
        if (!this.eventListeners.has (eventId)) {
            this.eventListeners.set (eventId, []);
        }
        let listeners = this.eventListeners.get (eventId);
        listeners.push (listener);
    }

    HasEventListener (eventId)
    {
        return this.eventListeners.has (eventId);
    }

    GetEventNotifier (eventId)
    {
        return () => {
            this.NotifyEventListeners (eventId);
        };
    }

    NotifyEventListeners (eventId, ...args)
    {
        if (!this.eventListeners.has (eventId)) {
            return;
        }
        let listeners = this.eventListeners.get (eventId);
        for (let listener of listeners) {
            listener (...args);
        }
    }
}
