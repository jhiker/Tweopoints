window.onload = function() {

  var topics = [];
  var topicButtons = document.getElementById("topic-buttons");
  var topicButtonInputs = document.getElementById("topic-buttons").childNodes;
  var addButton = document.getElementById("adder");
  var shareButton =document.getElementById("sharer");
  var sharetitle =document.getElementById("sharespace");
  var field = document.getElementById("field");
  var socket = io.connect('/');
  var rendered = document.getElementById('rendered');  
  var sharespace= document.getElementById('shareurl');  
  var measles = ['red', 'blue', 'purple','green','yellow'];
  var twittershare = document.getElementById('twittershare');
  var dotlist = [];
  var termlist= [];
  var dotlistexport=[];
  var shareurl="";
  var dyanmic = document.getElementById('dynamic'); 
  field.value='';
  sharespace.value='';


  // socket.on('topic', function(field){
  //   if (field.topic) {
  //   topics.push(field.topic);
  //   console.log(topics);
  //     topicButtons.innerHTML = topicButtons.innerHTML + '|' + field.topic;
  //   } else {
  //   console.log("There is a problem: " + data);
  // }
  // })
function rendermap(){
    var latitude = parseFloat("34.515252");
    var longitude = parseFloat("-95.189852");

    var latlngPos = new google.maps.LatLng(latitude, longitude);
                              // Set up options for the Google map
    var myOptions = {
                              zoom: 2,
                              center: latlngPos,
                              mapTypeId: google.maps.MapTypeId.ROADMAP
                                };
    map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

}
  
function querystring(key) {
       var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
       var r=[], m;
        while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
       return r;
    }
function shortURL(longurl){
      //Just fill the generic_access_token variable with the value bitly gave you
    var generic_access_token = '376efa9b1bc8405af469147b34116116f8751ed8';
    var url_to_shorten = longurl;
    var url_encoded = encodeURI(url_to_shorten);
    var json = "";
    var bitly_json_req_url = "https://api-ssl.bitly.com/v3/shorten?access_token="+generic_access_token+"&longUrl="+url_encoded;

    //more info here http://dev.bitly.com/links.html

    if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            resp = JSON.parse(xmlhttp.responseText);
            sharespace.value=resp.data.url;
        }
    }

    xmlhttp.open("GET",bitly_json_req_url,true);
    xmlhttp.send();
};
function buildmap(dlist) {

  dlist.forEach(function(p) {
      pinVar=1.4;
      if (p.followers>500)
        {
        pinVar=pinVar+.2+(p.followers-500)/30000
        }
      if (pinVar>5)
        {
          pinVar=5
        }

      var pinImage = new google.maps.MarkerImage("dot"+measles[p.icon]+".png",
                                                                                      null, /* size is determined at runtime */
                                                                                      null, /* origin is 0,0 */
                                                                                      null, /* anchor is bottom center of the scaled image */
                                                                                      new google.maps.Size(5*pinVar, 5*pinVar));
                                           var point = new google.maps.LatLng(p.lat, p.lng);
                                           var marker = new google.maps.Marker({position: point,
                                                                               map: map,
                                                                               url: p.lnk,
                                                                               icon: pinImage,
                                                                               });
                                           var infowindow =  new google.maps.InfoWindow({
                                                                                        content: p.name,
                                                                                        map: map
                                                                                        });

                                            google.maps.event.addListener(marker, 'click', function() {
                                                                         window.open (marker.url);
                                                      });
                                          google.maps.event.addListener(marker, 'mouseover', function() {
                                                                         infowindow.open(map, this);
                                                                         });
                                            google.maps.event.addListener(marker, 'mouseout', function() {
                                                                         infowindow.close();
                                                                         });
    
  });
  if (sharespace.value.length>0 &&addButton.value=="Stop" && !dynamic.value){
        var idkey= querystring("id");
        socket.emit('addmore', idkey, dlist);
        dlist= [];
      } 
      return dlist;          
}
function markerAtPoint(latlng) {
  for (var i = 0; i < marker_locations.length; ++i) {
    if (marker_locations[i].equals(latlng)) return true;
  }
  return false;
}

rendermap();

socket.on('buildfromDB', function(shareurl, initialdata, queries)
{
      field.readOnly=true;
      dynamic.value=true;
      dynamic.readOnly=true;
      shareButton.value="Click for Short URL";
      field.style.background='lightgrey';
      field.value=queries;
      sharespace.value="";
      buildmap(initialdata);
      var watches= [];
      sharespace.value=shareurl;
      var items = field.value.split(',')
              items.forEach(function(p) {
                p= p.replace("%20", " ");
                if (p=="") {watches.push(" ")}
                else {watches.push(p)}
                });
      i=0;
                    while (watches[i] &&measles[i])
                      {
                        if (i==0 )
                        {
                          var htmlex="<div style='background-color:white;font:cooper-black;'> <b> KEY </b>: '"+watches[0]+"': <img src='dot"+measles[0]+".png'> ";
                        }
                        else
                        {
                          htmlex=htmlex +"'" +watches[i] +"': <img src='dot"+measles[i]+".png'> " ;
                        }
                        i++;
                      }
      topicButtons.innerHTML=htmlex+"</div>";
  
});
socket.on('urlshare', function(shareurl){
  sharespace.value=shareurl;
});
socket.on('tweet', function (data, shareurl) 
{   
    if (dotlist.length>4) dotlist=[];
    if (field.value=="" &&querystring("q")!="" &&termlist.length==0)
    {
      field.value=querystring("q");
      addButton.value="Stop";
      topicButtons.innerHTML="";
    }


    if (addButton.value=="Stop")
        {
          field.readOnly=true;
          field.style.background='lightgrey';
          var watches=[];
          var htmlex="";
          var items = field.value.split(',')
          items.forEach(function(p) {
            p= p.replace("%20", " ");
            if (p=="") {watches.push(" ")}
            else {watches.push(p)}
            });
          //field.value="";


              if ((watches != "") && (!data.disconnect)) 
              {
              //console.log(data);
              

                i=0;
                while (watches[i] &&measles[i])
                  {
                    if (i==0 )
                    {
                      var htmlex="<div style='background-color:white;font:cooper-black;'> <b> KEY </b>: '"+watches[0]+"': <img src='dot"+measles[0]+".png'> ";
                    }
                    else
                    {
                      htmlex=htmlex +"'" +watches[i] +"': <img src='dot"+measles[i]+".png'> " ;
                    }
                    var re = new RegExp(watches[i]);
                    if (data.text.match(re)) 
                    {
                      tempdict={};
                      tempdict.icon=i;
                      tempdict.followers=data.user.followers_count;
                      tempdict.lat=data.coordinates.coordinates[1];
                      tempdict.lng=data.coordinates.coordinates[0];
                      tempdict.lnk= "http://twitter.com/"+data.user.screen_name;

                      tempdict.name="<b>"+data.user.screen_name+" ("+ tempdict.followers+' followers) :</b>"'+data.text +"@ "+data.created_at;

                      dotlist.push(tempdict);
                    }
                    i++;
                  }
                termlist.push(watches);
                if (topicButtons.innerHTML=="")
                  {
                    topicButtons.innerHTML=htmlex+"</div>";
                  }
          }
      //tweets.innerHTML =  data.text + '<br>' + tweets.innerHTML ;
      }
  if (dotlist.length>3)
    {
    dotlist=buildmap(dotlist);
    dotlist.forEach(function(p){
      dotlistexport.push(p);
    });
    dotlist=[];
  }


    //create button array
    if (topics.length != watches.length) {
      topics = [];
      topicButtons.innerHTML = "";
      topics = watches;
      console.log(watches);

      topics.forEach(function(topic){
        topicButtons.innerHTML = topicButtons.innerHTML ;
      });
    }

  });


  shareButton.onclick = addshare= function() {
  if (sharespace.value.length==0){
      sharespace.value="Saving map....URL will load..."
      socket.emit('sharesend', dotlistexport, field.value) 
      shareButton.value="Click for Short URL";
 
  }
  else if (shareButton.value=="Click for Short URL")
  {
    
    shortURL(sharespace.value);
    
    twittershare.style.visibility="visible";/*+'<a href="#" 
  onclick="'+
    "window.open(
      'https://www.facebook.com/sharer/sharer.php?u="+'"+encodeURIComponent(shareurl)'+"', 
      'facebook-share-dialog', 
      'width=626,height=436');"+ 
    'return false;">
  Share on Facebook
</a>';*/
    shareButton.value="";
  }

}

  addButton.onclick = addTopic = function() {
    var text = field.value;
    if (addButton.value=="Search!") {
    topicButtons.innerHTML="";

    addButton.value="Stop";
    addButton.background="red";
    socket.emit('send', {topic: text});
     }
    else {
      addButton.value="Search!"

    }

  };

  // $('#topic-buttons').click(function(event){
  //      var $source = $(event.target);
  //      console.log($source);
  // });
  $("#topic-buttons").on("click", "input", function(event){

    var removeVar = $(this).context.value;
    socket.emit('remove', {topic: removeVar});
  });
  



};
  

    
