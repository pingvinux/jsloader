function ajaxLoader() {
}
ajaxLoader.prototype.head = function(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', url);
    xhr.onload = function () {
        var headres_all = {};
        var headers_ = xhr.getAllResponseHeaders();
        if(headers_ != null) {
            var headrs_arr = headers_.split("\r\n");
            for(var i in headrs_arr) {
                if(headrs_arr[i] == "") {
                    continue;
                }

                headr_arr = headrs_arr[i].split(/: (.+)/);
                headres_all[headr_arr[0]] = headr_arr[1];
            }
        }

        cb(null, headres_all);
    };
    xhr.onerror = function() {
        var err = 'HTTP error. Status: ' + xhr.status + ' Message: ' + xhr.statusText;
        cb(err, null);
    };
    xhr.send();
};
ajaxLoader.prototype.range = function(url, byteStart, byteEnd, cb) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Range', 'bytes=' + byteStart + '-' + byteEnd);
    xhr.onload = function() {
        cb(null, xhr.response);
    };
    xhr.onerror = function() {
        var err = 'HTTP error. Status: ' + xhr.status + ' Message: ' + xhr.statusText;
        cb(err, null);
    };
    xhr.send();
};





