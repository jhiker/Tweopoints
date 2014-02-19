##Synopsis
Stream geolocated tweets, using node.js, socket.io, and the Streaming API.  Hosted at nodejitsu: tweopoints.jit.su.
Also allows saving/sharing through Mongodb backend.
##Code Example
Streams all geotagged tweets and uses regular expressesions to filter by keyword:

***
        twit.stream('statuses/filter', {locations: [-179.9,-90,179.9,90] }, function(stream) {
          console.log('inside ' + watches);
          stream.on('data', function (data) {
              io.sockets.emit('tweet', data, shareurl);

          }); 
          var re = new RegExp(watches[i]);
                    if (data.text.match(re)) 
                    {...}
***
##Motivation
I noticed that there are no geotagged streaming apps that allow keyword search, and so I built this as a fun first app.
##Installation
***
	npm install tweopoints
***
##Run Locally
***
  mongod 
  node index.js
***
##License
Author: Jonathan Leslie, 2013
Apache License, V 2.0. 
