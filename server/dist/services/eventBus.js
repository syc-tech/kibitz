"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
const node_events_1 = require("node:events");
class KibitzEventBus extends node_events_1.EventEmitter {
    emitChatUpdated(chat) {
        this.emit('chat-updated', chat);
    }
    emitMessageCreated(message) {
        this.emit('message-created', message);
    }
}
exports.eventBus = new KibitzEventBus();
exports.eventBus.setMaxListeners(50);
//# sourceMappingURL=eventBus.js.map