window.onload = function() {

  function DistanceWidget(map) {
        this.set('map', map);
        this.set('position', map.getCenter());

        var marker = new google.maps.Marker({
          draggable: true,
          title: 'Move me!'
        });

        // Bind the marker map property to the DistanceWidget map property
        marker.bindTo('map', this);

        // Bind the marker position property to the DistanceWidget position
        // property
        marker.bindTo('position', this);

        // Create a new radius widget
        var radiusWidget = new RadiusWidget();

        // Bind the radiusWidget map to the DistanceWidget map
        radiusWidget.bindTo('map', this);

        // Bind the radiusWidget center to the DistanceWidget position
        radiusWidget.bindTo('center', this, 'position');

        // Bind to the radiusWidgets' distance property
        this.bindTo('distance', radiusWidget);

        // Bind to the radiusWidgets' bounds property
        this.bindTo('bounds', radiusWidget);
      }
      DistanceWidget.prototype = new google.maps.MVCObject();


      /**
       * A radius widget that add a circle to a map and centers on a marker.
       *
       * @constructor
       */
      function RadiusWidget() {
        var circle = new google.maps.Circle({
          strokeWeight: 2
        });

        // Set the distance property value, default to 50km.
        this.set('distance', 50);

        // Bind the RadiusWidget bounds property to the circle bounds property.
        this.bindTo('bounds', circle);

        // Bind the circle center to the RadiusWidget center property
        circle.bindTo('center', this);

        // Bind the circle map to the RadiusWidget map
        circle.bindTo('map', this);

        // Bind the circle radius property to the RadiusWidget radius property
        circle.bindTo('radius', this);

        // Add the sizer marker
        this.addSizer_();
      }
      RadiusWidget.prototype = new google.maps.MVCObject();


      /**
       * Update the radius when the distance has changed.
       */
      RadiusWidget.prototype.distance_changed = function() {
        this.set('radius', this.get('distance') * 1000);
      };


      /**
       * Add the sizer marker to the map.
       *
       * @private
       */
      RadiusWidget.prototype.addSizer_ = function() {
        var sizer = new google.maps.Marker({
          draggable: true,
          title: 'Drag me!'
        });

        sizer.bindTo('map', this);
        sizer.bindTo('position', this, 'sizer_position');

        var me = this;
        google.maps.event.addListener(sizer, 'drag', function() {
          // Set the circle distance (radius)
          me.setDistance();
        });
      };


      /**
       * Update the center of the circle and position the sizer back on the line.
       *
       * Position is bound to the DistanceWidget so this is expected to change when
       * the position of the distance widget is changed.
       */
      RadiusWidget.prototype.center_changed = function() {
        var bounds = this.get('bounds');

        // Bounds might not always be set so check that it exists first.
        if (bounds) {
          var lng = bounds.getNorthEast().lng();

          // Put the sizer at center, right on the circle.
          var position = new google.maps.LatLng(this.get('center').lat(), lng);
          this.set('sizer_position', position);
        }
      };


      /**
       * Calculates the distance between two latlng points in km.
       * @see http://www.movable-type.co.uk/scripts/latlong.html
       *
       * @param {google.maps.LatLng} p1 The first lat lng point.
       * @param {google.maps.LatLng} p2 The second lat lng point.
       * @return {number} The distance between the two points in km.
       * @private
       */
      RadiusWidget.prototype.distanceBetweenPoints_ = function(p1, p2) {
        if (!p1 || !p2) {
          return 0;
        }

        var R = 6371; // Radius of the Earth in km
        var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
        var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d;
      };


      /**
       * Set the distance of the circle based on the position of the sizer.
       */
      RadiusWidget.prototype.setDistance = function() {
        // As the sizer is being dragged, its position changes.  Because the
        // RadiusWidget's sizer_position is bound to the sizer's position, it will
        // change as well.
        var pos = this.get('sizer_position');
        var center = this.get('center');
        var distance = this.distanceBetweenPoints_(center, pos);

        // Set the distance property for any objects that are bound to it
        this.set('distance', distance);
      };


      function init() {
        var mapDiv = document.getElementById('map-canvas');
        var map = new google.maps.Map(mapDiv, {
          center: new google.maps.LatLng(37.790234970864, -122.39031314844),
          zoom: 8,
          mapTypeId: google.maps.MapTypeId.ROADMAP
          });
        var distanceWidget = new DistanceWidget(map);

        google.maps.event.addListener(distanceWidget, 'distance_changed', function() {
          displayInfo(distanceWidget);
        });

        google.maps.event.addListener(distanceWidget, 'position_changed', function() {
          displayInfo(distanceWidget);
        });
      }

      function displayInfo(widget) {
        var info = document.getElementById('info');
        info.innerHTML = 'Position: ' + widget.get('position') + ', distance: ' +
          widget.get('distance');
      }

      google.maps.event.addDomListener(window, 'load', init);
      var player; // store embed tag
}
// This is where the magic happens
function generate(f) {
    var channels = parseInt(f.channels.value);
    var sampleRate = parseInt(f.sampleRate.value);
    var bitsPerSample = parseInt(f.bitDepth.value);
    var seconds = parseFloat(f.length.value);
    var volume = parseInt(f.volume.value);
    var frequency = parseInt(f.frequency.value);
    var showDump = f.showDump.checked;

    var data = [];
    var samples = 0;
    
    // Generate the sine waveform
    for (var i = 0; i < sampleRate * seconds; i++) {
        for (var c = 0; c < channels; c++) {
            var v = volume * Math.sin((2 * Math.PI) * (i / sampleRate) * frequency);
            data.push(pack("v", v));
            samples++;
        }
    }
    
    data = data.join('');
    
    // Format sub-chunk
    var chunk1 = [
        "fmt ", // Sub-chunk identifier
        pack("V", 16), // Chunk length
        pack("v", 1), // Audio format (1 is linear quantization)
        pack("v", channels),
        pack("V", sampleRate),
        pack("V", sampleRate * channels * bitsPerSample / 8), // Byte rate
        pack("v", channels * bitsPerSample / 8),
        pack("v", bitsPerSample)
    ].join('');

    // Data sub-chunk (contains the sound)
    var chunk2 = [
        "data", // Sub-chunk identifier
        pack("V", samples * channels * bitsPerSample / 8), // Chunk length
        data
    ].join('');
    
    // Header
    var header = [
        "RIFF",
        pack("V", 4 + (8 + chunk1.length) + (8 + chunk2.length)), // Length
        "WAVE"
    ].join('');

    var out = [header, chunk1, chunk2].join('');
    var dataURI = "data:audio/wav;base64," + escape(btoa(out));
    
    // Append embed player
    if (player) {
        player.parentNode.removeChild(player);
    }
    player = document.createElement("embed");
    player.setAttribute("src", dataURI);
    player.setAttribute("width", 400);
    player.setAttribute("height", 100);
    player.setAttribute("autostart", true);
    document.getElementById('player-container').appendChild(player);
    
    document.getElementById('result').style.display = 'block';
    document.getElementById('wav-length').innerHTML = out.length + ' bytes';
    document.getElementById('uri-length').innerHTML = dataURI.length + ' bytes';
    
    // Generate the hex dump
    if (showDump) {
        document.getElementById('dump').style.display = 'block';
        document.getElementById('dump-contents').innerHTML = hexDump(out);
    } else {
        document.getElementById('dump').style.display = 'none';
        document.getElementById('dump-contents').innerHTML = '';
    }
}

// Base 64 encoding function, for browsers that do not support btoa()
// by Tyler Akins (http://rumkin.com), available in the public domain
if (!window.btoa) {
    function btoa(input) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + 
                     keyStr.charAt(enc3) + keyStr.charAt(enc4);
        } while (i < input.length);

        return output;
    }
}

// pack() emulation (from the PHP version), for binary crunching
function pack(fmt) {
    var output = '';
    
    var argi = 1;
    for (var i = 0; i < fmt.length; i++) {
        var c = fmt.charAt(i);
        var arg = arguments[argi];
        argi++;
        
        switch (c) {
            case "a":
                output += arg[0] + "\0";
                break;
            case "A":
                output += arg[0] + " ";
                break;
            case "C":
            case "c":
                output += String.fromCharCode(arg);
                break;
            case "n":
                output += String.fromCharCode((arg >> 8) & 255, arg & 255);
                break;
            case "v":
                output += String.fromCharCode(arg & 255, (arg >> 8) & 255);
                break;
            case "N":
                output += String.fromCharCode((arg >> 24) & 255, (arg >> 16) & 255, (arg >> 8) & 255, arg & 255);
                break;
            case "V":
                output += String.fromCharCode(arg & 255, (arg >> 8) & 255, (arg >> 16) & 255, (arg >> 24) & 255);
                break;
            case "x":
                argi--;
                output += "\0";
                break;
            default:
                throw new Error("Unknown pack format character '"+c+"'");
        }
    }
    
    return output;
}

// Generates a hex dump
function hexDump(out) {
    var lines = [];
    
    for (var i = 0; i < out.length; i += 16) {
        var hex = [];
        var ascii = [];           
        
        for (var x = 0; x < 16; x++) {
            var b = out.charCodeAt(i + x).toString(16).toUpperCase();
            b = b.length == 1 ? '0' + b : b;
            hex.push(b + " ");
            
            if (out.charCodeAt(i + x) > 126 || out.charCodeAt(i + x) < 32) {
                ascii.push('.');
            } else {
                ascii.push(out.charAt(i + x));
            }
            
            if ((x + 1) % 8 == 0) {
                hex.push(" ");
            }
        }
        
        lines.push([hex.join(''), ascii.join('')].join(''));
    }
    
    return lines.join('\n');
}