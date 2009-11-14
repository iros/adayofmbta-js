//-- Util Handler
var Util = function() {};
Util.updateStatus = function(message) {

  if ($('status_update') == undefined) {
    var status_update_elm = $(document.createElement('div'));
    status_update_elm.setAttribute('id', 'status_update');
    $('content').appendChild(status_update_elm);
  }
  $('status_update').update(message);
  new Effect.Highlight('status_update');

};

Util.distanceBetweenTwoPoints = function(p1, p2) {
  return Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2)).toFixed(2);
};

Util.computeSlope = function(p1, p2) {
  return ((p2.y - p1.y) / (p2.x - p1.x));
}

Util.round = function(value) {
  return new Number((new Number(value)).toFixed(2));
};

// returns an offset of amount from v1 towards v2. 0 < amount < 1.
Util.lerp = function(v1, v2, amount) {
  return (amount * (v2 - v1)) + v1;
};

Util.toHex = function(v1) {
  var res = (new Number(v1).toString(16));
  if (res.length == 1) {
    res = "0" + res;
  }
  return res;
}

// Array extensions
Array.prototype.sum = function(){
	for(var i=0,sum=0;i<this.length;i++) {
	  var val = Number(this[i]);
	  if (!isNaN(val)) {
	    sum += val;
    }
	}
	return sum;
};

Array.prototype.toNumbers = function() {
  for (var i=0; i<this.length;i++) {
    var val = Number(this[i]);
    if (!isNaN(val)) {
      this[i] = val;
    } else {
      this[i] = 0;
    }
  }
  return this;
};

Array.prototype.average = function() {
  var sum = this.sum();
  var count = this.length;
  return sum/count;
}

Array.prototype.max = function() {
  var maxval = 0;
  for (var i=0; i<this.length;i++) {
    var val = Number(this[i]);
    if (!isNaN(val)) {
      maxval = Math.max(maxval, val);
    }
  }
  return maxval;
}
