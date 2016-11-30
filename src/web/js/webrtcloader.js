function webRTCloader(options) {
    var self = this;

    self.config = options;
    self.eventBus = new SimpleEvent();
    self.events = ['peer-init', 'peer-connected', 'peer-data', 'peer-close', 'peer-error', 'peer-update'];

    self.webRTCid = '';
    self.webRTCconn = null;
    self.webRTCpeersAll = [];
    self.webRTCpeersInput = {};

    self.eventBus.on('peer-init', function(){
        self._updatePeers();
        self._initPeerUpdater();
    });

    self._init();
}

webRTCloader.prototype._init = function() {
    var self = this;

    self.webRTCconn = new Peer({
        key: self.config.key,
        host: self.config.host,
        port: self.config.port
    });

    self.webRTCconn.on('open', function(id){
        self.webRTCid = self.webRTCconn.id;
        self.eventBus.fire('peer-init', [id]);
    });
    self.webRTCconn.on('connection', function(conn) {
        conn.on('open', function() {
            self.webRTCpeersInput[this.peer] = conn;

            self.eventBus.fire('peer-connected', [this.peer]);
        });
        conn.on('data', function(data) {
            self.eventBus.fire('peer-data', [this.peer, data]);
        });
        conn.on('close', function() {
            delete self.webRTCpeersInput[this.peer];

            self.eventBus.fire('peer-close', [this.peer]);
        });
        conn.on('error', function(err) {
            self.eventBus.fire('peer-error', [this.peer, err]);
        });
    });
    self.webRTCconn.on('call', function(conn){
        conn.close();
    });
};

webRTCloader.prototype._updatePeers = function() {
    var self = this;

    if(typeof self.webRTCid === 'undefined') {
        return;
    }

    self.webRTCconn.listAllPeers(function (peersList) {
        if(peersList.length <= 1) {
            return;
        }

        var indx = peersList.indexOf(self.webRTCid);
        if(indx != -1) {
            peersList.splice(indx, 1);
        }

        self.webRTCpeersAll = peersList;
        self.eventBus.fire('peer-update', [self.webRTCpeersAll]);
    });
};

webRTCloader.prototype._initPeerUpdater = function() {
    var self = this;

    var interval = self.config.updatePeriod;
    if(typeof interval == 'undefined') {
        interval = 5000;
    }

    setInterval(function() {
        self._updatePeers();
    }, interval);
};

webRTCloader.prototype._conn_open = function(peerId, cb_data, cb_error, cb_open, cb_close) {

    var conn = this.webRTCconn.connect(peerId);
    conn.on('open', function(){
        cb_open(this.peer);
    });
    conn.on('data', function(data) {
        cb_data(this.peer, data);
    });
    conn.on('close', function() {
        cb_close(this.peer);
    });
    conn.on('error', function(err) {
        cb_error(this.peer, err);
    });
    return conn;
};

webRTCloader.prototype.on = function(event, cb) {
    if(this.events.indexOf(event) == -1) {
        return;
    }
    this.eventBus.on(event, cb);
};

webRTCloader.prototype.getId = function(){
    return this.webRTCid;
}

webRTCloader.prototype.getAllPeers = function() {
    return this.webRTCpeersAll.slice();
};

webRTCloader.prototype.getConnectedPeers = function() {
    var tmp = [];
    for(var peerId in this.webRTCpeersInput) {
        tmp.push(peerId);
    }
    return tmp;
};

webRTCloader.prototype.send = function(peerId, msg) {
    var self = this;

    if(typeof self.webRTCpeersInput[peerId] === 'undefined') {
        return;
    }

    var conn = self.webRTCpeersInput[peerId];
    conn.send(msg);
};

webRTCloader.prototype._callAll = function(message, cb_data, cb_err) {
    var self = this;

    var peers = self.getAllPeers();
    if(peers.length == 0) {
        cb_err('No peers');
        return;
    }

    var evnt = new SimpleEvent();
    evnt.on('load', function(){
        if(peers.length == 0) {
            return;
        }

        var peerId = peers.shift();

        var cb_data_ = function(peerId, data) {
            if(typeof data.error != 'undefined') {
                evnt.fire('load-error', [peerId, data.error]);
            } else {
                evnt.fire('load-success', [peerId, data])
            }
            conn.close();
        };
        var cb_err_ = function(peerId, err) {
            evnt.fire('load-error', [peerId, err]);
            conn.close();
        };
        var cb_open_ = function() {
            conn.send(message);
        };
        var cb_close_ = function() {
        };

        var conn = self._conn_open(peerId, cb_data_, cb_err_, cb_open_, cb_close_);
    });
    evnt.on('load-error', function(peerId, err) {
        if (peers.length == 0) {
            cb_err(err);
        } else {
            evnt.fire('load');
        }
    });
    evnt.on('load-success', function(peerId, data) {
        cb_data(data);
    });
    evnt.fire('load');
};

webRTCloader.prototype.getFileChunk = function(byteStart, byteEnd, cb_data, cb_err) {
    var message = {
        getFileChunk: [byteStart, byteEnd]
    };

    this._callAll(message, cb_data, cb_err);
};

webRTCloader.prototype.getFile = function(cb_data, cb_err) {
    var message = {
        getFile: true
    };

    this._callAll(message, cb_data, cb_err);
};
