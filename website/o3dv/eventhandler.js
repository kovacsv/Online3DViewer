OV.EventHandler = class
{
    constructor (eventHandler)
    {
        this.eventHandler = eventHandler;
    }

    HandleEvent (name, parameters)
    {
        if (this.eventHandler === undefined || this.eventHandler === null) {
            return;
        }
        this.eventHandler (name, parameters);
    }
};
