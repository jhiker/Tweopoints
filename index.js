var express = require("express");
    app = express(),
    fs = require('fs'),
    sys = require('sys'),
    twitter = require('twitter'),
    sass = require('sass'),
    requirejs = require('requirejs'),
    port = 8539,
    id ="",
    //config = require('./config'),
    mongoose = require('mongoose'),
    db = mongoose.connect('mongodb://localhost/mydb'),
    //db = mongoose.connect('mongodb://nodejitsu:e25e0ebb49ab22ad6a6ca923dfa66378@dharma.mongohq.com:10048/nodejitsudb6940029473'),

Schema = mongoose.Schema;

var tweetschema = new Schema({icon: Number,
       followers: Number,
       lat: Number,
       lng: Number,
       lnk: String,
       name: String})
var mapschema = new Schema({ content: [tweetschema], terms:String });
var MapModel = mongoose.model('MapModel', mapschema);


//jade
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/scripts'));


// //requirejs
// requirejs.config({
//     baseUrl: 'scripts',
//     nodeRequire: require
// });


//routing



//twitter

var twit = new twitter({
  consumer_key: '7jwv7yRsa6EBl8NphDq3LQ',
  consumer_secret: 'fILH404rgPXwES06AOyp1FtVGQm1fvU6NVygoXvLuU',
  access_token_key: '15829179-O42nyuRC54CLOKE81DJQBLIr6zQDc8RVIv0Dp3lNs',
  access_token_secret: 'VCZIBEfJ7ANXXIwSuu4bE9OPsQbZSPN7s1DKt258'
});


// var twee = io.of('tweet');

var server = app.listen(port);
var io = require('socket.io').listen(server);
app.get("/", function(req, res){
  res.render("page");

  
});
function makesocket(field, shareurl){
      var watches=[];
      var items = field.split(',')
      items.forEach(function(p) {
        if (p=="") {watches.push(" ")}
        else {watches.push(p)}
        });
      if (watches != ""){
        twit.stream('statuses/filter', {locations: [-179.9,-90,179.9,90] }, function(stream) {
          console.log('inside ' + watches);
          stream.on('data', function (data) {
              //console.log("len "+initialdata);
              //console.log(shareurl);
              io.sockets.emit('tweet', data, shareurl);
              // console.log('.');
              // console.log(watches.length);
              // console.log(watches + ' ' + watches.length);
          });
        });
      }
    }
io.set('log level', 1);                    // reduce logging
io.sockets.on('connection', function(socket){
  socket.on('send', function(field){
    makesocket(field.topic,  "");
  });
  socket.on('addmore', function(idkey, tweesles){
    console.log(idkey);
    MapModel.findById(idkey, function (err, doc) {
      if (err) return (err);
      console.log('found!');
      tweesles.forEach(function (p){
      doc.content.push(p);
      doc.save( function(err){
          if (err) console.log(err);
          if (!err) console.log('Saved: '+tweesles+'in '+ id)
        });
    });
    });
    
  });
  socket.on('sharesend', function(markers, queries){
    //console.log(markers);
    var maptotal = new MapModel();
    markers.forEach(function (mark){
      maptotal.content.push(mark)
    });
    maptotal.terms=queries;
    maptotal.save(function (err) {
    if (!err) console.log('Success!');
    });
    var shareurl="http://tweopoints.jit.su/search?id="+maptotal._id+"&q="+queries;
    io.sockets.emit('urlshare', shareurl);
    makesocket('', "")
  });

  socket.on('remove', function(field){
    var idx = watches.indexOf(field.topic); 
    if(idx!=-1) {
      watches.splice(idx, 1);
    }
    if (watches != ""){
    twit.stream('statuses/filter', { track: watches, locations: [-125,15,-50,80] }, function(stream) {
      console.log('2nd inside ' + watches);
      stream.on('data', function (data) {
        io.sockets.emit('tweet', data, watches);
      });
    });
    } else {
      io.sockets.emit('tweet', [], []);
    }
  });

});

app.get("/search", function(req, res){
  var queries="";
  res.render("page");
  console.log('req'+req.url);
  query = require('url').parse(req.url,true).query;
  id=query.id;
  console.log(id);
  if (id.length>0){
    console.log('yes!');
    io.sockets.on('connection', function(){
        MapModel.findById(id, function (err, doc) {
          if (err) return (err);
          queries=doc.terms;
          console.log(id);
          i=0;
          while (i<doc.content.length){
            var docslice=[];
            j=i;
            while (j<i+5){
              if (j<doc.content.length){
                docslice.push(doc.content[j])
              }
              j++;
            }
              var shareurl="http://tweopoints.jit.su/search?id="+id+"&q="+queries;

              io.sockets.emit('buildfromDB', shareurl, docslice, queries);

            console.log("i "+i);
            i=i+5;
          }
          id='';
          return false; 
        })
        makesocket(queries, "");
      });
  }
  else if (query.q!=undefined){

    makesocket(query.q, "");
  }
    });




// function handler (req, res) {
//   fs.readFile(__dirname + '/index.html',
//   function (err, data) {
//     if (err) {
//       res.writeHead(500);
//       return res.end('Error loading index.html');
//     }

//     res.writeHead(200);
//     res.end(data);
//   });
// }
