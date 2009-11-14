var BarChart = function(mbta, line, station, values, color) {
  this.mbta     = mbta;
  this.line     = line;
  this.station  = station;
  this.values   = values;
  this.color    = color;
  
  this.painted_elements = [];
  this.init();
  

}

BarChart.prototype.init = function() {
  
  //consts:
  var BAR_BUFFER = 3;
  var X_SPACE = 20;
  var Y_SPACE = 70;
  var HEIGHT = 120;
  
  // What's the bbox of the last curve?
  var bounds = this.mbta.ui.getClockBounds();
  
  this.start = {
    x : X_SPACE,
    y : bounds.y + bounds.height + Y_SPACE,
    width : this.mbta.dimensions.width - (X_SPACE * 2),
    height : HEIGHT
  };
  
  this.barWidth = (this.start.width / MBTA.consts.ENTRIES) - BAR_BUFFER;
  
  var maxValue = this.values.max();
  
  var columns = [];
  for ( var i = 0; i < this.values.length; i++) {
    
    var colHeight = (this.values[i] / maxValue ) * this.start.height;
     
    var c_x = this.start.x + (this.barWidth * i) + (BAR_BUFFER * i);
    var c_y = this.start.y + (this.start.height - colHeight);
    var column = {
      colStart : {
        x : c_x,
        y : c_y,
        height: 0,
        width: this.barWidth,
        value : this.values[i]
      },
    
      colEnd : {
        x : c_x,
        y : c_y,
        height : colHeight,
        width : this.barWidth,
        value: this.values[i]
      }
    };
    
    columns.push(column);
  }
  
  this.drawGrid();
  this.growColumns(columns);
};

BarChart.prototype.drawGrid = function() {
  
  var colorProps = {"stroke" : "#cccccc", "font-family" : "Verdana"};
  
  // Line label
  var line_label = this.mbta.canvas.text(this.start.x, this.start.y - 30, this.line.gsub("\"","")).attr({"fill" : this.color, "font-family" : "Verdana", "font-size" : 12, "font-weight" : "bold", "text-anchor": "start"});
  this.painted_elements.push(line_label);
  
  if (this.station != "All..." && this.station != null) {
    var station_label = this.mbta.canvas.text(this.start.x + line_label.getBBox().width + 6, this.start.y - 30, " :: " + this.station.gsub("\"","")).attr({"fill" : this.color, "font-family" : "Verdana", "font-size" : 12, "font-weight" : "bold", "text-anchor": "start"});
     this.painted_elements.push(station_label);
  }
  // x axis
  var x_axis = this.mbta.canvas.path("M " + (this.start.x - 4) + " " + (this.start.y + this.start.height + 2) + " L " + (this.start.x + this.start.width) + " " + (this.start.y + this.start.height + 2)).attr(colorProps);
  
  this.painted_elements.push(x_axis);
  
  // x axis label
  var x_axis_label = this.mbta.canvas.text(this.start.x + this.start.width - 20, this.start.y + this.start.height + 10, "Time >").attr({"fill" : "#cccccc", "font-family" : "Verdana"});
  this.painted_elements.push(x_axis_label);
  
};

BarChart.prototype.growColumns = function(columns) {
  
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    var box = this.mbta.canvas.rect(column.colEnd.x, column.colEnd.y, column.colEnd.width, column.colEnd.height).attr({"fill" : this.color, "stroke" : "white"});
    this.painted_elements.push(box);
    
    box.node.setAttribute("title", column.colEnd.value);
    
    new Tooltip(box.node, {backgroundColor: "#333", borderColor: "#333", 
      		textColor: "#FFF", textShadowColor: "#000"});
    
    var text = this.mbta.canvas.text(column.colEnd.x + 10, this.start.y + this.start.height - 20, i + ":00").rotate(270).attr({"font-family" : "Verdana", "font-size" : "10px"});
    this.painted_elements.push(text);
  
    text.node.setAttribute("title", column.colEnd.value);
    
    new Tooltip(text.node, {backgroundColor: "#333", borderColor: "#333", 
      		textColor: "#FFF", textShadowColor: "#000"});
    
    // translating doesn't actually swap the height / width ratio... so we're using width even though being vertical, we mean height.
    if (text.getBBox().width + 5 > column.colEnd.height) {
      text.attr({"fill" : "#cccccc"});
    } else {
      text.attr({"fill" : "white"});
    }
  }
  
  // draw max marker with value.
  var max = this.values.max();
  var pos = this.values.indexOf(max);
  var column = columns[pos];
  
  var center = {
    x : column.colEnd.x + (this.barWidth / 2),
    y : column.colEnd.y,
    r : 5
  };
  
  
  var line = this.mbta.canvas.path("M " + center.x + " " + center.y + " L " + (center.x + (pos < 20 ? 10 : -10)) + " " + (center.y - 15) + " L " + (center.x + (pos < 20 ? 30 : -30)) + " " + (center.y - 15)).attr({"stroke" : "#aaaaaa"}); 
  this.painted_elements.push(line);
  
  var marker = this.mbta.canvas.circle(center.x, center.y, center.r).attr({"fill" : "#dddddd", "stroke" : "#aaaaaa"});
  this.painted_elements.push(marker);
  
  var marker_label = this.mbta.canvas.text(center.x + (pos < 20 ? 33 : -33), center.y - 12, this.values[pos] + " riders").attr({"fill" : this.color, "font-family" : "Verdana", "font-size" : 12, "font-weight" : "bold", "text-anchor": pos < 20 ? "start" : "end"});
  this.painted_elements.push(marker_label);
};

BarChart.prototype.destroy = function() {
  for(var i= 0; i < this.painted_elements.length; i++) {
    this.painted_elements[i].remove();
  }
};