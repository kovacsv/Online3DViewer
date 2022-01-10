export class EventHandler
{
    constructor (eventHandler)
    {
        this.eventHandler = eventHandler;
    }

    HandleEvent (eventName, eventData)
    {
        if (this.eventHandler === undefined || this.eventHandler === null) {
            return;
        }
        this.eventHandler (eventName, eventData);
    }
}
