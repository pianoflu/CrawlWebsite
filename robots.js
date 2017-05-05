/**
 * @desc ��ҳ���� ץȡĳ��վ��
 *
 * @todolist
 * URL���кܴ�ʱ����
 * 302��ת
 * ����COOKIE
 * iconv-lite�������
 * ���ļ�ż���쳣�˳�
 *
 * @author WadeYu
 * @date 2015-05-28
 * @copyright by WadeYu
 * @version 0.0.1
 */

/**
 * @desc ������ģ��
 */
var fs = require("fs");
var http = require("http");
var https = require("https");
var urlUtil = require("url");
var pathUtil = require("path");

/**
 * @desc URL������
 */
var Url = function(){};

/**
 * @desc ���������ʵ�ַ����������URL ���غϷ�������URL��ַ
 *
 * @param string url ���ʵ�ַ
 * @param string url2 �����ʵ�ַ����������URL
 *
 * @return string || boolean
 */
Url.prototype.fix = function(url,url2){
    if(!url || !url2){
        return false;
    }
    var oUrl = urlUtil.parse(url);
    if(!oUrl["protocol"] || !oUrl["host"] || !oUrl["pathname"]){//��Ч�ķ��ʵ�ַ
        return false;
    }
    if(url2.substring(0,2) === "//"){
        url2 = oUrl["protocol"]+url2;
    }
    var oUrl2 = urlUtil.parse(url2);
    if(oUrl2["host"]){
        if(oUrl2["hash"]){
            delete oUrl2["hash"];
        }
        return urlUtil.format(oUrl2);
    }
    var pathname = oUrl["pathname"];
    if(pathname.indexOf('/') > -1){
        pathname = pathname.substring(0,pathname.lastIndexOf('/'));
    }
    if(url2.charAt(0) === '/'){
        pathname = '';
    }
    url2 = pathUtil.normalize(url2); //���� ./ �� ../
    url2 = url2.replace(/\\/g,'/');
    while(url2.indexOf("../") > -1){ //������../��ͷ��·��
        pathname = pathUtil.dirname(pathname);
        url2 = url2.substring(3);
    }
    if(url2.indexOf('#') > -1){
        url2 = url2.substring(0,url2.lastIndexOf('#'));
    } else if(url2.indexOf('?') >-1){
        url2 = url2.substring(0,url2.lastIndexOf('?'));
    }
    var oTmp = {
        "protocol": oUrl["protocol"],
        "host": oUrl["host"],
        "pathname": pathname + '/' + url2
    };
    return urlUtil.format(oTmp);
};

/**
 * @desc �ж��Ƿ��ǺϷ���URL��ַһ����
 *
 * @param string urlPart
 *
 * @return boolean
 */
Url.prototype.isValidPart = function(urlPart){
    if(!urlPart){
        return false;
    }
    if(urlPart.indexOf("javascript") > -1){
        return false;
    }
    if(urlPart.indexOf("mailto") > -1){
        return false;
    }
    if(urlPart.charAt(0) === '#'){
        return false;
    }
    if(urlPart === '/'){
        return false;
    }
    if(urlPart.substring(0,4) === "data"){//base64����ͼƬ
        return false;
    }
    return true;
};

/**
 * @desc ��ȡURL��ַ ·������ �����������Լ�QUERYSTRING
 *
 * @param string url
 *
 * @return string
 */
Url.prototype.getUrlPath = function(url){
    if(!url){
        return '';
    }
    var oUrl = urlUtil.parse(url);
    if(oUrl["pathname"] && (/\/$/).test(oUrl["pathname"])){
        oUrl["pathname"] += "index.html";
    }
    if(oUrl["pathname"]){
        return oUrl["pathname"].replace(/^\/+/,'');
    }
    return '';
};


/**
 * @desc �ļ����ݲ�����
 */
var File = function(obj){
    var obj = obj || {};
    this.saveDir = obj["saveDir"] ? obj["saveDir"] : ''; //�ļ�����Ŀ¼
};

/**
 * @desc ���ݴ��ļ�
 *
 * @param string filename �ļ���
 * @param mixed content ����
 * @param string charset ���ݱ���
 * @param Function cb �첽�ص�����
 * @param boolean bAppend
 *
 * @return boolean
 */
File.prototype.save = function(filename,content,charset,cb,bAppend){
    if(!content || !filename){
        return false;
    }
    var filename = this.fixFileName(filename);
    if(typeof cb !== "function"){
        var cb = function(err){
            if(err){
                console.log("���ݱ���ʧ�� FILE:"+filename);
            }
        };
    }
    var sSaveDir = pathUtil.dirname(filename);
    var self = this;
    var cbFs = function(){
        var buffer = new Buffer(content,charset ? charset : "utf8");
        fs.open(filename, bAppend ? 'a' : 'w', 0666, function(err,fd){
            if (err){
                cb(err);
                return ;
            }
            var cb2 = function(err){
                cb(err);
                fs.close(fd);
            };
            fs.write(fd,buffer,0,buffer.length,0,cb2);
        });
    };
    fs.exists(sSaveDir,function(exists){
        if(!exists){
            self.mkdir(sSaveDir,"0666",function(){
                cbFs();
            });
        } else {
            cbFs();
        }
    });
};

/**
 * @desc ���������ļ�·��
 *
 * @param string filename �ļ���
 *
 * @return string ���������ı���·�� �����ļ���
 */
File.prototype.fixFileName = function(filename){
    if(pathUtil.isAbsolute(filename)){
        return filename;
    }
    if(this.saveDir){
        this.saveDir = this.saveDir.replace(/[\\/]$/,pathUtil.sep);
    }
    return this.saveDir + pathUtil.sep + filename;
};

/**
 * @�ݹ鴴��Ŀ¼
 *
 * @param string Ŀ¼·��
 * @param mode Ȩ������
 * @param function �ص�����
 * @param string ��Ŀ¼·��
 *
 * @return void
 */
File.prototype.mkdir = function(sPath,mode,fn,prefix){
    sPath = sPath.replace(/\\+/g,'/');
    var aPath = sPath.split('/');
    var prefix = prefix || '';
    var sPath = prefix + aPath.shift();
    var self = this;
    var cb = function(){
        fs.mkdir(sPath,mode,function(err){
            if ( (!err) || ( ([47,-4075]).indexOf(err["errno"]) > -1 ) ){ //�����ɹ�����Ŀ¼�Ѵ���
                if (aPath.length > 0){
                    self.mkdir( aPath.join('/'),mode,fn, sPath.replace(/\/$/,'')+'/' );
                } else {
                    fn();
                }
            } else {
                console.log(err);
                console.log('����Ŀ¼:'+sPath+'ʧ��');
            }
        });
    };
    fs.exists(sPath,function(exists){
        if(!exists){
            cb();
        } else if(aPath.length > 0){
            self.mkdir(aPath.join('/'),mode,fn, sPath.replace(/\/$/,'')+'/' );
        } else{
            fn();
        }
    });
};

/**
 * @�ݹ�ɾ��Ŀ¼ ������ �첽������
 *
 * @param string Ŀ¼·��
 * @param function �ص�����
 *
 * @return void
 */
File.prototype.rmdir = function(path,fn){
    var self = this;
    fs.readdir(path,function(err,files){
        if(err){
            if(err.errno == -4052){ //����Ŀ¼
                fs.unlink(path,function(err){
                    if(!err){
                        fn(path);
                    }
                });
            }
        } else if(files.length === 0){
            fs.rmdir(path,function(err){
                if(!err){
                    fn(path);
                }
            });
        }else {
            for(var i = 0; i < files.length; i++){
                self.rmdir(path+'/'+files[i],fn);
            }
        }
    });
};

/**
 * @desc �����ڶ���
 */
var oDate = {
    time:function(){//����ʱ��� ����
        return (new Date()).getTime();
    },
    date:function(fmt){//���ض�Ӧ��ʽ����
        var oDate = new Date();
        var year = oDate.getFullYear();
        var fixZero = function(num){
            return num < 10 ? ('0'+num) : num;
        };
        var oTmp = {
            Y: year,
            y: (year+'').substring(2,4),
            m: fixZero(oDate.getMonth()+1),
            d: fixZero(oDate.getDate()),
            H: fixZero(oDate.getHours()),
            i: fixZero(oDate.getMinutes()),
            s: fixZero(oDate.getSeconds())
        };
        for(var p in oTmp){
            if(oTmp.hasOwnProperty(p)){
                fmt = fmt.replace(p,oTmp[p]);
            }
        }
        return fmt;
    }
};

/**
 * @desc δץȡ����URL����
 */
var aNewUrlQueue = [];

/**
 * @desc ��ץȡ����URL����
 */
var aGotUrlQueue = [];

/**
 * @desc ͳ��
 */
var oCnt = {
    total:0,//ץȡ����
    succ:0,//ץȡ�ɹ���
    fSucc:0//�ļ�����ɹ���
};

/**
 * �����������·���ĳ��� ����������־
 */
var sPathMaxSize = 120;

/**
 * @desc ������
 */
var Robot = function(obj){
    var obj = obj || {};
    //��������
    this.domain = obj.domain || '';
    //ץȡ��ʼ�ĵ�һ��URL
    this.firstUrl = obj.firstUrl || '';
    //Ψһ��ʶ
    this.id = this.constructor.incr();
    //������ر���·��
    this.saveDir = obj.saveDir || '';
    //�Ƿ������Թ���
    this.debug = obj.debug || false;
    //��һ��URL��ַ��δץȡ����
    if(this.firstUrl){
        aNewUrlQueue.push(this.firstUrl);
    }
    //��������
    this.oUrl = new Url();
    this.oFile = new File({saveDir:this.saveDir});
};

/**
 * @desc ������˽�з���---����Ψһ������
 *
 * @return int
 */
Robot.id = 1;
Robot.incr = function(){
    return this.id++;
};

/**
 * @desc ���濪ʼץȡ
 *
 * @return boolean
 */
Robot.prototype.crawl = function(){
    if(aNewUrlQueue.length > 0){
        var url = aNewUrlQueue.pop();
        this.sendReq(url);
        oCnt.total++;
        aGotUrlQueue.push(url);
    } else {
        if(this.debug){
            console.log("ץȡ����");
            console.log(oCnt);
        }
    }
    return true;
};

/**
 * @desc ����HTTP����
 *
 * @param string url URL��ַ
 *
 * @return boolean
 */
Robot.prototype.sendReq = function(url){
    var req = '';
    if(url.indexOf("https") > -1){
        req = https.request(url);
    } else {
        req = http.request(url);
    }
    var self = this;
    req.on('response',function(res){
        var aType = self.getResourceType(res.headers["content-type"]);
        var data = '';
        if(aType[2] !== "binary"){
            //res.setEncoding(aType[2] ? aType[2] : "utf8");//��֧�ֵ����ñ���ᱨ��
        } else {
            res.setEncoding("binary");
        }
        res.on('data',function(chunk){
            data += chunk;
        });
        res.on('end',function(){ //��ȡ���ݽ���
            self.debug && console.log("ץȡURL:"+url+"�ɹ�\n");
            self.handlerSuccess(data,aType,url);
            data = null;
        });
        res.on('error',function(){
            self.handlerFailure();
            self.debug && console.log("����������Ӧʧ��URL:"+url+"\n");
        });
    }).on('error',function(err){
        self.handlerFailure();
        self.debug && console.log("ץȡURL:"+url+"ʧ��\n");
    }).on('finish',function(){//����END����֮�󴥷�
        self.debug && console.log("��ʼץȡURL:"+url+"\n");
    });
    req.end();//��������
};

/**
 * @desc ��ȡHTML�������URL
 *
 * @param string html HTML�ı�
 *
 * @return []
 */
Robot.prototype.parseUrl = function(html){
    if(!html){
        return [];
    }
    var a = [];
    var aRegex = [
        /<a.*?href=['"]([^"']*)['"][^>]*>/gmi,
        /<script.*?src=['"]([^"']*)['"][^>]*>/gmi,
        /<link.*?href=['"]([^"']*)['"][^>]*>/gmi,
        /<img.*?src=['"]([^"']*)['"][^>]*>/gmi,
        /url\s*\([\\'"]*([^\(\)]+)[\\'"]*\)/gmi, //CSS����
    ];
    html = html.replace(/[\n\r\t]/gm,'');
    for(var i = 0; i < aRegex.length; i++){
        do{
            var aRet = aRegex[i].exec(html);
            if(aRet){
                this.debug && this.oFile.save("_log/aParseUrl.log",aRet.join("\n")+"\n\n","utf8",function(){},true);
                a.push(aRet[1].trim().replace(/^\/+/,'')); //ɾ��/�Ƿ���������
            }
        }while(aRet);
    }
    return a;
};

/**
 * @desc �ж�������Դ����
 *
 * @param string  Content-Typeͷ����
 *
 * @return [�����,С����,��������] ["image","png","utf8"]
 */
Robot.prototype.getResourceType = function(type){
    if(!type){
        return '';
    }
    var aType = type.split('/');
    aType.forEach(function(s,i,a){
        a[i] = s.toLowerCase();
    });
    if(aType[1] && (aType[1].indexOf(';') > -1)){
        var aTmp = aType[1].split(';');
        aType[1] = aTmp[0];
        for(var i = 1; i < aTmp.length; i++){
            if(aTmp[i] && (aTmp[i].indexOf("charset") > -1)){
                aTmp2 = aTmp[i].split('=');
                aType[2] = aTmp2[1] ? aTmp2[1].replace(/^\s+|\s+$/,'').replace('-','').toLowerCase() : '';
            }
        }
    }
    if((["image"]).indexOf(aType[0]) > -1){
        aType[2] = "binary";
    }
    return aType;
};

/**
 * @desc ץȡҳ�����ݳɹ����õĻص�����
 *
 * @param string str ץȡ������
 * @param [] aType ץȡ��������
 * @param string url �����URL��ַ
 *
 * @return void
 */
Robot.prototype.handlerSuccess = function(str,aType,url){
    if((aType[0] === "text") && ((["css","html"]).indexOf(aType[1]) > -1)){ //��ȡURL��ַ
        aUrls = (url.indexOf(this.domain) > -1) ? this.parseUrl(str) : []; //��վ��ֻץȡһ��
        for(var i = 0; i < aUrls.length; i++){
            if(!this.oUrl.isValidPart(aUrls[i])){
                this.debug && this.oFile.save("_log/aInvalidRawUrl.log",url+"----"+aUrls[i]+"\n","utf8",function(){},true);
                continue;
            }
            var sUrl = this.oUrl.fix(url,aUrls[i]);
            /*if(sUrl.indexOf(this.domain) === -1){ //ֻץȡվ���ڵ� �����жϻ���˵���̬��Դ
             continue;
             }*/
            if(aNewUrlQueue.indexOf(sUrl) > -1){
                continue;
            }
            if(aGotUrlQueue.indexOf(sUrl) > -1){
                continue;
            }
            aNewUrlQueue.push(sUrl);
        }
    }
    //���ݴ��ļ�
    var sPath = this.oUrl.getUrlPath(url);
    var self = this;
    var oTmp = urlUtil.parse(url);
    if(oTmp["hostname"]){//·���������� ��ֹ�ļ�����ʱ���ļ�����ͬ������
        sPath = sPath.replace(/^\/+/,'');
        sPath = oTmp["hostname"]+pathUtil.sep+sPath;
    }
    if(sPath){
        if(this.debug){
            this.oFile.save("_log/urlFileSave.log",url+"--------"+sPath+"\n","utf8",function(){},true);
        }
        if(sPath.length > sPathMaxSize){ //�����������·�� ������־
            this.oFile.save("_log/sPathMaxSizeOverLoad.log",url+"--------"+sPath+"\n","utf8",function(){},true);
            return ;
        }
        if(aType[2] != "binary"){//ֻ֧��UTF8����
            aType[2] = "utf8";
        }
        this.oFile.save(sPath,str,aType[2] ? aType[2] : "utf8",function(err){
            if(err){
                self.debug && console.log("Path:"+sPath+"���ļ�ʧ��");
            } else {
                oCnt.fSucc++;
            }
        });
    }
    oCnt.succ++;
    this.crawl();//����ץȡ
};

/**
 * @desc ץȡҳ��ʧ�ܵ��õĻص�����
 *
 * @return void
 */
Robot.prototype.handlerFailure = function(){
    this.crawl();
};

/**
 * @desc �ⲿ����
 */
module.exports = Robot;

