var debug = false;

function AppUpdater() { }

AppUpdater.prototype.update = function(isForeground, callback) {
    getAppSettings(function (err, settings) {
        if (err) {
            if (isForeground)
                navigator.notification.alert('Error', function(){}, err, 'Ok');
            else
                callback && callback(err);
        } else {
            getFileSystem(function (err, fs) {
                if (err) {
                    if (isForeground)
                        navigator.notification.alert('Error', function(){}, err, 'Ok');
                    else
                        callback && callback(err);
                } else {
                    if (isForeground && settings.updaterhidesplashscreen)
                        navigator && navigator.splashscreen && navigator.splashscreen.hide();

                    function updateResult(err, result) {
                        if (err && isForeground && settings.updaterpolicy == 'mustupdate')
                            navigator.notification.alert('Error', function(){App.update(updateResult)}, err, 'Retry');
                        else if (isForeground)
                            App.redirect();
                        else
                            callback && callback(err, result);
                    }

                    var App = new H5AppFS(fs, settings);
                    if (isForeground && settings.updaterpolicy == 'cached')
                        App.redirect();
                    else
                        App.update(updateResult)
                }
            })
        }
    })
};

AppUpdater.prototype.updateBackground = function(callback) {
    this.update(false, callback);
};

function getFileSystem(callback) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
    function fail(error) {
        if (debug)
            console.log('fail to get filesystem', error);
        callback(error);
    }
    function gotFS (fileSystem) {
        callback(false, fileSystem)
    }
}

function getAppSettings(callback) {
    AppSettings.get(
        function(value) {
            if (!('updaterurl' in value)) {
                if (debug)
                    console.log('fail to find UpdaterUrl url in config.xml');
                callback('Can\'t find server url.');
            } else {
                if (!('updaterpolicy' in value) || ['mustupdate', 'tryupdate', 'cached'].indexOf(value.updaterpolicy) == -1)
                    value.updaterpolicy = 'mustupdate';

                if (!('updaterredirect' in value))
                    value.updaterredirect = 'index.html';

                value.updaterhidesplashscreen = !('updaterhidesplashscreen' in value) || value.updaterhidesplashscreen != 'true';
                callback(false, value);
            }
        },
        function(error) {
            if (debug)
                console.log('fail to get config.xml settings', error);
            callback('Something is wrong, can\'t get app settings. Please reinstall the app.');
        }, ["updaterurl", "updaterpolicy", "updaterhidesplashscreen", "updaterredirect"]);
}

var H5AppFS = function (system, props) {
    this._system = system;

    this.props = props;

    this._config = null;
    this._cacheName = 'cache';
    this._tempCacheName = 'tempcache';

    if (this.props.updaterpolicy == 'mustupdate')
        this._tempCacheName = 'cache'; //because we anyway shall complete update loop. Not necessary to copy twice.

    this._applicationDirectory = cordova.file.applicationDirectory;
};

H5AppFS.prototype.update = function(callback) {
    var _self = this;
    this.loadConfig(function (err) {
        if (err) {
            callback(err);
        } else {
            _self.startUpdate(callback);
        }
    });
};

H5AppFS.prototype.redirect = function () {
    var _self = this;
    _self.getCachedVersion(function (err, version) {
        if (err || !version) {
            redirectToEmbeddedWww(err);
        } else {
            if (debug)
                console.log('cached config version ' + version);
            window.location.href = _self._system.root.toURL() + 'cache/www/' + _self.props.updaterredirect;
        }
    });

    function redirectToEmbeddedWww(err) {
        if (debug)
            console.log('Fail to find cached www, redirect to embedded');
        window.location.href = _self._applicationDirectory + '/www/' + _self.props.updaterredirect;
    }
};

H5AppFS.prototype.loadConfig = function(callback) {
    var _self = this;
    var request = new XMLHttpRequest();
    request.open('GET', this.props.updaterurl +'config.json'+ '?nocache=' + new Date().getTime());
    request.onreadystatechange = function(e) {
        if (this.readyState == 4) {
            if (this.status == 200) {
                try {
                    _self._config = JSON.parse(this.responseText);
                    setTimeout(callback, 1);
                } catch (e) {
                    if (debug)
                        console.log('fail to parse config.json', e);
                    callback('Something is wrong');
                }
            } else {
                if (debug)
                    console.log('network error');
                callback('Network error');
            }
        }
    };
    request.send(null);
};

H5AppFS.prototype.startUpdate = function(callback) {
    var _self = this;
    this.checkIsUpdateNecessary(function(err) {
        if (!err) {
            callback();
        } else {
            _self.clearAndUpdate(function(err) {
                if (err) {
                    if (debug)
                        console.log('Update failed', err);
                    callback('Network error');
                } else {
                    callback();
                }
            });
        }
    });
};

H5AppFS.prototype.getConfig = function(){
    return this._config;
};

H5AppFS.prototype.checkIsUpdateNecessary = function(callback) {
    var _self = this;
    _self.getCachedVersion(function (err, version) {
        callback(err || version != _self._config.version);
    })
};

H5AppFS.prototype.clearAndUpdate = function(callback){
    var _self = this;
    _self.cleanTempCache(function(err) {
        if (err) {
            callback(err);
        } else {
            _self.copyFilesToTempCache(function(err) {
                if (err) {
                    callback(err);
                } else {
                    new _H5AppUpdater(_self, function (err) {
                        if (err) {
                            if (debug)
                                console.log('download failed', err);
                            callback(err);
                        } else {
                            //Move tempCache to Cache.
                            if (_self.props.updaterpolicy != 'mustupdate')
                                _self._system.root.getDirectory(_self._tempCacheName + '/www', {
                                    create: false
                                }, function (entry) {
                                    _self._system.root.getDirectory(_self._cacheName, {create:true}, function (parentEntry) {
                                        entry.moveTo(parentEntry, 'www', function () {
                                            _self.writeConfig(callback);
                                        }, function (err) {
                                            if (debug)
                                                console.log('fail to move tempCache after update');
                                            callback(err);
                                        });
                                    }, callback);
                                }, callback);
                            else
                                _self.writeConfig(callback);
                        }
                    });
                }
            });
        }
    });
};

H5AppFS.prototype.writeConfig = function (callback) {
    var _self = this;
    if ('debug' in _self._config && _self._config.debug == true)
        callback(); //if in debug mode - do not write config, just redirect.
    else
        _self._system.root.getFile(_self._cacheName + '/www/config.json', {create: true}, function(fileEntry) {
            fileEntry.createWriter(function (writer) {
                writer.onwriteend = function(evt) {
                    callback();
                };
                writer.write(JSON.stringify(_self._config));
            }, function(err){
                callback(err);
            });
        }, callback);
};

H5AppFS.prototype.getCachedVersion = function(callback) {
    var _self = this;
    _self.getCacheEntry(function(entry) {
            entry.getFile('www/config.json', {create:false}, function(fileEntry) {
                    fileEntry.file(function(file){
                            var reader = new FileReader();
                            reader.onloadend = function(evt) {
                                try {
                                    var version = JSON.parse(evt.target.result).version;
                                    setTimeout(function () {
                                        callback(null, version);
                                    }, 1);
                                } catch(er) {
                                    callback('cached json parse fail');
                                }
                            };
                            reader.readAsText(file);
                        },
                        callback)
                },
                callback)
        },
        callback);
};

H5AppFS.prototype.copyFilesToTempCache = function(callback) {
    var _self = this;
    this._system.root.getDirectory(this._tempCacheName, {
        create: true
    }, function(entry) {
        window.resolveLocalFileSystemURI(_self._applicationDirectory + '/www', function(wwwEntry) {
            var oldName = 'www';
            wwwEntry.copyTo(entry, oldName, function() {
                //After copy files - we remove config.json. We just will write it back(latest config) after we successfully updated the cache.
                //It is necessary becouse by config.json we deside if our cache valid or not(if any error while moving folder)
                entry.getFile('www/config.json', {create:false}, function (entry) {
                    entry.remove(function () {
                        callback();
                    }, function (err) {
                        if (debug)
                            console.log('fail to remove config json after copy cache from tempory folder');
                        callback(err);
                    })
                }, function (err) {
                    if (debug)
                        console.log('fail to get config json after copy cache from tempory folder');
                    callback(err);
                });
            }, function(err) {
                if (debug)
                    console.log('fail to copy application to temp cache', err);
                callback(err);
            });
        }, function(err) {
            if (debug)
                console.log('application directory!');
            callback(err);
        });
    }, function(err) {
        if (debug)
            console.log('fail to get temp cache entry');
        callback && callback(err);
    })
};

H5AppFS.prototype.cleanTempCache = function(callback) {
    this._system.root.getDirectory(this._tempCacheName, {
        create: false
    }, function(B) {
        B.removeRecursively(function() {
            callback && callback();
        }, function(err) {
            callback && callback(err);
        })
    }, function(err) {
        //Nothing to clear, just return null.
        callback && callback(null);
    })
};

H5AppFS.prototype.getCacheEntry = function(callback1, callback2) {
    this._system.root.getDirectory(this._cacheName, {
        create: false
    }, function(B) {
        callback1 && callback1(B);
    }, function(err) {
        callback2 && callback2(err);
    })
};

H5AppFS.prototype.getSystem = function() {
    return this._system
};

H5AppFS.prototype.getCacheName = function() {
    return this._cacheName
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

    this._updateUrl = fs.props.updaterurl;
    this._counter = 0;

    this._files = fs.getConfig().files;
    this._updateloop();
};

_H5AppUpdater.prototype._updateloop = function() {
    if (typeof this._files[this._counter] != "undefined") {
        this._write(this._files[this._counter]);
    } else {
        this._callback();
    }
};

_H5AppUpdater.prototype._write = function(file_path) {
    var online_path = this._updateUrl + file_path  + '?nochache=' + Date.now();// interner path
    var offline_path = "/" + this._fs._tempCacheName + "/www/" + file_path;//Local path
    var _self = this;
    var c = function(){
        _self._fs.getSystem().root.getDirectory(_self._fs._tempCacheName+ '/www', {
            create: true
        }, function(entry) {
            _self._realWrite(online_path, entry.toURL()  + file_path, function(err){
                if (!err) {
                    _self._counter++;
                    _self._updateloop();
                } else {
                    _self._callback(err);
                }
            });
        }, _self._callback)
    };

    _self._fs.getSystem().root.getFile(offline_path, {create:false}, function(file) {
        file.remove(function() { //remove file if exist
                c();
            },
            _self._callback);
    }, function() {
        c();
    });
};

_H5AppUpdater.prototype._realWrite = function(online_path, local_path, callback) {
    var _self = this;
    var filetransfer = new FileTransfer();
    //Download file
    filetransfer.download(online_path, local_path, function(c) {
        callback && callback();
    }, function(err) {
        callback && callback(err);
    })
};

module.exports = new AppUpdater();
