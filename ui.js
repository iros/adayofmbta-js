var UI = function(mbta) {
  this.mbta = mbta;
};

UI.prototype.makeCanvas = function(width, height) {
  if ($(this.mbta.id) == undefined) {
    var canvas_elm = $(document.createElement('div'));
    canvas_elm.setAttribute('id', this.mbta.id);
    canvas_elm.style.position = (this.mbta.position);
    
    if (this.mbta.position == "absolute") {
      canvas_elm.style.top = this.mbta.y;
      canvas_elm.style.left = this.mbta.x;
    }
    
    if (cm.respondToControls != true) {
      canvas_elm.setStyle({ 'float' : 'left', display : 'block'});
    }
    
    canvas_elm.style.height = (this.mbta.dimensions.height + 200) + "px";
    canvas_elm.style.width  = this.mbta.dimensions.width + "px";

    // if (cm.respondToControls != true) {
      //canvas_elm.setAttribute('style', 'position: relative; display: block; height: '+height+'px; '+width+': 300px; float: left;')
      //$('canvases').style.width = (300 * 24) + "px";
    //    }
    $('canvases').appendChild(canvas_elm);
  }
  
  var paper = Raphael(this.mbta.id, width, height + 200);  
  return paper;
  
};

UI.prototype.buildLinesDropdown = function(lines) {
  
  var self = this;
  
  var form = $('lineSelectorContainer');
  
  var stationSelector = $(document.createElement('select'));
  stationSelector.setAttribute('id', 'lineSelector');
  stationSelector.setAttribute('name','lineSelector');
  
  // add all lines option
  var option = $(document.createElement('option'));
  option.setAttribute('value', "All...");
  option.update("All..");
  stationSelector.appendChild(option);
  
  for (var i = 0; i < lines.length; i++) {
    var option = $(document.createElement('option'));
    option.setAttribute('value', lines[i]);
    option.update(lines[i].substring(1, lines[i].length-1));
    stationSelector.appendChild(option);
  }
  
  var stationSelectorLabel = $(document.createElement('span'));
  stationSelectorLabel.addClassName('formLabel');
  stationSelectorLabel.update("Line: ");
  
  var br = document.createElement('br');
  
  form.appendChild(stationSelectorLabel);
  form.appendChild(br);
  form.appendChild(stationSelector);
  
  Event.observe(stationSelector, 'change', function(e) {
    var value = e.element().value;
    
    // Hide previous station selector
    if (self.prevStationSelector != undefined) {
      $(self.prevStationSelector).hide();
    }
    
    self.mbta.currentLine = value;
    
    if (value !== 'All...') {
      self.prevStationSelector = 'stationSelectorContainer_' + value;

      // unhide the station drop downs.
      $('stationSelectorContainer_' + value).show();
    } 
    
    self.mbta.currentStation = "All...";
    self.reactToSelection();
    
  });
};

UI.prototype.buildStationDropdowns = function(stations) {
  var form = $('stationSelectorContainer');
  var lines = $H(stations).keys();
  var self = this;
  
  for (var i = 0; i < lines.length; i++) {
    
    var line = lines[i];
    var stations_per_line = stations[line];
    
    var divContainer = $(document.createElement('div'));
    divContainer.setAttribute('id', 'stationSelectorContainer_' + line);
    divContainer.style.display = "none";
    
    var stationSelector = $(document.createElement('select'));
    stationSelector.setAttribute('id', 'stationSelector_' + line);
    stationSelector.setAttribute('name','stationSelector_' + line);
    stationSelector.addClassName('stationSelector');
    
    // add all stations option
    var option = $(document.createElement('option'));
    option.setAttribute('value', "All...");
    option.update("All..");
    stationSelector.appendChild(option);
    
    for (var k = 0; k < stations_per_line.length; k++) {
      var option = $(document.createElement('option'));
      option.setAttribute('value', stations_per_line[k]);
      option.update(stations_per_line[k].substring(1, stations_per_line[k].length-1));
      stationSelector.appendChild(option);
    }
    
    var stationSelectorLabel = $(document.createElement('span'));
    stationSelectorLabel.addClassName('formLabel');
    stationSelectorLabel.update("Station: ");
    
    var br = document.createElement('br');
    divContainer.appendChild(stationSelectorLabel);
    divContainer.appendChild(br);
    divContainer.appendChild(stationSelector);
    
    Event.observe(stationSelector, 'change', function(e) {
      var value = e.element().value;
      self.mbta.currentStation = value;
      
      self.reactToSelection();
      
    });
    
    form.appendChild(divContainer);
  }
};

UI.prototype.buildDrawGoButton = function() {
  var form = $('goButtonContainer');
  var self = this;
  
  var goButton = $(document.createElement('div'));
  goButton.setAttribute('id', 'goButton');
  goButton.update('Start');
  goButton.addClassName('formButton');
  
  form.appendChild(goButton);
  
  Event.observe(goButton, 'click', function(e) {
    self.reactToSelection()
  });
  
  if ($('status_update')) {
    $('status_update').remove();
  }
}

UI.prototype.reactToSelection = function() {
  
  if ($('goButton')) {
    $('goButton').remove();
  }
  if (this.mbta.painting == undefined || this.mbta.painting == false ) {
    
    this.startPainting();
    
    // TODO: refresh view here. NO FETCHING REQUIRED.
    this.mbta.aggregateStats();
    
  }
};


UI.prototype.drawMiddleCircle = function(center) {
  
  path = this.mbta.pathstack[0];

  var circle = this.mbta.canvas.path(path.svg_curve).attr({ "fill" : "white", "stroke" : "white" });
  path.raph_path = circle;
  
  var y_offset = 40;
  var x_offset = 35;
  
  this.centerLabels = [];
  this.centerLabels.push(this.mbta.canvas.text(center.x, center.y - y_offset, "12am"));
  this.centerLabels.push(this.mbta.canvas.text(center.x + x_offset, center.y, "6am"));
  this.centerLabels.push(this.mbta.canvas.text(center.x, center.y + y_offset, "12pm"));
  this.centerLabels.push(this.mbta.canvas.text(center.x - x_offset, center.y, "6pm"));

};

UI.prototype.drawDeathRays = function(innerCircle, path) {
  var coords = path.coords;
  var center = this.mbta.center;
  
  for (var i = 0; i < coords.length; i++) {
    
    this.centerLabels.push(this.mbta.canvas.path("M " + innerCircle.coords[i].x + " " + innerCircle.coords[i].y + " L " + coords[i].x + " " + coords[i].y).attr({"stroke" : "white", "stroke-width" : "1px"}));
  }
  
};

UI.prototype.getClockBounds = function() {
  return this.mbta.pathstack[this.mbta.pathstack.length-1].raph_path.getBBox();
};

UI.prototype.translateEverything = function() {
  
  var bounds = this.getClockBounds();
  var translate_y = -bounds.y + 30;
  
  for (var i = 0; i < this.mbta.pathstack.length; i++) {
    var path = this.mbta.pathstack[i];
    if (path.raph_path != undefined) {
      path.raph_path.translate(0, translate_y);
    }
  };
  
  for (var i = 0; i < this.centerLabels.length; i++) {
    this.centerLabels[i].translate(0, translate_y);
  }
  
}

UI.prototype.startPainting = function() {
  this.mbta.painting = true;
  
  var colors = $H(MBTA.consts.COLORS).keys();
  for (var i = 0; i < colors.length; i++) {
    MBTA.consts.COLORS[colors[i]].reset();
  }
  
  if ($('instructions')) {
    $('instructions').remove();
  }
  if (this.mbta.currentLine == undefined) {
    this.mbta.currentLine = "All..."; // Default is all lines.
  }
  
  if (this.mbta.canvas != undefined && this.mbta.canvas != null) {
    this.mbta.canvas.clear();
  }
  
  this.mbta.pathstack = [];
  this.mbta.barchart = null;
};

UI.prototype.donePainting = function() {
  this.mbta.painting = false;
  
  if (cm.respondToControls == true) {
    var line = $('lineSelector').value;
    $('lineSelector').enable();
  
    if (this.mbta.currentLine != "All...") {
      $('stationSelector_' + line).enable();
    }
  }
};