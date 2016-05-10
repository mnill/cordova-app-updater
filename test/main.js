var assert = require('assert');
var fs = require('fs');
var path = require('path');
var static = require('node-static');
var file = new static.Server(path.resolve(__dirname, '../test_data/data/'));

describe('tests', function() {
    var AppUpdater = require('../www/updater');
    var AppSettings = {
        updaterurl: '',
        updaterpolicy: '', //'mustupdate', 'tryupdate', 'cached'
        updaterredirect: 'index.html',
        updaterhidesplashscreen: 'true' //'true', 'false'
    };
    var onAlert = null;

    before(function () {
        return new Promise(function (res, rej) {
            require('http').createServer(function (request, response) {
                file.serve(request, response);
            }).listen(8888);
            createGlobalWrappers();
            wipeTempFolder();
            res();
        })
    });

    describe('cordova-app-updater', function () {
        it('#update mustupdate-once', function () {
            wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/mustupdate-success/',
                updaterpolicy: 'mustupdate', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                AppUpdater.update(true);
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(window.location.href, path.resolve(__dirname, '../.tmp/cache/www/index.html'));
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update mustupdate-retry', function () {
            wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/mustupdate-fail/',
                updaterpolicy: 'mustupdate', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                var failCounter = 0;
                AppUpdater.update(true);
                onAlert = function (message, callback) {
                    failCounter++;
                    assert.equal(message, 'Network error');
                    if (failCounter  == 2) {
                        AppSettings.updaterurl = 'http://localhost:8888/mustupdate-success/';
                    } else if (failCounter > 2) {
                        throw new Error('ureacheable');
                    }
                    callback();
                };
                setTimeout(function () {
                    assert.equal(window.location.href, path.resolve(__dirname, '../.tmp/cache/www/index.html'));
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update try-update', function () {
            wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/mustupdate-fail/',
                updaterpolicy: 'tryupdate', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                AppUpdater.update(true);
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(window.location.href, path.resolve(__dirname, '../test_data/application/www/index.html'));
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update try-update-success', function () {
            wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/mustupdate-success/',
                updaterpolicy: 'tryupdate', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                AppUpdater.update(true);
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(window.location.href, path.resolve(__dirname, '../.tmp/cache/www/index.html'));
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update try-update-fail-after-success', function () {
            // wipeTempFolder();

            window.location.href = null;
            AppSettings = {
                updaterurl: 'http://localhost:8888/mustupdate-fail/',
                updaterpolicy: 'tryupdate', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                AppUpdater.update(true);
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(window.location.href, path.resolve(__dirname, '../.tmp/cache/www/index.html'));
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update try-update-no-config-after-success', function () {
            // wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/no-config/',
                updaterpolicy: 'tryupdate', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                AppUpdater.update(true);
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(window.location.href, path.resolve(__dirname, '../.tmp/cache/www/index.html'));
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update cached-no-config-after-success', function () {
            // wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/no-config/',
                updaterpolicy: 'cached', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                AppUpdater.update(true);
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(window.location.href, path.resolve(__dirname, '../.tmp/cache/www/index.html'));
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update cached-wiped', function () {
            wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/no-config/',
                updaterpolicy: 'cached', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                AppUpdater.update(true);
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(window.location.href, path.resolve(__dirname, '../test_data/application/www/index.html'));
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update background-success', function () {
            wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/mustupdate-success/',
                updaterpolicy: 'cached', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                var callbackCalled = false;
                AppUpdater.update(false, function (error) {
                    callbackCalled = true;
                    assert.equal(error, undefined);
                });
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(callbackCalled, true);
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update background-fail', function () {
            // wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/mustupdate-fail/',
                updaterpolicy: 'tryupdate', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                var callbackCalled = false;
                AppUpdater.update(false, function (error) {
                    callbackCalled = true;
                    assert.equal(error, 'Network error');
                });
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(callbackCalled, true);
                    res();
                }, 500);
            });
        }).timeout(5000);

        it('#update background-fail-config', function () {
            // wipeTempFolder();
            window.location.href = null;

            AppSettings = {
                updaterurl: 'http://localhost:8888/no-config/',
                updaterpolicy: 'tryupdate', //'mustupdate', 'tryupdate', 'cached'
                updaterredirect: 'index.html',
                updaterhidesplashscreen: 'true' //'true', 'false'
            };

            return new Promise(function (res, rej) {
                var callbackCalled = false;
                AppUpdater.update(false, function (error) {
                    callbackCalled = true;
                    assert.equal(error, 'Network error');
                });
                onAlert = function (message, callback) {
                    throw new Error('ureacheable');
                };
                setTimeout(function () {
                    assert.equal(callbackCalled, true);
                    res();
                }, 500);
            });
        }).timeout(5000);
    });

    function createGlobalWrappers() {

        GLOBAL.AppSettings = {
            get: function (success, fail) {
                success(AppSettings);
            }
        };

        GLOBAL.LocalFileSystem = {
            PERSISTENT: 'PERSISTENT'
        };

        GLOBAL.window = {
            requestFileSystem: function (type, size, success, fail) {
                assert.equal(type, LocalFileSystem.PERSISTENT, 'expect type == LocalFileSystem.PERSISTENT');
                success(new CordovaFileSystemWrapper(path.resolve(__dirname, '../.tmp/')));
            },
            resolveLocalFileSystemURI: function (path, success, fail) {
                try {
                    var entry = new DirectoryEntry(path, {create:false});
                    setTimeout(function () {
                        success(entry);
                    }, 1);
                } catch (e){
                    fail(e)
                }
            },
            location: {
                href: ''
            }
        };

        //Create temp directory
        GLOBAL.cordova = {
            file: {
                applicationDirectory: path.resolve(__dirname, '../test_data/application/')
            }
        };

        GLOBAL.navigator = {
            notification: {
                alert: function (title, callback, message, buttonText) {
                    onAlert && onAlert(message, callback);
                }
            }
        };

        GLOBAL.FileReader = FileReader;

        GLOBAL.FileTransfer = FileTransfer;

        GLOBAL.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    }
});

function CordovaFileSystemWrapper(path) {
    this.path = path;
    this.root = new DirectoryEntry(path, {create:false})

}

function DirectoryEntry(path, options) {
    this.path = path;
    var exist = false;
    try {
        var stats = fs.lstatSync(path);
        if (stats.isDirectory()) {
            exist = true;
        } else {
            throw new Error('Not a directory', 'NOTDIR');
        }
    } catch (e) {
        if (e.code == 'ENOENT' && options.create) {
            fs.mkdirSync(path);
            exist = true;
        } else {
            throw e;
        }
    }
}

DirectoryEntry.prototype.getDirectory = function (dirpath, options, success, fail) {
  try {
      var directoryEnrty = new DirectoryEntry(path.resolve(this.path, dirpath), options);
      setTimeout(function () {
          success(directoryEnrty);
      }, 1);
  } catch (e) {
      fail(e)
  }
};

DirectoryEntry.prototype.copyTo = function (targetEntry, name, success, fail) {
    try {
        copyFolderRecursiveSync(this.path, path.resolve(targetEntry.path, name));
        setTimeout(success, 1)
    } catch (e){
        fail(e);
    }
};

DirectoryEntry.prototype.getFile = function (filePath, options, success, fail) {
    try {
        var fileEntry = new FileEntry(path.resolve(this.path, filePath), options);
        setTimeout(function () {
            success(fileEntry);
        }, 1);
    } catch (e) {
        fail(e)
    }
};

DirectoryEntry.prototype.toURL = function () {
    return this.path + '/';
};

DirectoryEntry.prototype.removeRecursively = function (success, fail) {
    try {
        clearFolderRecurs(this.path);
        setTimeout(success, 1);
    } catch (e) {
        fail(e);
    }
};

DirectoryEntry.prototype.moveTo = function (toEntry, name, success, fail) {
    try {
        fs.renameSync(this.path, path.resolve(toEntry.path, name));
        setTimeout(success,1);
    }
    catch (e){
        fail(e);
    }
};

function FileEntry(path, options) {
    this.path = path;
    var exist = false;
    try {
        var stats = fs.lstatSync(path);
        if (stats.isDirectory()) {
            throw new Error('Not a file', 'ISDIR');
        } else {
            exist = true;
        }
    } catch (e) {
        if (e.code == 'ENOENT' && options.create) {
            fs.closeSync(fs.openSync(path, 'w'));
            exist = true;
        } else {
            throw e;
        }
    }
}

FileEntry.prototype.file = function (success, fail) {
    success(this.path);
};

FileEntry.prototype.remove = function (success, fail) {
    try {
        fs.unlinkSync(this.path);
        setTimeout(function () {
            success();
        }, 1);
    } catch (e) {
        fail(e);
    }
};

FileEntry.prototype.createWriter = function (success, fail) {
    try {
        var writer = new FileWriter(this.path);
        setTimeout(function () {
            success(writer);
        }, 1);
    } catch (e) {
        fail(e);
    }
};

function FileWriter(path) {
    this.onwriteend = null;
    this.descriptor =  fs.openSync(path, 'w');
}

FileWriter.prototype.write = function (text) {
    var buffer = new Buffer(text);
    fs.write(this.descriptor, buffer, 0, buffer.length, null, function(err) {
        if (err)
            throw 'error writing file: ' + err;
        fs.close(this.descriptor, function() {
            this.onwriteend && this.onwriteend();
        }.bind(this))
    }.bind(this));

};

function FileReader() {
    this.onloadend = null;
}

FileReader.prototype.readAsText = function (path) {
    var content = fs.readFileSync(path, 'utf8');
    this.onloadend && this.onloadend({target:{result:content}});
};

function FileTransfer() {
    
}

FileTransfer.prototype.download = function (url, localPath, success, fail) {
    var http = require('http');
    var fs = require('fs');

    var file = fs.createWriteStream(localPath);
    var request = http.get(url, function(response) {
        if (response.statusCode == '200') {
            response.pipe(file);
            response.on('end', function () {
                file.close();
                success();
            });
        } else {
            file.close();
            fail(new Error('Not found'));
        }
    }).on('error', function(e) {
        file.close();
        fail(e);
    });
};

function wipeTempFolder() {
    var tempPath = path.resolve(__dirname, '../.tmp/');
    try {fs.mkdirSync(tempPath)} catch(e) {if ( e.code != 'EEXIST' ) throw e;}
    clearFolderRecurs(tempPath);
}

function clearFolderRecurs(path, notTop) {
    fs.readdirSync(path).forEach(function(file, index){
        var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
            clearFolderRecurs(curPath, true);
        } else {
            fs.unlinkSync(curPath);
        }
    });
    if (notTop)
        fs.rmdirSync(path);
}

function copyFileSync( source, target ) {
    var targetFile = target;
    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
    var files = [];

    //check if folder needs to be created or integrated
    var targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    //copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, target );
            } else {
                copyFileSync( curSource, target );
            }
        } );
    }
}