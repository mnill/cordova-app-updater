/*
* The MIT License (MIT)

* Copyright (c) [year] [fullname]

* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:

* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.

* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
 
var H5AppFS = function (system, props){

    // 文件系统对象
    this._system = null;

    this._appName = props.app_name;
    this._cacheName = props.cache_name;

    // 文件路径
    this._path = {
        root: '',
        www: '',
        cache: ''
    }

    this._init(system)
}

// 初始化
H5AppFS.prototype._init = function(system){
    this._system = system;

    this._path.root = system.root.fullPath;
    this._path.www = system.root.fullPath + '/../' + this._appName + '/www';
    this._path.cache = system.root.fullPath + '/' + this._cacheName;
}

// 复制新的游戏文件到缓存区
H5AppFS.prototype.copyFileToCache = function(files, callback){
    new _H5AppCopyer(this, files, callback)
}

// 更新缓存区的文件
H5AppFS.prototype.updateFileToCache = function(update_url, download_url, update_config, callback){
    new _H5AppUpdater(this, update_url, download_url, update_config, callback)
}

// 清空缓存区的所有文件
H5AppFS.prototype.cleanCache = function(callback){
    this.checkCache(function(B) {
        B.removeRecursively(function() {
            console.log('cache file removed success!')
            callback && callback()
        }, function() {
            console.log('cache file removed fail!')
            callback && callback()
        })
    }, function() {
        callback && callback()
    })
}

H5AppFS.prototype.checkCache = function(callback1, callback2){
    this._system.root.getDirectory(this._cacheName, {
        create: false
    }, function(B) {
        console.log('cache file exist!')
        callback1 && callback1(B)
    }, function(err) {
        console.log('cache file not found!(clear)')
        callback2 && callback2(err)
    })
}

H5AppFS.prototype.getSystem = function(){
    return this._system
}

H5AppFS.prototype.getPath = function(key){
    return this._path[key]
}

H5AppFS.prototype.getCacheName = function(){
    return this._cacheName
}

// 替换css文件中plugin图片的路径
H5AppFS.prototype.intCss = function(cssPath, callback) {
    var _self = this;
    _self._system.root.getFile(cssPath, {
        create: true
    }, function(fileEntry) {
        fileEntry.file(function(a) {
            var Z = new FileReader();
            Z.onloadend = function(b) {
                var c = b.target.result.replace(/..\/plugin\//g, _self.getPath('cache') + '/static/plugin/');
                c = c.replace(/..\/img\//g, _self.getPath('www') + '/static/img/');
                fileEntry.remove(function() {
                    Y(c)
                })
            };
            Z.readAsText(a)
        }, error);
    }, error)

    function Y(Z) {
        _self._system.root.getFile(cssPath, {
            create: true
        }, function(a) {
            a.createWriter(function(b) {
                b.onwrite = function() {};
                b.seek(b.length);
                b.write(Z);
                callback()
            })
        }, error)
    }

    function error(e) {
        console.log('intcss error! err:' + e.code)
    }
}








/*
 * 用于复制文件
 */
var _H5AppCopyer = function(fs, files, callback){

    this._init(fs, files, callback)
}

_H5AppCopyer.prototype._init = function(fs, files, callback){
    this._fs = fs;
    this._files = files;
    this._callback = callback;

    this._counter = 0;

    var _self = this;
    _self._tryCreateCacheFile(function(){
        _self._copyloop();
    })
}

// 如果没有则首先生成缓存文件夹
_H5AppCopyer.prototype._tryCreateCacheFile = function(callback){
    var _self = this;

    _self._fs.getSystem().root.getDirectory(_self._fs.getPath('cache'), {
        create: true
    }, function() {
        callback && callback()
    }, function(err) {
        alert('create cache file fail! err:' + err.code);
    })
}

_H5AppCopyer.prototype._copyloop = function(){
    var _self = this;

    if (typeof _self._files[_self._counter] != "undefined") {
        //执行当前复制
        msgDom.html('拷贝文件:' + (_self._counter + 1) + '/' + _self._files.length);
        _self._fs.getSystem().root.getDirectory(_self._fs.getPath('www') + '/' + _self._files[_self._counter], null, function(entry) {
            _self._copy(entry, function(){
                _self._counter++;
                _self._copyloop()
            })   
        }, function(err) {// 此处不中断
            console.log('The copied file is not found! err:' + err.code)
            _self._counter++;
            _self._copyloop()
        });
    } else {
        _self._end();// 复制完成
    }
}

_H5AppCopyer.prototype._copy = function(entry, callback){

    var oldName = entry.fullPath.substring(entry.fullPath.lastIndexOf('/') + 1);

    this._fs.getSystem().root.getDirectory(this._fs.getPath('cache') + '/' + 'static', {// @TODO static不应写死
        create: true
    }, function(newEntry) {

        entry.copyTo(newEntry, oldName, function() {
            callback && callback();
        }, function(err) {
            alert('copy file fail! err:' + err.code)
        });

    })
}

_H5AppCopyer.prototype._end = function(){

    var _self = this;

    _self._fs.intCss(_self._fs.getPath('cache') + '/static/css/game.css', function() {
        _self._callback && _self._callback()
    })
}








/*
 * 用于更新文件
 */
var _H5AppUpdater = function(fs, update_url, download_url, update_config, callback){
    this._refresh = false;// 更新完是否刷新页面

    this._init(fs, update_url, download_url, update_config, callback)
}

_H5AppUpdater.prototype._init = function(fs, update_url, download_url, update_config, callback){
    this._fs = fs;
    this._callback = callback;

    this._localVer = update_config.now_version;// 文件版本号
    this._clientVer = update_config.cli_version;// 客户端版本号
    this._serVer = 0;

    this.download_url = download_url;

    this._counter = 0;

    this._checkUpdate(update_url, download_url, update_config);
}

_H5AppUpdater.prototype._checkUpdate = function(update_url, download_url, update_config){
    var _self = this;

    var c = {
        url: update_url,
        data: update_config,
        dataType: 'json',
        type: 'get',
        timeout: 20000,
        success: function(result) {
            if (result.return_flag == 1) {

                _self.serVer = result.now_version_num;

                if (parseInt(_self.serVer) == parseInt(this._localVer) || result.now_list.length == 0) {//不需要更新

                    console.log('no need update!');
                    _self._end();

                } else {//执行更新

                    console.log('need update!');
                    _self._allFiles = result.cli_list;
                    _self._files = result.now_list;
                    _self._updateloop();

                }

            } else if (result.return_flag == 2) {// 版本号一致
                _self.serVer = this._localVer;
                console.log('no need update!');
                _self._end();

            } else if (result.return_flag == 3) {// 尝试更新所有客户端版本以后的文件

                console.log('force update！');
                _self._allFiles = result.cli_list;
                _self._files = result.cli_list;
                _self._updateloop();

            } else {
                console.log('检查更新请求失败！(1)')
            }
        },
        error: function(err) {
            alert('检查更新请求失败！(2)')
        }
    }
    $.ajax(c)
}

_H5AppUpdater.prototype._updateloop = function(){
    if (typeof this._files[this._counter] != "undefined") {
        msgDom.html('更新文件:' + (this._counter + 1) + '/' + this._files.length);
        this._write(this._files[this._counter]['file_name'])
    } else {
        this._end()
    }
}

_H5AppUpdater.prototype._write = function(file_path) {
    
    var online_path = this.download_url + file_path;// 线上地址
    var offline_path = this._fs.getCacheName() + "/" + file_path;// 本地路径

    var _self = this;

    var c = function(){
        _self._fs.getSystem().root.getDirectory(_self._fs.getCacheName(), {
            create: true
        }, function(entry) {
            _self._realWrite(online_path, entry.fullPath + "/" + file_path, function(){
                _self._counter++;
                _self._updateloop();
            });
        }, function(){
            console.log("cache file not found!")
        })
    }

    _self._fs.getSystem().root.getFile(offline_path, null, function(file) {
        file.remove(function() { //检查有无此文件，如果文件存在，删除并覆盖
            c();
        })
    }, function() {
        c();
    });
}

_H5AppUpdater.prototype._realWrite = function(online_path, local_path, callback) {

    var _self = this;
    var filetransfer = new FileTransfer();

    filetransfer.download(online_path, local_path, function(c) { //下载文件

        if (local_path.indexOf("game.css") == -1) {
            callback && callback()
        } else {
            _self._fs.intCss(_self._fs.getPath('cache') + '/static/css/game.css', function(){
                callback && callback()
            })
        }

    }, function(){
        console.log("download file error!")
    })
}

_H5AppUpdater.prototype._end = function(){
    this._localVer = this._serVer;

    if (this._refresh) {
        console.log('游戏强制刷新');
        location.reload();
    }

    this._callback && this._callback(this._localVer)// 更新后的版本号作为回调参数输出
}

