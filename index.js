//This is the server side 
//Jonathan Leslie

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

Schema = mongoose.Schema;
//Initlaize mongoose schema
var tweetschema = new Schema({
       //schema for database (same as tweet)
       icon: Number,
       followers: Number,
       lat: Number,
       lng: Number,
       lnk: String,
       name: String})
var mapschema = new Schema({ content: [tweetschema], terms:String });
var MapModel = mongoose.model('MapModel', mapschema);


//jade
app.set('views', __dirname + '/tpl');
//templates
app.set('view engine', "jade");
//jade
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/scripts'));


var twit = new twitter({
  consumer_key: '',      //Fill in your codes ( mine is still here really, whatevs)
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});


// var twee = io.of('tweet');

var server = app.listen(port);
//listen for request
var io = require('socket.io').listen(server);
//listen for comm between sockets
app.get("/", function(req, res){
  //render on req
  res.render("page");

});

function makesocket(field, shareurl){
  twit.stream('statuses/filter', {locations: [-179.9,-90,179.9,90] }, function(stream) {
          stream.on('data', function (data) {
              //Takes twitter firehose of all geotagged tweets and sends it client

              io.sockets.emit('tweet', data, shareurl);

          });
    }
io.set('log level', 1);                    // reduce logging
io.sockets.on('connection', function(socket){
  socket.on('send', function(field){
    //Sends tweets to 'em right awayy'
    makesocket(field.topic,  "");
  });
  socket.on('addmore', function(idkey, tweesles){
    console.log(idkey);
    MapModel.findById(idkey, function (err, doc) {
      if (err) return (err);
      //Retrives all the tweopoints from the database
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
    //Add to database the fllowing:
    var maptotal = new MapModel();
    maptotal.content = markers;
    maptotal.terms=queries;
    maptotal.save(function (err) {
    if (!err) console.log('Success!');
    });
    var shareurl="http://tweopoints.jit.su/search?id="+maptotal._id+"&q="+queries;
    io.sockets.emit('urlshare', shareurl);
    makesocket('', "")
  });

/*
  //Cant figure out how I meant to write this function: Should allow the removal of search tersms
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
*/

});

app.get("/search", function(req, res){
  //Render page for search
  var queries="";
  res.render("page");
  console.log('req'+req.url);
  query = require('url').parse(req.url,true).query;
  id=query.id;
  if (id.length>0){
    //Retrieves map from given id (in url)
    console.log('id is ' id);
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
              //Puts in five at a time
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
    //Starts with a given query
    makesocket(query.q, "");
  }
    });




