//-- MBTA Constructor
var MBTA = function(properties) {
  
  if (properties.id) {
    this.id = properties.id;
  } else {
    this.id = 'canvas';
  }
  
  // Contains the stack of curves inner -> outer
  this.pathstack = [];
  
  // Raphael canvas.
  this.canvas = null;
  
  // Position the canvas
  if (properties.x !== undefined && properties.y !== undefined) {
    this.x = properties.x;
    this.y = properties.y;
    this.position = "absolute";
  } else {
    this.x = null;
    this.y = null;
    this.position = "relative";
  }
  
  // Set dimentions
  if (properties.width !== undefined && properties.height !== undefined) {
    this.center = {x : properties.width / 2, y : properties.height / 2};
    this.dimensions = { width : properties.width, height : properties.height};
    this.radius = properties.width / 2 - MBTA.consts.INNER_CIRCLE_RADIUS;
  } else {
    this.center = {x : MBTA.consts.CANVAS.width / 2, y : MBTA.consts.CANVAS.height / 2};
    this.dimensions = { width : MBTA.consts.CANVAS.width, height : MBTA.consts.CANVAS.height};
    this.radius = MBTA.consts.RADIUS;
  }
  
  // Start by getting the lines. Everything else cascades.
  //this.getLines();
  
  this.currentLine = "All...";
  this.currentStation = "All...";
  
  this.ui = new UI(this);
};

//-- Vis consts
MBTA.consts = {
  
  // Max number of rings in relation to the canvas size. should be half the canvas size.
  MAX_RINGS : 300,
  
  // Max radius of vis - inner circle.
  RADIUS : 300 - 50,
  
  // Number of "slices" - 24 hour.
  ENTRIES : 24,
  
  // Angle of slice
  SLICE : 360 / 24,
  
  // Total canvas info
  CANVAS : {
    width : 600,
    height : 600
  },
  
  // Radius of the inner circle
  INNER_CIRCLE_RADIUS : 50,
  
  COLORS : {
    "\"Silver Line\"" : new ColorRange("#bbc3c9","#848a91"),
    "\"Subway Blue Line\"" : new ColorRange("#0090c5","#0a5e8c"),
    "\"Subway Green Line\"": new ColorRange("#00a445","#096b30"),
    "\"Subway Orange Line\"": new ColorRange("#ffb11f","#b97e11"),
    "\"Subway Red Line\"": new ColorRange("#e95c47","#ac1f22")
  },
  DEBUGGING : false
};


MBTA.prototype.paint = function(data, line, station) {
  
  if (cm.respondToControls) {
    // draw missing UI elements
    //  -- Build lines control
    this.ui.buildLinesDropdown(data.lines);
  
    //  -- Build station controls
    this.ui.buildStationDropdowns(data.stations);
  
    //  -- Build go button
    this.ui.buildDrawGoButton();
  
  } else {
    
    // Just paint the curve for the line / station in question
    this.aggregateStats({ line : line, station : station});
    
  }
};

MBTA.prototype.aggregateStats = function(properties) {
  
  // get line being viewed right now.
  var line    = this.currentLine;
  var station =  this.currentStation;
  if (properties !== undefined) {
    line = properties.line;
    station = properties.station;
    this.currentLine = line;
    this.currentStation = station;
  } 
  var line_stats = [];
  
  if (line == "All...") {
    
    var line_keys = mbtadata.lines;
    for (var i = 0; i < line_keys.length; i++) {
      var line = line_keys[i];
      
      // COMPUTE CURVE HERE
      this.buildPath(line, "All...", mbtadata.counts.lines[line], MBTA.consts.COLORS[line].first());
      
    }

    
  } else if (station == "All..." || station == null) {
    // we will have many as many arrays as there are stations in this line.

    var station_keys = $H(mbtadata.stats[line]).keys();
    for (var j = 0; j < station_keys.length; j++) {

      line_stats = mbtadata.stats[line][station_keys[j]].toNumbers();
    
      // COMPUTE CURVE HERE
      this.buildPath(line, station_keys[j], line_stats, MBTA.consts.COLORS[line].next());
      
    }
  } else {
    
    // we will have one array for this line for this station.
    line_stats = mbtadata.stats[line][station].toNumbers();
        
    // COMPUTE CURVE HERE
    this.buildPath(line, station, line_stats, MBTA.consts.COLORS[line].first());
  }
  
  // Now all the paths are queued up. Draw them in reverse order.
  for (var j = this.pathstack.length-1; j > 0; j--) {
    this.drawVis(this.pathstack[j]);
  }
  
  this.ui.drawMiddleCircle(this.center);
  this.ui.drawDeathRays(this.pathstack[0], this.pathstack[this.pathstack.length-1]);
  
  
  // Line label
  if (cm.respondToControls != true) {
    var lastpath = this.pathstack[this.pathstack.length-1].raph_path;
    var startx = lastpath.getBBox().x;

    var station_label = this.canvas.text(startx, 10, this.currentStation.gsub("\"","")).attr({"fill" : this.pathstack[this.pathstack.length-1].color.toHex(), "font-family" : "Verdana", "font-size" : 12, "font-weight" : "bold", "text-anchor": "start"});
  }
  
   
  // move everything to the top.
  this.ui.translateEverything();
  
};

MBTA.prototype.buildPath = function(line, station, line_stats, color) {
  
  // if this is a line with all stations
  var available_radii = [];
  if (this.currentLine == "All..." && this.currentStation == "All...") {
    
    // get the max available line
    var maxValue = mbtadata.counts.all.max();

    for (var i = 0; i < MBTA.consts.ENTRIES; i++) {
      available_radii[i] = (mbtadata.counts.all[i] / maxValue) * this.radius; // 
    }
    
  } else if (this.currentLine != "All..." && this.currentStation == "All...") {
    
    // get the max available line
    var maxValue = mbtadata.counts.lines[line].max();
    
    for (var i = 0; i < MBTA.consts.ENTRIES; i++) {
      available_radii[i] = (mbtadata.counts.lines[line][i] / maxValue) * this.radius; // 
    }
    
  } else {
    
    // get the max available line
    // var maxValue = 0;
    //     if (cm.respondToControls == true) {
    //       maxValue = line_stats.max();
    //     } else {
    //       maxValue = mbtadata.maxRiders;
    //     }
    
    var maxValue = line_stats.max();
    
    for (var i = 0; i < MBTA.consts.ENTRIES; i++) {
      available_radii[i] = (line_stats[i] / maxValue) * this.radius; // 
    }
    
  }
  
  
  // Do we already have paths in the stack? If so, get the last one painted. We will use it for reference.
  var firstPath = false;
  var firstPathCoords = [];
  var prevPath  = null;

  if (this.pathstack.length == 0) {
    var firstPath = true;
  } else {
    var prevPath = this.pathstack[this.pathstack.length-1];
  }

  // normalize the stats
  var adjusted_line_stats = [];
  var angles = [];
  var coords = [];
  var sum = line_stats.sum();
   
  for(var i = 0; i < MBTA.consts.ENTRIES; i++) {
    
    // Adjust radiuses
    // if this is a line with all stations
    var radius = 0;
    if (this.currentLine == "All..." && this.currentStation == "All...") {
      if (mbtadata.counts.all[i] > 0) {
        radius = (line_stats[i] / mbtadata.counts.all[i]) * available_radii[i];
      }
    } else if (this.currentLine != "All..." && this.currentStation == "All...") {
      if (mbtadata.counts.lines[line][i]) {
        radius = (line_stats[i] / mbtadata.counts.lines[line][i]) * available_radii[i];
      }
    } else {
      radius = available_radii[i];
    }
    
    adjusted_line_stats.push(radius);
    
    // Compute angle - Note adjusting for polar coordinates! 12 = 90deg, 3 = 0deg, 6 is 270deg, 9 is 180deg
    // http://en.wikipedia.org/wiki/Polar_coordinates
    
    var angle = 90 - (i * MBTA.consts.SLICE);
    if (angle >= 0) {
      angles.push(angle);
    } else {
      angle = 360 - ((i - 6) * MBTA.consts.SLICE);
      angles.push(angle); // remove a quarter (24/4=6) of the entries we've already used for 0-90
    }
    angle = 360 - angle;
    
    var point = {};
    
    // degrees to radians
    angle = angle * (Math.PI / 180);
    
    point.x = radius * Math.cos(angle);
    point.y = radius * Math.sin(angle);
    
    // transform the points to be relative to top left corner of canvas.
    
    // If this is the first path, assume we have a circle in the middle of the specified radius. 
    // Otherwise, use the previous paths' specification.
    if (firstPath == true) {
      point.startx = this.center.x + (MBTA.consts.INNER_CIRCLE_RADIUS * Math.cos(angle))
      point.starty = this.center.y + (MBTA.consts.INNER_CIRCLE_RADIUS * Math.sin(angle))
      firstPathCoords.push({x : point.startx, y: point.starty});
    } else {
      point.startx = prevPath.coords[i].x; // + (MBTA.consts.INNER_CIRCLE_RADIUS * Math.cos(angle));
      point.starty = prevPath.coords[i].y; // + (MBTA.consts.INNER_CIRCLE_RADIUS * Math.sin(angle));
    }
    
    point.x = Util.round(point.x + point.startx);
    point.y = Util.round(point.y + point.starty);
    
    point.radius = Math.sqrt(Math.pow(point.x - point.startx,2) + Math.pow(point.y - point.starty,2));
    coords.push(point);
  }
  
  var path = null;
  if (firstPath) {
    this.center.radius = MBTA.consts.INNER_CIRCLE_RADIUS;
    var prevPath = new Path(firstPathCoords, null, this.center, line, station);
    path = new Path(coords, prevPath, this.center, line, station);
    path.first = true;
    
    this.pathstack.push(prevPath);
  } else {
    path = new Path(coords, prevPath, this.center, line, station);
  }
  
  path.line_stats = line_stats;
  path.line = line;
  path.station = station;
  path.color = new Color(color);
  
  this.pathstack.push(path);
  
  //this.drawVis(path);
}


MBTA.prototype.drawVis = function(path) {

  // Make the canvas if it doesn't exit. Returns a Raphael paper obj.
  if (this.canvas == null || this.canvas == undefined) {
    this.canvas = this.ui.makeCanvas(this.dimensions.height, this.dimensions.width);
  }
  // Do we already have paths in the stack? If so, get the last one painted. We will use it for reference.
  var firstPath = false;
  var prevPath  = null;
  
  if (path.isFirst()) {
    var firstPath = true;
    
    // draw initial circle
    // var c = this.canvas.circle(
    //       MBTA.consts.CANVAS.width / 2, 
    //       MBTA.consts.CANVAS.height / 2,
    //       MBTA.consts.INNER_CIRCLE_RADIUS
    //     );
    
  } else {
    var prevPath = this.pathstack[this.pathstack.length-1];
  }
  
  var debugpath = "M" + path.coords[0].startx + " " + path.coords[0].starty;
  var curvepath = "M" + path.coords[0].x + " " + path.coords[0].y;
  
  
  //var debugCurvePath = "M" + path.coords[0].startx + " " + path.coords[0].starty;
  //var controlpoint = 
  var lastControlPoint = null;
  
  // compute slopes for each point that are based on the three point circle that passes between it and it's neighbors.
  // geometry goodness: http://local.wasp.uwa.edu.au/~pbourke/geometry/circlefrom3/
  for (var i = 0; i <= path.coords.length; i++) {
    
    var currPoint = path.getPointAt(i);
    
    // Maintain the max distance between two points, this is necessary to then adjust the control handle tension.
    path.updateMaxDistance(currPoint.distNextPoint);
    
    // debug output
    //this.canvas.circle(currPoint.x, currPoint.y, 1);
    //this.canvas.text(currPoint.x + 10, currPoint.y, i);
    //this.canvas.path("M" + currPoint.startx +" "+currPoint.starty +" L" + currPoint.x+" "+currPoint.y).attr({stroke: "#e0e0e0"});
    
    // Compute the circle that passes through the three points, prev, curr and next.
    var centerCircle = path.computeCircleFromThreePoints(i);
    
    // get the slope between the circle center and the current point. Tangent slope is perpendicular to m: -1/m.
    currPoint.centerCircle = centerCircle;
    currPoint.newSlope = -1/Util.computeSlope(centerCircle, currPoint);
  }
  
  var p = this.canvas.path(path.computeCurve()).attr({"fill" : path.color.toHex(), "stroke" : "white", "stroke-width" : "1px" });
  path.raph_path = p;

  if (path.station != "All...") {
    $(p.node).setAttribute("title", path.line.gsub("\"", "") + " :: " + path.station.gsub("\"", ""));
  } else {
    $(p.node).setAttribute("title", path.line.gsub("\"", ""));
  }  
  
  new Tooltip(p.node, {backgroundColor: "#333", borderColor: "#333", 
    		textColor: "#FFF", textShadowColor: "#000", extraText: "Click for more info"});

  p.mbta_path = path;
  
  p.node.onmouseover = function (event) { 
    p.attr("fill", path.color.lighten(0.75));
  };
  
  p.node.onmouseout  = function (event) { 
    p.attr("fill", path.color.toHex()); 
  };
  
  p.node.onclick = function(mbta) {
    return function(event) {
      var line = p.mbta_path.line;
      var station = p.mbta_path.station;
    
      // destroy current barchart
      if (mbta.barchart != null && mbta.barchart != undefined) {
        mbta.barchart.destroy();
      }
    
      if (station != "All...") {
        mbta.barchart = new BarChart(mbta, line, station, mbtadata.stats[line][station], p.mbta_path.color.toHex());
      } else {
        mbta.barchart = new BarChart(mbta, line, station, mbtadata.counts.lines[line], p.mbta_path.color.toHex());
      }
    }
  }(this);
  
  //this.canvas.path(debugCurvePath).attr({stroke: "blue"});
  this.ui.donePainting();
};