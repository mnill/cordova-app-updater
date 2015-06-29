var H5AppFS = function (system, props, updateUrl) {

    this._system = null;
    this._config = null;
    this._cacheName = 'cache';
    this._updateUrl = updateUrl;
    this.mustBeUpdated = props ? props.mustBeUpdated || false : false; //Not realized now
    this._path = {
        root: '',
        cache: ''
    };

    this._init(system)
};

//init
H5AppFS.prototype._init = function(system) {
    //alert('init');
    this._system = system;
    this._path.root = system.root.fullPath;
    this._path.cache = system.root.fullPath + this._cacheName;
    var _self = this;
    this.loadConfig();
};

H5AppFS.prototype.loadConfig = function() {
    //alert('load config');
    var _self = this;
    var request = new XMLHttpRequest();
    request.open('GET', this._updateUrl +'config.json'+ '?nocache=' + new Date().getTime());
    request.onreadystatechange = function(e) {
        if (this.readyState == 4) {
            if (this.status == 200) {
                try {
                    _self._config = JSON.parse(this.responseText);
                    _self.startUpdate();
                }
                catch (e) {
                    navigator.notification.alert('', _self.loadConfig.bind(_self), 'Something is wrong', 'Retry');
                }
            }
            else {
                navigator.notification.alert('', _self.loadConfig.bind(_self), 'No Network Connection', 'Retry');
            }
        }
    };
    request.send(null);
};

H5AppFS.prototype.startUpdate = function(callback){
    //alert('start update');
    this.check(function(err, link){
        if (!err){
            window.location.href = this._system.root.toURL() + 'cache/www/' + this._config.start;
        } else
            this.cleanCache(function(err){
                if (err){
                    navigator.notification.alert('', this.startUpdate.bind(this), 'Something is wrong', 'Retry');
                } else {
                    navigator.notification.alert('', this.startUpdate.bind(this), 'No Network Connection', 'Retry');
                }
            }.bind(this));
    }.bind(this));
};

H5AppFS.prototype.getConfig = function(){
    return this._config;
};

H5AppFS.prototype.check = function(callback){
    //alert('checkVersion');
    this.checkCache(function(entry) {
            this.checkVersion(entry,
                function(err, isUpToDate){
                    if ((err)&&(err!=null)){
                        //alert(err.code);
                        callback(true);
                    } else {
                        if (isUpToDate){
                            callback();
                        } else {
                            this.clearAndUpdate(function(err){
                                callback(err);
                            }.bind(this));
                        }
                    }
                }.bind(this)
            )}.bind(this),
        function() {
            this.copyFilesToCache(function(err){
                if ((err)&&(err!= null)){
                    callback(err)
                } else{
                    //alert('first copy succes');
                    this.check(callback);
                }
            }.bind(this));
        }.bind(this));

};

H5AppFS.prototype.clearAndUpdate = function(callback){
    this.cleanCache(function(err){
        if (err){
            callback(err);
        } else {
            this.copyFilesToCache(function(err){
                if ((err)&&(err!=null))
                    callback(err)
                else
                    this.update(callback);
            }.bind(this));
        }
    }.bind(this));
};

H5AppFS.prototype.checkVersion = function(cacheEntry, callback){
    this.checkCache(function(entry){
            //alert('check cached config');
            entry.getFile('www/config.json', {create:false}, function(fileEntry){
                    fileEntry.file(function(file){
                            var reader = new FileReader();
                            reader.onloadend = function(evt) {
                                try {
                                    callback(null, JSON.parse(evt.target.result).version === this._config.version);
                                } catch(er){
                                    //alert(er);
                                    callback({error:'json parseFail', code:111})
                                }
                            }.bind(this);
                            reader.readAsText(file);
                        }.bind(this),
                        function(err){
                            callback(err);
                        })
                }.bind(this),
                function(err){
                    callback(err);
                })
        }.bind(this),
        function(err){
            callback(err);
        });
};


H5AppFS.prototype.copyFilesToCache = function(callback){
    new _H5AppCopyer(this, callback)
};


H5AppFS.prototype.update = function(callback){
    //alert('Update');
    new _H5AppUpdater(this, callback)
};

H5AppFS.prototype.cleanCache = function(callback){
    //alert('clean cache');
    this.checkCache(function(B) {
        B.removeRecursively(function() {
            callback && callback();
        }, function(err) {
            callback && callback(err);
        })
    }, function(err) {
        callback && callback(err);
    })
};

H5AppFS.prototype.checkCache = function(callback1, callback2){
    this._system.root.getDirectory(this._cacheName, {
        create: false
    }, function(B) {
        console.log('cache file exist!');
        callback1 && callback1(B)
    }, function(err) {
        console.log('cache file not found!(clear)');
        callback2 && callback2(err)
    })
};

H5AppFS.prototype.getSystem = function() {
    return this._system
};

H5AppFS.prototype.getPath = function(key) {
    return this._path[key]
};

H5AppFS.prototype.getCacheName = function() {
    return this._cacheName
};

/*
 * Files copier. Copy local files to cache.
 */
var _H5AppCopyer = function(fs, callback){
    this._init(fs, callback)
};

_H5AppCopyer.prototype._init = function(fs, callback){
    this._fs = fs;
    this._callback = callback;

    var _self = this;
    _self._tryCreateCacheFile(function(err, entry){
        if ((err)&&(err != null))
            _self._callback(err);
        else
            _self._copy(entry);
    })
};

// Try create cache folder
_H5AppCopyer.prototype._tryCreateCacheFile = function(callback){
    //alert('try create');
    var _self = this;
    _self._fs.getSystem().root.getDirectory('cache', {
        create: true
    }, function(entry) {
        callback && callback(null, entry);
    }, function(err) {
        callback && callback(err);
    })
};


_H5AppCopyer.prototype._copy = function(entry, callback){
    var _self = this;
    //alert('Try copy');
    window.resolveLocalFileSystemURI(cordova.file.applicationDirectory + '/www', function(wwwEntry) {
        var oldName = 'www';
        wwwEntry.copyTo(entry, oldName, function() {
            _self._end();
        }, function(err) {
            //alert('copy file fail! err:' + err.code);
            callback(err);
        });
    }, function(err) {
        //alert('fail get application www Directory' + err.code);
        callback(err);
    });
};

_H5AppCopyer.prototype._end = function() {
    //alert('_end');
    var _self = this;
    _self._callback && _self._callback();
};



/*
 * Files updater. Copy new files from internet source to cache
 */
var _H5AppUpdater = function(fs, callback){
    this._init(fs, callback)
};

_H5AppUpdater.prototype._init = function(fs, callback) {
    this._fs = fs;
    this._callback = callback;

    this._updateUrl = fs._updateUrl;

    this._counter = 0;

    this._files = fs.getConfig().files;
    this._updateloop();
};

_H5AppUpdater.prototype._updateloop = function(){
    if (typeof this._files[this._counter] != "undefined") {
        this._write(this._files[this._counter]);
    } else {
        this._end();
    }
};

_H5AppUpdater.prototype._write = function(file_path) {

    var online_path = this._updateUrl + file_path  + '?nochache=' + Date.now();// interner path
    var offline_path = "/cache/www/" + file_path;//Local path
    //alert(offline_path);
    //alert(online_path);
    var _self = this;
    var c = function(){
        _self._fs.getSystem().root.getDirectory(_self._fs.getCacheName()+ '/www', {
            create: true
        }, function(entry) {
            _self._realWrite(online_path, entry.toURL()  + file_path, function(err){
                if (!err){
                    _self._counter++;
                    _self._updateloop();
                } else {
                    _self._end(err);
                }
            });
        }, function(err){
            //alert("cache file not found!");
            _self._end(err);
        })
    };

    _self._fs.getSystem().root.getFile(offline_path, {create:false}, function(file) {
        file.remove(function() { //remove file if exist
                c();
            },
            function(err){
                _self._end(err);
            });
    }, function() {
        c();
    });
};

_H5AppUpdater.prototype._realWrite = function(online_path, local_path, callback) {
    //alert('real write ' + local_path);
    var _self = this;
    var filetransfer = new FileTransfer();
    filetransfer.download(online_path, local_path, function(c) { //Download file
        callback && callback();
    }, function(err){
        //alert('real write error ' + err.code);
        callback && callback(err);
    })
};

_H5AppUpdater.prototype._end = function(err) {
    //alert('end');
    if (!err) {
        this._fs.getSystem().root.getFile(this._fs.getCacheName()+ '/www/config.json', {create: false}, function(fileEntry) {
            fileEntry.createWriter(function (writer) {
                writer.onwriteend = function(evt) {
                    //alert(evt);
                    this._callback && this._callback();
                }.bind(this);
                writer.write(JSON.stringify(this._fs.getConfig()));
            }.bind(this), function(err){
                this._callback && this._callback(err);
            }.bind(this));

        }.bind(this), function(err) {
            //alert('error open config file');
            this._callback && this._callback(err);
        }.bind(this));
    } else {
        this._callback && this._callback(err);
    }
};
