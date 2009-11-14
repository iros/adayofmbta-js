var MBTAData = function(curveManager) {
  
  // Contains all the curves that need to be drawn.
  this.curveManager = curveManager;
  
  // Contains all the available lines
  this.lines = null;
  
  // Contains the latest fetched stats
  this.stats = null;
  
  // Contains all the stations for each line.
  this.stations = {};
  
  // Overall max ridership.
  this.maxRiders = 0;
  
  // Initialize appropriate ajax urls.
  this.urls = {
    lines_url : $('lines_url').getAttribute('value'),
    stats_url : $('stats_url').getAttribute('value'),
    stations_url : $('station_url').getAttribute('value')
  };
  
  this.getLines();

  // iterators
  this.iterators = {
    line : null,
    station : null,
    line_idx : 0,
    station_idx : 0
  }
};

MBTAData.prototype.getNextStation = function() {
  if (this.stations[this.iterators.line][this.iterators.station_idx] == undefined) {
    
    this.iterators.line_idx++;
    
    if (this.lines[this.iterators.line_idx] !== undefined) {
      this.iterators.station_idx = 0;
      this.iterators.line = this.lines[this.iterators.line_idx];
      this.iterators.station = this.stations[this.iterators.line][this.iterators.station_idx];
      this.iterators.station_idx++;
    } else {
      this.iterators.line = null;
      this.iterators.station = null;
    }
  } else {
    this.iterators.station = this.stations[this.iterators.line][this.iterators.station_idx];
    this.iterators.station_idx++;
  }
  
  return { line : this.iterators.line, station : this.iterators.station }
};

MBTAData.prototype.getLines = function() {
  
  Util.updateStatus("Getting lines");
  var self = this;
  
  // get lines
   new Ajax.Request(this.urls.lines_url, {
     asynchronous : true,
     evalScripts : true,
     method : 'get',
     onSuccess : function(transport) {
        Util.updateStatus("Got lines!");
        self.lines = transport.responseText.evalJSON();
       
        // initialize lines form
        self.getStations();
      }
   }); 
};


// Get all available stations for all lines that were fetched in getLines.
MBTAData.prototype.getStations = function() {
  Util.updateStatus("Getting Stations");
  var self = this;
  
  for (var i = 0; i < self.lines.length; i++) {
    
    var line = self.lines[i];
    Util.updateStatus("Getting Stations: " + line);
    // get lines
    new Ajax.Request(this.urls.stations_url, {
      asynchronous : false,
      evalScripts : true,
      method : 'get',
      parameters: { "line" : line },
      onSuccess : function(transport) {
        self.stations[line] = transport.responseText.evalJSON();
        MBTA.consts.COLORS[line].computeColors(self.stations[line].length + 1);
      }
    });
  };
  
  Util.updateStatus("Done Getting Stations!");
  this.getStats(); // get all counts for all stations.
};

// Get data about either all lines, a specific line or a specific line with a specific station.
MBTAData.prototype.getStats = function() {
  Util.updateStatus("Getting Stats");
  var self = this;
  
  // get lines
   new Ajax.Request(this.urls.stats_url, {
     asynchronous : true,
     evalScripts : true,
     method : 'get',
     onSuccess : function(transport) {
       Util.updateStatus("Got Stats!");
       self.stats = transport.responseText.evalJSON();
       
       // Compute aggregate for all lines per hour
       self.counts = {};
       self.counts.all = [];
       self.counts.lines = {};
       var line_keys = $H(self.stats).keys();
       for (var i = 0; i < line_keys.length; i++) {
         var station_keys = $H(self.stats[line_keys[i]]).keys();
         for (var j = 0; j < station_keys.length; j++) {
           var temp_stats = self.stats[line_keys[i]][station_keys[j]].toNumbers();
           self.maxRiders = Math.max(temp_stats.max(), self.maxRiders);
           for (var k = 0; k < temp_stats.length; k++) {
             // Increment all counts
             if (self.counts.all[k] == undefined) {
               self.counts.all[k] = temp_stats[k];
             } else {
               self.counts.all[k] += temp_stats[k];
             }

             // increment line specific counts
             if (self.counts.lines[line_keys[i]] == undefined) {
               self.counts.lines[line_keys[i]] = [];
             }
             if (self.counts.lines[line_keys[i]][k] == undefined) {
               self.counts.lines[line_keys[i]][k] = temp_stats[k];
             } else {
               self.counts.lines[line_keys[i]][k] += temp_stats[k];
             }

           }
         }
       }
       

       self.iterators.line = self.lines[0];
       self.iterators.station = self.stations[self.iterators.line][0];
       
       self.curveManager.paintAll();
     }
   });
};
