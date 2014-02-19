window.onload = function() {
  //Server side work
  var topics = [];
  var topicButtons = $("topic-buttons");
  var addButton = $("adder");
  var shareButton =$("sharer");
  var sharetitle =$("sharespace");
  var field = $("field");
  var rendered = $('rendered');  
  var sharespace= $('shareurl');  
  var dyanmic = $('dynamic'); 
  var twittershare = $('twittershare');
  var socket = io.connect('/');
  var measles = ['red', 'blue', 'purple','green','yellow'];
  var dotlist = [];
  var termlist= [];
  var dotlistexport=[];
  var shareurl="";
  field.value='';
  sharespace.value='';


(function rendermap(){
    //Creates a new empty map
    var latitude = parseFloat("34");
    var longitude = parseFloat("-95");

    var latlngPos = new google.maps.LatLng(latitude, longitude);
                              // Set up options for the Google map
    var myOptions = {
                              zoom: 2,
                              center: latlngPos,
                              mapTypeId: google.maps.MapTypeId.ROADMAP
                                };
    map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

}).call(this)
  
function querystring(key) {
      //Parses and returns the values inbedded in a url 
      ///for a given key, such as map "id" or "q" for query
       var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
       var r=[], m;
       while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
       return r;
    }

function shortURL(longurl){
      //Creates a bit.ly short url using api
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
  //Adds points to map from a given array of points
  dlist.forEach(function(p) {
      //createst size of pin as function of # of followers
      pinVar=1.4;

      if (p.followers>500)
        {
        pinVar=pinVar+.2+(p.followers-500)/30000
        }
      if (pinVar>5)
        {
          pinVar=5
        }

      varpinImage=new google.maps.MarkerImage("dot"+measles[p.icon]+".png", //eg dotred.ong
        //Puts pin on map

        null,/*sizeisdeterminedatruntime*/
        null,/*originis0,0*/
        null,/*anchorisbottomcenterofthescaledimage*/
        new google.maps.Size(5*pinVar,5*pinVar));
        varpoint=new google.maps.LatLng(p.lat,p.lng);
        varmarker=new google.maps.Marker({position:point,
          map:map,
          url:p.lnk,
          icon:pinImage,
        });

      var infowindow= new google.maps.InfoWindow({
        content:p.name,
        map:map
      });

      google.maps.event.addListener(marker,'click',function(){
        window.open(marker.url);
        });
      google.maps.event.addListener(marker,'mouseover',function(){
        infowindow.open(map,this);
        });
      google.maps.event.addListener(marker,'mouseout',function(){
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
  //
  for (var i = 0; i < marker_locations.length; ++i) {
    if (marker_locations[i].equals(latlng)) return true;
  }
  return false;
}


socket.on('buildfromDB', function(shareurl, initialdata, queries)
{
 //Builds map from database url (with monbodb key)
      field.readOnly=true;
      dynamic.value=true;
      dynamic.readOnly=true;
      shareButton.value="Click for Short URL";
      field.style.background='lightgrey';
      field.value=queries;//Adds queries to field
      sharespace.value="";
      buildmap(initialdata);
      var watches= [];
      sharespace.value=shareurl;
      var items = field.value.split(',')
      items.forEach(function(p) {
        p= p.replace("%20", " ");
        if (p=="") watches.push(" ")
        else watches.push(p)
      });
      i=0;
      while(watches[i]&&measles[i])
      {

        if(i==0)
          {
          varhtmlex="<divstyle='background-color:white;font:cooper-black;'><b>KEY</b>:'"+watches[0]+"':<imgsrc='dot"+measles[0]+".png'>";
          }
        else
          {
          htmlex+="'"+watches[i]+"':<imgsrc='dot"+measles[i]+".png'>";
          }
        i++;
      }
      topicButtons.innerHTML=htmlex+"</div>";
  
});

socket.on('urlshare', function(shareurl){
  //Adds url to empty form
  sharespace.value=shareurl;
});

socket.on('tweet', function (data, shareurl) 
{   
    //Tweet coming through socket..
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
            //configure inputs around whitespace and create array 
            p= p.replace("%20", " ");
            if (p=="") watches.push(" ");
            else watches.push(p)
            });
          //field.value="";


              if ((watches != "") && (!data.disconnect)) 
              {
                //Build array of search terms             

                i=0;
                while (watches[i] &&measles[i])
                  { 
                    //Loop through all the keyterms = watches or measles, which = color of dots (only seven available)
                    //IE you can only have seven keywords at a time
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
                      //If tweet data mataches regular expression made from search term, then add to "dotlist array"
                      var infowindow ={}; //All relevant tweet info for view
                      infowindow.icon=i;
                      infowindow.followers=data.user.followers_count;
                      infowindow.lat=data.coordinates.coordinates[1];
                      infowindow.lng=data.coordinates.coordinates[0];
                      infowindow.lnk= "http://twitter.com/"+data.user.screen_name;

                      infowindow .name="<b>"+data.user.screen_name+" ("+ infowindow .followers+' followers) :</b>"'+data.text +"@ "+data.created_at;

                      dotlist.push(infowindow );
                    }
                    i++;
                  }
                termlist.push(watches);
                if (topicButtons.innerHTML=="") topicButtons.innerHTML=htmlex+"</div>";
                  
          }
      //tweets.innerHTML =  data.text + '<br>' + tweets.innerHTML ;
      }
  if (dotlist.length>3)
    {
    ///Adds to the map if 3 tweets come along 
    dotlist=buildmap(dotlist);
    dotlist.forEach(function(p){
      ///Global variable saving all tweets
      dotlistexport.push(p);
    });
    dotlist=[];
  }


    //create button array
    if (topics.length != watches.length) {
      topics = [];
      topicButtons.innerHTML = "";
      topics = watches;
      console.log(watches); //what are the search terms

      topics.forEach(function(topic){
        topicButtons.innerHTML = topicButtons.innerHTML ;
      });
    }

  });


  shareButton.onclick = addshare= function() {
    //toggles Sharebutton, manipulates DOM accordingly
    if (sharespace.value.length==0){
      //create a link to share
        sharespace.value="Saving map....URL will load..."
        socket.emit('sharesend', dotlistexport, field.value) 
        shareButton.value="Click for Short URL";
   
    }
    else if (shareButton.value=="Click for Short URL")
    {
      //run through shareurl
      shortURL(sharespace.value);
      
      twittershare.style.visibility="visible";
      //Allows for map to be shared on twitter
      shareButton.value="";
    }

}

  addButton.onclick = addTopic = function() {
    //Toggle function for the Search Button
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

/*
  $("#topic-buttons").on("click", "input", function(event){
    var removeVar = $(this).context.value;
    socket.emit('remove', {topic: removeVar});
  });
*/
  



};
  

    
