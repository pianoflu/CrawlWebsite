var express = require('express');
var router = express.Router();
var crawlerjs = require('../index.js');


String.format = function() {

  var s = arguments[0];

  for (var i = 0; i < arguments.length - 1; i++) {

    var reg = new RegExp("\\{" + i + "\\}", "gm");

    s = s.replace(reg, arguments[i + 1]);

  }
  return s;
};

/* GET home page. */
router.get('/', function(req, res) {
    var crawlUrl = req.param("crawlUrl");//http://www.dianping.com/search/category/2/10/g112'
    var result=new Array();
    var num=0;
    var worlds = {
        interval: 1000,
        getSample: crawlUrl,
        get: crawlUrl,
        preview: 0,
        extractors: [
        {
            selector: '.txt',
            callback: function(err, html){
                num++;
                if(!err){
                    data = {};
                    data.name = html.children('.tit').eq(0).children('a').text();
                    data.comment =html.children('.comment').eq(0).children('a').eq(0).children('b').text();
                    data.price =html.children('.comment').eq(0).children('a').eq(1).children('b').text();
                    //data.img = html.children('.topic-figure').eq(0).children('img');

                    console.log(data);
                    result=result.concat(data);
                    if(num==html.prevObject.length){
                        //console.log(result[0]);
                        res.render('index', {result : result});

                    }
                 }else{
                    console.log(err);
                }
        }
      }
    ]
  }
    if(crawlUrl){
        crawlerjs(worlds);
    }else{
        res.render('index', {result : result});
    }

});


module.exports = router;
