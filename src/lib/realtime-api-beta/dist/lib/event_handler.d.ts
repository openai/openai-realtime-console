/**
 * Inherited class for RealtimeAPI and RealtimeClient
 * Adds basic event handling
 * @class
 */
export class RealtimeEventHandler {
    eventHandlers: {};
    nextEventHandlers: {};
    /**
     * Clears all event handlers
     * @returns {true}
     */
    clearEventHandlers(): true;
    /**
     * Listen to specific events
     * @param {string} eventName The name of the event to listen to
     * @param {EventHandlerCallbackType} callback Code to execute on event
     * @returns {EventHandlerCallbackType}
     */
    on(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType;
    /**
     * Listen for the next event of a specified type
     * @param {string} eventName The name of the event to listen to
     * @param {EventHandlerCallbackType} callback Code to execute on event
     * @returns {EventHandlerCallbackType}
     */
    onNext(eventName: string, callback: EventHandlerCallbackType): EventHandlerCallbackType;
    /**
     * Turns off event listening for specific events
     * Calling without a callback will remove all listeners for the event
     * @param {string} eventName
     * @param {EventHandlerCallbackType} [callback]
     * @returns {true}
     */
    off(eventName: string, callback?: EventHandlerCallbackType): true;
    /**
     * Turns off event listening for the next event of a specific type
     * Calling without a callback will remove all listeners for the next event
     * @param {string} eventName
     * @param {EventHandlerCallbackType} [callback]
     * @returns {true}
     */
    offNext(eventName: string, callback?: EventHandlerCallbackType): true;
    /**
     * Waits for next event of a specific type and returns the payload
     * @param {string} eventName
     * @param {number|null} [timeout]
     * @returns {Promise<{[key: string]: any}|null>}
     */
    waitForNext(eventName: string, timeout?: number | null): Promise<{
        [key: string]: any;
    } | null>;
    /**
     * Executes all events in the order they were added, with .on() event handlers executing before .onNext() handlers
     * @param {string} eventName
     * @param {any} event
     * @returns {true}
     */
    dispatch(eventName: string, event: any): true;
}
//# sourceMappingURL=event_handler.d.ts.map