function SimpleEvent() {
    var self = this;

    self.queue = {};
    self.fired = [];
}

SimpleEvent.prototype.fire = function(event, event_args) {
    var self = this;

    if(typeof self.queue[event] == 'undefined') {
        return;
    }

    var queue = self.queue[event].slice();
    var args = [true];
    if(typeof event_args === 'object') {
        args = event_args;
    }

    while (queue.length) {
        (queue.shift()).apply(null, args);
    }

    self.fired[event] = args;
};

SimpleEvent.prototype.on = function(event, callback) {
    var self = this;

    if (typeof self.fired[event] !== 'undefined') {
        return callback.apply(null, self.fired[event]);
    }

    if (typeof self.queue[event] === 'undefined') {
        self.queue[event] = [];
    }
    self.queue[event].push(callback);
};