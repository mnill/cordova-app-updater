
/*
 * app文件初始化系统
 * @class AppFSClass
 */
var AppFSClass = function(){
    this.files = [];//需要写入缓冲区的文件数组
    this.counter = 0; //文件计数器
    this.force = false; //是否执行强制擦除写入
    this.system = null; //本地文件系统cordova对象
    this.root_path = ''; //本地系统根路径(指向cache_path上一层)
    this.cache_path = ''; //缓存文件路径
    this.www_path = ''; //包内文件路径
    this.cache_name = '';//缓存文件名称自定义
    this.app_name = '';//包名
    this._callback = null;
}
/*
 * 初始化程序
 * @method init
 * @param [Array] files 需要复制到缓冲区的文件(不可省略)
 * @param [String] app_name 缓冲区文件名称(不可省略)
 * @param [String] cache_name 缓冲区文件名称，默认为“cache_file”
 * @param [Function] callback 初始化完成回调
 */
AppFSClass.prototype.init = function(files, app_name, cache_name, callback){
    this.files = files;
    this.app_name = app_name;
    this.cache_name = cache_name ? cache_name : 'cache_file';
    this._callback = typeof callback == 'function' ? callback : null;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (function(self) {
        return function(S){
            self.system = S;
            self.root_path = self.system.root.fullPath + '/';
            self.cache_path = self.root_path + self.cache_name + '/';
            self.www_path = self.root_path + '../' + self.app_name + "/www/";
            self._checkCacheFiles();
        }
    })(this), function() {
        alert('checkFileSys fail!');
    })
}
/*
 * 检查是否存在缓存文件
 * @method _checkCacheFiles
 */
AppFSClass.prototype._checkCacheFiles = function(){
    this.system.root.getDirectory(this.root_path + this.cache_name, null, (function(self) {
        return function(){
            if (self.force) {//强制拷贝
                console.log('force copy!'); 
                self._copyFilesToCache();
            } else {//不需要拷贝
                console.log('no need copy!');
                self._end();
            }
        }
    })(this), (function(self) {
        return function(){
            console.log('need copy!');//需要进行拷贝
            self._copyFilesToCache();
        }
    })(this));
}
/*
 * 复制游戏文件从包内到缓冲区
 * @method _copyFilesToCache
 */
AppFSClass.prototype._copyFilesToCache = function(){
    this.system.root.getDirectory(this.root_path + this.cache_name, {
        create: true
    }, (function(self) {
        return function(){
            self._copyloop();
        }
    })(this), function(err) {
        alert('create cache_file fail!' + err.code);
    })
}
/*
 * 文件复制执行单元
 * @method _copyloop
 */
AppFSClass.prototype._copyloop = function(){
    if (typeof this.files[this.counter] != "undefined") {//执行当前复制
        //msgDom.html('拷贝文件:' + (AppFS.counter + 1) + '/' + AppFS.files.length);
        this.system.root.getDirectory(this.www_path + this.files[this.counter], null, (function(self) {
            return function(entry){
                self._copy(entry)
            }
        })(this), function(err) {
            alert('get copy file fail:' + err.code)
        });
    } else {//复制完成
        this._end();
    }
}
/*
 * 真实的文件复制动作
 * @method _copy
 */
AppFSClass.prototype._copy = function(entry) {
    var oldName = entry.fullPath.substring(entry.fullPath.lastIndexOf('/') + 1);
    this.system.root.getDirectory(this.cache_path + 'static', {
        create: true
    }, function(newEntry) {
        entry.copyTo(newEntry, oldName, (function(self) {
            return function(){
                self.counter++;
                self._copyloop()//返回循环
            }
        })(this), function(err) {
            alert('copy Dir fail:' + err.code)
        });
    });
}
/*
 * 运行结束，执行回调
 * @method _end
 */
AppFSClass.prototype._end = function(){
    this.counter = 0;
    this.force = false;
    if(this._callback){
        this._callback(this)
    }
}

/*
 * app文件更新系统
 * @class AppUDClass
 */
var AppUDClass = function(){
    this.all_files = [];//客户端所有历史更新文件(用于彻底更新)
    this.files = [];//需要更新的文件
    this.counter = 0;//更新计数器
    this.refresh = false;//是否强制刷新
    this.update_url = '';//更新服务器地址
    this.download_url = '';//更新文件仓库地址
    this._callback = null;//回调
    this._appfs = null;//appfs文件系统
    this.local_version = 0;
    this.client_version = 0;
    this.server_version = 0;
}
/*
 * 初始化程序
 * @method init
 * @param [Object] appfs app文件初始化系统(不可省略)
 * @param [String] update_url 更新服务器地址(不可省略)
 * @param [String] download_url 更新文件的地址(不可省略)
 * @param [String] update_config 更新服务器参数(不可省略),例如：{
        c: 'getversion',
        m: 'compareVersion',
        cli_version: client_version,
        now_version: local_version
    }
 * @param [Function] callback 初始化完成回调
 */
AppUDClass.prototype.init = function(appfs, update_url, download_url, update_config, callback){
    //msgDom.html('检查更新信息...');
    this._appfs = appfs;
    this.update_url = update_url;
    this.download_url = download_url;
    this._config = update_config;
    this.local_version = update_config.now_version;
    this.client_version = update_config.cli_version;
    this._callback = typeof callback == 'function' ? callback : null; 
    this._checkUpdate();
}
/*
 * 检查是否需要更新
 * @method _checkUpdate
 */
AppUDClass.prototype._checkUpdate = function(){
    var self = this;
    var c = {
        url: self.update_url,
        data: self._config,
        dataType: 'json',
        type: 'get',
        timeout: 20000,
        success: function(result) {
            if (result.return_flag == 1) {
                self.server_version = result.now_version_num;
                if (parseInt(self.server_version) == parseInt(self.local_version) || result.now_list.length == 0) {//不需要更新
                    console.log('no need update!');
                    self._end();
                } else {//执行更新
                    console.log('need update!');
                    self.all_files = result.cli_list;
                    self.files = result.now_list;
                    self._updateloop();
                }
            } else if (result.return_flag == 2) {//版本号一致
                self.server_version = self.local_version;
                self._end();
            } else if (result.return_flag == 3) {//执行强制更新
                console.log('force update！');
                self.all_files = result.cli_list;
                self.files = result.cli_list;
                self._updateloop();
            } else {
                console.log('检查更新失败！(1)')
            }
        },
        error: function(err) {
            alert('检查更新失败！(2)')
        }
    }
    $.ajax(c)
}
/*
 * 更新循环
 * @method _updateloop
 */
AppUDClass.prototype._updateloop = function(){
    if (typeof this.files[this.counter] != "undefined") {
        //msgDom.html('更新文件:' + (AppUD.counter + 1) + '/' + AppUD.files.length);
        this._write(this.files[this.counter]['file_name'])
    } else {
        this._end()
    }
}
/*
 * 更新写入
 * @method _write
 */
AppUDClass.prototype._write = function(file_path) {
    this.counter++;
    var online_path = this.download_url + file_path;
    var offline_path = this._appfs.cache_name + "/" + file_path;
    var self = this;
    this._appfs.system.root.getFile(offline_path, null, function(Z) {
        Z.remove(function() { //检查有无此文件,如果文件存在，删除并覆盖
            self._appfs.system.root.getDirectory(self._appfs.cache_name, {
                create: true
            }, function(entry) {
                self._realWrite(online_url, entry.fullPath + "/" + file_path);
            }, function(){
                console.log("AppUD error!")
            })
        })
    }, function() {
        self._appfs.system.root.getDirectory(self._appfs.cache_name, {
            create: true
        }, function(entry) {
            self._realWrite(online_url, entry.fullPath + "/" + file_path);
        }, function(){
            console.log("AppUD error!")
        })
    });
}
/*
 * 更新写入(动作)
 * @method _realWrite
 */
AppUDClass.prototype._realWrite = function(online_path, local_path) {
    var filetransfer = new FileTransfer();
    filetransfer.download(online_path, local_path, (function(self) { //下载文件
        return function(c){
            //if (local_path.indexOf("game.css") == -1) {//如果不是css文件
            if (local_path.indexOf("config.js")) {//需要强制刷新
                self.refresh = true
            }
            self._updateloop()
            //} else {//如果是css文件
            //    intCss(local_path, self._updateloop)
            //}
        }
    })(this), function(){
        console.log("AppUD error!")
    })
}
/*
 * 运行结束，执行回调
 * @method _end
 */
AppUDClass.prototype._end = function(){
    this.local_version = this.server_version;
    localStorage[s_prefix + 'v' + client_version] = this.local_version;
    local_varsion = this.local_version;
    if (this.refresh) {
        console.log('游戏强制刷新');
        location.reload();
        return false
    }
    this.counter = 0;
    this.refresh = false;
    if(this._callback){
        this._callback(this)
    }
}

//重写并修改css文件中的图片路径，完成更新之后必须对css文件执行此方法
function intCss(appFileSystem, cssPath, callback) {
    appFileSystem.root.getFile(cssPath, {
        create: true
    }, function(fileEntry) {
        fileEntry.file(function(a) {
            var Z = new FileReader();
            Z.onloadend = function(b) {
                var c = b.target.result.replace(/..\/plugin\//g, pluginImgUrl);
                c = c.replace(/..\/img\//g, imgUrl);
                fileEntry.remove(function() {
                    Y(c)
                })
            };
            Z.readAsText(a)
        }, error);
    }, error)

    function Y(Z) {
        appFileSystem.root.getFile(cssPath, {
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
        console.log('intcss error::' + e.code)
    }
}