var Path = function(coords, prevPath, center, line, station) {

  this.coords = coords;
  this.prevPath = prevPath;
  this.center = center;
  this.line = line;
  this.svg_curve = "";
  this.maxDistance = 0;
  this.start = this.coords[0];
  if (prevPath == null || prevPath == undefined) {
    this.first = true;
    
    //TODO: I am here... need to draw this damn circle. OMG.
    //circle format: starting from -y, +x clockwise: draw an arc that is: 1,2,3. Then draw an arc that is 4.
    //M640 640 a 50 50 1 1 1 50 50 M640 640 a 50 50 0 0 0 50 50"
    
    //mbta.canvas.path("M 300 300 a 50 50 0 1 1 -50 50 M250 300 h-50 a 50 50 0 0 0 -50 50");
    //mbta.canvas.path("M 300 300 a 50 50 0 1 1 -50 50 M300 300 a 50 50 0 0 0 -50 50");
    
    // control handle approximation here: http://webscripts.softpedia.com/scriptScreenshots/Approximation-of-Circle-Using-Cubic-Bezier-Curve-Screenshots-33779.html
    // k value from http://www.whizkidtech.redprince.net/bezier/circle/
    var halfr = this.center.radius * 0.5522847498;
    var r = this.center.radius;
    var x = this.start.x;
    var y = this.start.y;
    // this.svg_curve = "M " + x + " " + y
    //      + " C " + (x + halfr) + " " + y + " " + (x + r) + " " + (y + halfr) + " " + (x + r) + " " + (y + r) 
    //      + " C " + (x + r) + " " + (y + r + halfr) + " " + (x + halfr) + " " + (y + r + r) + " " + x + " " + (y + r + r)
    //      + " C " + (x - halfr) + " " + (y + r + r) + " " + (x - r) + " " + (y + r + halfr) + " " + (x - r) + " " + (y + r)
    //      + " C " + (x - r) + " " + (y + halfr) + " " + (x - halfr) + " " + y + " " + x + " " + y + " z";
    
    // Draw the damn curve in reverse.
    this.svg_curve = "M " + x + " " + y
      + " C " + (x - halfr) + " " + y + " " + (x - r) + " " + (y + halfr) + " " + (x - r) + " " + (y + r)
      + " C " + (x - r) + " " + (y + r + halfr) + " " + (x - halfr) + " " + (y + r + r) + " " + x + " " + (y + r + r)
      + " C " + (x + halfr) + " " + (y + r + r) + " " + (x + r) + " " + (y + r + halfr) + " " + (x + r) + " " + (y + r)
      + " C " + (x + r) + " " + (y + halfr) + " " + (x + halfr) + " " + y + " " + x + " " + y + " z";
      
  } else {
    this.first = false;
    this.svg_curve = "M" + coords[0].x + " " + coords[0].y;
  }

  // compute each points previous and next points
  
  for (var i = 0; i <= this.coords.length; i++) {
    
    var idx = i;
    // wrap around the points if you're at the end.
    if (i > 0 && i < this.coords.length - 1) {
      this.coords[i].prevPoint = this.coords[i-1];
      this.coords[i].nextPoint = this.coords[i+1];
    } else if (i == 0) {
      this.coords[i].prevPoint = this.coords[this.coords.length - 1];
      this.coords[i].nextPoint = this.coords[1];
    } else if (i == this.coords.length - 1) {
      this.coords[i].prevPoint = this.coords[this.coords.length - 2]; 
      this.coords[i].nextPoint = this.coords[0];
    } else if (i == this.coords.length) { 
      idx = 0;
      this.coords[0].prevPoint = this.coords[this.coords.length - 1];
      this.coords[0].nextPoint = this.coords[1];
    }
    
    // Compute distance to next and previous points. This will be necessary to compute the magnitude of the control point.
    this.coords[idx].distNextPoint = new Number(Util.distanceBetweenTwoPoints(this.coords[idx], this.coords[idx].nextPoint));
    this.coords[idx].distPrevPoint = new Number(Util.distanceBetweenTwoPoints(this.coords[idx].prevPoint, this.coords[idx]));
    
    // Compute the point slopes.
    this.coords[idx].prevSlope = Util.computeSlope(this.coords[idx], this.coords[idx].prevPoint);
    this.coords[idx].nextSlope = Util.computeSlope(this.coords[idx], this.coords[idx].nextPoint);
  }
  
};

Path.prototype.updateMaxDistance = function(value) {
  this.maxDistance = Math.max(this.maxDistance, value);
};

Path.prototype.getMaxDistance = function() {
  return this.maxDistance;
};

Path.prototype.getPointAt = function(i) {
  if (i < this.coords.length) {
    return this.coords[i];
  } else {
    
    // wrap around if you're at the end.
    return this.coords[0];
  }
};
Path.prototype.getNextPoint = function(i) {
  if ((i+1) < this.coords.length) {
    return this.coords[i+1];
  } else {
    return this.coords[0];
  }
};

Path.prototype.getPrevPoint = function(i) {
  if ((i-1) < 0) {
    return this.coords[this.coords.length-1];
  } else {
    return this.coords[i-1];
  }
};


Path.prototype.computeCurve = function() {
  var lastControlPoint = null;
  
  for (var i = 0; i <= this.coords.length; i++) {
    this.computeControlPoints(i);
    
  }
  
  for (var i = 0; i <= this.coords.length; i++) {

    var currPoint = this.getPointAt(i);
    var prevPoint = this.getPrevPoint(i);
    var nextPoint = this.getNextPoint(i);
    
  //   this.svg_curve += " C " + prevPoint.controlPoints.first.x + " " +prevPoint.controlPoints.first.y + " " +
  //     prevPoint.controlPoints.second.x + " " + prevPoint.controlPoints.second.y + " " + 
  //     currPoint.x + " " + currPoint.y;
  //     
  // }
      
      
      
      
      
      
    // If we're at the top half of the circle, flip the control handle.
      if (i <= ((this.coords.length / 4) + 1) || i >= ((this.coords.length / 4) * 3)) {
         if (lastControlPoint != undefined) {
           this.svg_curve += " C " + lastControlPoint.x + " " + lastControlPoint.y + " " 
                             + currPoint.controlPoints.second.x + " " + currPoint.controlPoints.second.y + " " 
                             + currPoint.x + " " + currPoint.y;
           currPoint.handles = lastControlPoint.x + " " + lastControlPoint.y + " : " + currPoint.controlPoints.second.x + " " + currPoint.controlPoints.second.y + " ";
           
           //debug
           // var prevPoint = this.getPrevPoint(i);
           //         mbta.canvas.path("M " + prevPoint.x + " " + prevPoint.y + " L " + lastControlPoint.x + " " + lastControlPoint.y).attr({"stroke" : "red"});
         }
         
         lastControlPoint = currPoint.controlPoints.first;
         currPoint.lastControlPoint = lastControlPoint;
       } else {
         if (lastControlPoint != undefined) {
           this.svg_curve += " C " + lastControlPoint.x + " " + lastControlPoint.y + " " 
                             + currPoint.controlPoints.first.x + " " + currPoint.controlPoints.first.y + " " 
                             + currPoint.x + " " + currPoint.y;
                             
           currPoint.handles = lastControlPoint.x + " " + lastControlPoint.y + " : " + currPoint.controlPoints.first.x + " " + currPoint.controlPoints.first.y + " ";
           
           // var prevPoint = this.getPrevPoint(i);
           //         mbta.canvas.path("M " + prevPoint.x + " " + prevPoint.y + " L " + lastControlPoint.x + " " + lastControlPoint.y).attr({"stroke" : "red"});
           
         }
         lastControlPoint = currPoint.controlPoints.second;
         currPoint.lastControlPoint = lastControlPoint;
       } 
    }
  
  // Now draw the inside of the path to close it.
  //this.svg_curve += " L" + this.prevPath.getPointAt(0).x + " " + this.prevPath.getPointAt(0).y;
  this.svg_curve += " z ";
  
  return this.svg_curve + this.prevPath.svg_curve;
};

Path.prototype.pointAtPrevPath = function(i) {
  return this.prevPath.coords[i];
}

Path.prototype.computeControlPoints = function(i) {
  
  var prevPoint = this.getPrevPoint(i);
  var currPoint = this.getPointAt(i);
  var nextPoint = this.getNextPoint(i);
  
  currPoint.controlPoints = { 
     first : {}, 
     second : {} 
   };
   
  
  //quadrant: 
  
  // if ((nextPoint.y <= currPoint.y) && (nextPoint.x <= currPoint.x)) {
  //     
  //      var cpoint1 = {
  //        x : currPoint.x - ((currPoint.x - nextPoint.x) / 3),
  //        y : currPoint.y - ((currPoint.y - nextPoint.y) / 3)
  //      };
  //      
  //      var cpoint2 = {
  //        x : currPoint.x - ((currPoint.x - nextPoint.x) / 3) * 2,
  //        y : currPoint.y - ((currPoint.y - nextPoint.y) / 3) * 2
  //      }
  //     
  //   } else if ((nextPoint.y >= currPoint.y) && (nextPoint.x < currPoint.x)) {
  //     
  //     var cpoint1 = {
  //       x : currPoint.x - ((currPoint.x - nextPoint.x) / 3),
  //       y : currPoint.y + ((nextPoint.y - currPoint.y) / 3)
  //     };
  //     
  //     var cpoint2 = {
  //       x : currPoint.x - ((currPoint.x - nextPoint.x) / 3) * 2,
  //       y : currPoint.y + ((nextPoint.y - currPoint.y) / 3) * 2
  //     }
  //     
  //   } else if ((nextPoint.y > currPoint.y) && (nextPoint.x >= currPoint.x)) {
  //     
  //      var cpoint1 = {
  //         x : currPoint.x + ((nextPoint.x - currPoint.x) / 3),
  //         y : currPoint.y + ((nextPoint.y - currPoint.y) / 3)
  //       };
  //  
  //       var cpoint2 = {
  //         x : currPoint.x + ((nextPoint.x - currPoint.x) / 3) * 2,
  //         y : currPoint.y + ((nextPoint.y - currPoint.y) / 3) * 2
  //       }
  //       
  //   } else if ((nextPoint.y < currPoint.y) && (nextPoint.x > currPoint.x)) {
  //     var cpoint1 = {
  //         x : currPoint.x + ((nextPoint.x - currPoint.x) / 3),
  //         y : currPoint.y - ((currPoint.y - nextPoint.y) / 3)
  //       };
  //  
  //       var cpoint2 = {
  //         x : currPoint.x + ((nextPoint.x - currPoint.x) / 3) * 2,
  //         y : currPoint.y - ((currPoint.y - nextPoint.y) / 3) * 2
  //       }
  //   }
  //   
  //   
  //   mbta.canvas.circle(cpoint1.x, cpoint1.y, 3).attr({"fill" : "orange"});
  //   mbta.canvas.circle(cpoint2.x, cpoint2.y, 3).attr({"fill" : "orange"});
  //   mbta.canvas.path(" M " + currPoint.x + " " + currPoint.y + " L "  + cpoint1.x + " " + cpoint1.y + " L " + cpoint2.x + " " + cpoint2.y + " ");
  // // 
  // currPoint.controlPoints.first = cpoint1;
  // currPoint.controlPoints.second = cpoint2;
   //  
   // get angle of the line
    var slopeangle = Math.atan(currPoint.newSlope);
    var slopeangle2 = slopeangle + Math.PI;
     if (slopeangle2 > (2 * Math.PI)) {
       slopeangle2 = slopeangle2-(2*Math.PI);
     }
    
     
     
     

    
    // var adjustedTension = 0;
    //  
    //  if (i <= ((this.coords.length / 4) + 1) || i >= ((this.coords.length / 4) * 3)) {
    //    var adjustedTension = (currPoint.distPrevPoint / this.getMaxDistance()) * maxTension;
    //  } else {
    //    var adjustedTension = (currPoint.distNextPoint / this.getMaxDistance()) * maxTension;
    //  }
    //  
    //  if (adjustedTension < minTension) {
    //    adjustedTension = minTension;
    //  }
    //  adjustedTension = Math.log(adjustedTension) + 7;
    
    // currPoint.controlPoints.first.x = Util.round(currPoint.x + adjustedTension * Math.cos(slopeangle));
    //  currPoint.controlPoints.first.y = Util.round(currPoint.y + adjustedTension * Math.sin(slopeangle));
    //  
    //  currPoint.controlPoints.second.x = Util.round(currPoint.x + adjustedTension * Math.cos(slopeangle2));
    //  currPoint.controlPoints.second.y = Util.round(currPoint.y + adjustedTension * Math.sin(slopeangle2));
    
    // var prevPoint = this.getPrevPoint(i);
    // var nextPoint = this.getNextPoint(i);
    // 
    var prevDist = prevPoint.distNextPoint;
    var dist = currPoint.distNextPoint;
    var nextDist = nextPoint.distNextPoint;
    
    var controlHandleLength = (Math.min(prevDist, dist, nextDist)) / 4;
    
    currPoint.controlPoints.first.x = Util.round(currPoint.x + controlHandleLength * Math.cos(slopeangle));
    currPoint.controlPoints.first.y = Util.round(currPoint.y + controlHandleLength * Math.sin(slopeangle));
    // 
    currPoint.controlPoints.second.x = Util.round(currPoint.x - controlHandleLength * Math.cos(slopeangle));
    currPoint.controlPoints.second.y = Util.round(currPoint.y - controlHandleLength * Math.sin(slopeangle));
    // 
    // if ((nextPoint.y <= currPoint.y) && (nextPoint.x <= currPoint.x)) {
    //   // quad: bottom right
    //   var slopeangle =  Math.atan(currPoint.newSlope) + Math.PI;
    //    if (slopeangle > (2 * Math.PI)) {
    //      slopeangle = slopeangle-(2*Math.PI);
    //    }
    //   var slopeangle2 = Math.atan(nextPoint.newSlope);
    //      
    //   currPoint.controlPoints.first.x = Util.round(currPoint.x + controlHandleLength * Math.cos(slopeangle));
    //   currPoint.controlPoints.first.y = Util.round(currPoint.y + controlHandleLength * Math.sin(slopeangle));
    //   
    //   currPoint.controlPoints.second.x = Util.round(nextPoint.x + controlHandleLength * Math.cos(slopeangle2));
    //   currPoint.controlPoints.second.y = Util.round(nextPoint.y - controlHandleLength * Math.sin(slopeangle2));
    //   
    //   
    //  } else if ((nextPoint.y >= currPoint.y) && (nextPoint.x < currPoint.x)) {
    //    // quad: top right
    //    
    //    var slopeangle = Math.atan(currPoint.newSlope);
    //    var slopeangle2 = Math.atan(nextPoint.newSlope);
    //    
    //    currPoint.controlPoints.first.x = Util.round(currPoint.x + controlHandleLength * Math.cos(slopeangle));
    //    currPoint.controlPoints.first.y = Util.round(currPoint.y + controlHandleLength * Math.sin(slopeangle));
    // 
    //    currPoint.controlPoints.second.x = Util.round(nextPoint.x - controlHandleLength * Math.cos(slopeangle2));
    //    currPoint.controlPoints.second.y = Util.round(nextPoint.y - controlHandleLength * Math.sin(slopeangle2));
    //    
    //  } else if ((nextPoint.y > currPoint.y) && (nextPoint.x >= currPoint.x)) {
    // 
    //  } else if ((nextPoint.y < currPoint.y) && (nextPoint.x > currPoint.x)) {
    //  
    //  }
    
    
    
    if ((i == ((this.coords.length / 4)+1) || i == ((this.coords.length / 4) * 3)-1) &&
           (slopeangle < 0)) {
         var x = currPoint.controlPoints.first;
         currPoint.controlPoints.first = currPoint.controlPoints.second;
         currPoint.controlPoints.second = x;
         
       }
     
  // mbta.canvas.circle(currPoint.x, currPoint.y, 1).attr({"fill" : "black"});
  // mbta.canvas.circle(currPoint.controlPoints.first.x, currPoint.controlPoints.first.y, 2).attr({"fill" : "red", "stroke" : "red"});
  // mbta.canvas.circle(currPoint.controlPoints.second.x, currPoint.controlPoints.second.y, 2).attr({"fill" : "blue", "stroke" : "blue"});
  // mbta.canvas.path("M " + currPoint.x + " " + currPoint.y + " L " + currPoint.controlPoints.first.x + " " + currPoint.controlPoints.first.y);
  // mbta.canvas.path("M " + currPoint.x + " " + currPoint.y + " L " + currPoint.controlPoints.second.x + " " + currPoint.controlPoints.second.y);
  
  // mbta.canvas.text(currPoint.x, currPoint.y, slopeangle > 0 ? "+" : "-").attr({"stroke" : slopeangle > 0 ? "blue" : "red", "font-size" : "24px"});
}



Path.prototype.computeCircleFromThreePoints = function(idx) {
  
  var currPoint = this.getPointAt(idx);
  var nextPoint = this.getNextPoint(idx);
  var prevPoint = this.getPrevPoint(idx);
 
  var circle = {};
  circle.x = ((currPoint.prevSlope * currPoint.nextSlope) * (prevPoint.y - nextPoint.y) + (currPoint.nextSlope * (prevPoint.x + currPoint.x)) - (currPoint.prevSlope * (currPoint.x + nextPoint.x))) / (2 * (currPoint.nextSlope - currPoint.prevSlope));
  circle.y = ((-1 / currPoint.prevSlope) * (circle.x - ((prevPoint.x + currPoint.x)/2))) + ((prevPoint.y + currPoint.y) / 2);
  
  circle.r = Math.sqrt(Math.pow(circle.y - currPoint.y, 2) + Math.pow(circle.x - currPoint.x, 2));
  
  return circle; 
};

Path.prototype.drawCircles = function() {
  for (var i = 0; i < this.coords.length; i++) {
    var currPoint = this.getPointAt(i);
    
    mbta.canvas.circle(currPoint.centerCircle.x, currPoint.centerCircle.y, currPoint.centerCircle.r).attr({"stroke" : "#aaaaaa"});
  }
}

Path.prototype.isFirst = function() {
  return this.first;
};

Path.prototype.curve = function() {
  return this.svg_curve;
};
