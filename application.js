var mbta = null;
var mbtadata = null;
var cm = null;

document.observe("dom:loaded", function() {
  
  // adjust to resolution
  var width = 800;
  if (screen.width !== undefined) {
    if (screen.width >= 1280) {
      width = 900;
      $('headerimg').setAttribute('src', 'images/header900.png');
      $('map_home').setAttribute('coords', "0,0,683,90");
      $('map_about').setAttribute('coords', "683,0, 763, 90");
      $('map_posters').setAttribute('coords', "800,0, 900, 90");
    } 
  }
  
  $('content').style.width = width + "px";
  $('footer').style.width = width + "px";  
  $('canvases').style.width = width + "px";  

  cm = new CurveManager(true);
  cm.add(new MBTA( {width : width-100, height : width-100} ));

  mbtadata = new MBTAData(cm);
  
  // mbta = new MBTA(properties);
});
