/**
 * EventHandler callback
 * @typedef {(event: {[key: string]: any}): void} EventHandlerCallbackType
 */

/**
 * Inherited class for RealtimeAPI and RealtimeClient
 * Adds basic event handling
 * @class
 */
export class RealtimeEventHandler {
  /**
   * Create a new RealtimeEventHandler instance
   * @returns {RealtimeEventHandler}
   */
  constructor() {
    this.eventHandlers = {};
    this.nextEventHandlers = {};
  }

  /**
   * Clears all event handlers
   * @returns {true}
   */
  clearEventHandlers() {
    this.eventHandlers = {};
    this.nextEventHandlers = {};
    return true;
  }

  /**
   * Listen to specific events
   * @param {string} eventName The name of the event to listen to
   * @param {EventHandlerCallbackType} callback Code to execute on event
   * @returns {EventHandlerCallbackType}
   */
  on(eventName, callback) {
    this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
    this.eventHandlers[eventName].push(callback);
    callback;
  }

  /**
   * Listen for the next event of a specified type
   * @param {string} eventName The name of the event to listen to
   * @param {EventHandlerCallbackType} callback Code to execute on event
   * @returns {EventHandlerCallbackType}
   */
  onNext(eventName, callback) {
    this.nextEventHandlers[eventName] = this.nextEventHandlers[eventName] || [];
    this.nextEventHandlers[eventName].push(callback);
  }

  /**
   * Turns off event listening for specific events
   * Calling without a callback will remove all listeners for the event
   * @param {string} eventName
   * @param {EventHandlerCallbackType} [callback]
   * @returns {true}
   */
  off(eventName, callback) {
    const handlers = this.eventHandlers[eventName] || [];
    if (callback) {
      const index = handlers.indexOf(callback);
      if (index === -1) {
        throw new Error(
          `Could not turn off specified event listener for "${eventName}": not found as a listener`,
        );
      }
      handlers.splice(index, 1);
    } else {
      delete this.eventHandlers[eventName];
    }
    return true;
  }

  /**
   * Turns off event listening for the next event of a specific type
   * Calling without a callback will remove all listeners for the next event
   * @param {string} eventName
   * @param {EventHandlerCallbackType} [callback]
   * @returns {true}
   */
  offNext(eventName, callback) {
    const nextHandlers = this.nextEventHandlers[eventName] || [];
    if (callback) {
      const index = nextHandlers.indexOf(callback);
      if (index === -1) {
        throw new Error(
          `Could not turn off specified next event listener for "${eventName}": not found as a listener`,
        );
      }
      nextHandlers.splice(index, 1);
    } else {
      delete this.nextEventHandlers[eventName];
    }
    return true;
  }

  /**
   * Executes all events in the order they were added, with .on() event handlers executing before .onNext() handlers
   * @param {string} eventName
   * @param {any} event
   * @returns {true}
   */
  dispatch(eventName, event) {
    const handlers = [].concat(this.eventHandlers[eventName] || []);
    for (const handler of handlers) {
      handler(event);
    }
    const nextHandlers = [].concat(this.nextEventHandlers[eventName] || []);
    for (const nextHandler of nextHandlers) {
      nextHandler(event);
    }
    delete this.nextEventHandlers[eventName];
    return true;
  }
}
