export class EventNotifier {
    eventListeners: Map<any, any>;
    AddEventListener(eventId: any, listener: any): void;
    HasEventListener(eventId: any): boolean;
    GetEventNotifier(eventId: any): () => void;
    NotifyEventListeners(eventId: any, ...args: any[]): void;
}
//# sourceMappingURL=eventnotifier.d.ts.map