var CurveManager = function(controlled) {

  // Collection of all mbta curves
  this.curves = [];
  
  // If this is set to true, vis should respond to controls. Otherwise, not.
  this.respondToControls = controlled;
  
}

CurveManager.prototype.add = function(mbta) {
  this.curves.push(mbta);
}

CurveManager.prototype.paintAll = function() {
  if (this.respondToControls) {
    for (var i = 0; i < this.curves.length; i++) {
      this.curves[i].paint(mbtadata);
    }
  } else {
    var props = {
      id : "c1",
      x : 0,
      y : 0,
      width: 300,
      height : 300
    }
    var perRow = 11;
    var curVal = 1;
    
    var i = 2;
    var nextStation = mbtadata.getNextStation();
    while (nextStation.line != null) {
      
      var mbta = new MBTA(props);
      mbta.paint(mbtadata, nextStation.line, nextStation.station);
      props.x = props.x + props.width;
      props.id = "c" + i;
      i++;
      nextStation = mbtadata.getNextStation();
      
      if (curVal % perRow == 0) {
        props.y += props.height;
        props.x = 0;
        curVal = 1;
      } else {
        curVal++;
      }
    }    
  }
}