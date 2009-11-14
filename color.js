// Takes in "#xxxxxx" as input.
var Color = function(c1) {
  if (c1 != undefined) {
    this.hex = c1;
    this.hexToRGB();
  } else {
    this.hex = "";
    this.r = 0;
    this.g = 0;
    this.b = 0;
  }
};

// convert to #XXXXXX format.
Color.prototype.toHex = function() {
  this.hex = "#" + Util.toHex(this.r) +  Util.toHex(this.g) +  Util.toHex(this.b);
  return this.hex;
};

// compute r,g,b values.
Color.prototype.hexToRGB = function() {
  if (this.hex.charAt(0) == "#") {
    this.hex = this.hex.substring(1, 7);
  }
  var color = {};

  this.r = parseInt(this.hex.substring(0,2),16);
  this.g = parseInt(this.hex.substring(2,4),16);
  this.b = parseInt(this.hex.substring(4,6),16);

  return this;
};

Color.prototype.darker = function(offset) {
  var hsb = ColorUtil.RGBToHSB(this.hex);
  hsb.b -= offset;
  if (hsb.b < 0) {
    hsb.b = 0;
  }
  return ColorUtil.HSBToRGB(hsb.h, hsb.s, hsb.b);
};

Color.prototype.lighter = function(offset) {
  var hsb = ColorUtil.RGBToHSB(this.hex);
  hsb.b += offset;
  if (hsb.b > 1) {
    hsb.b = 1;
  }
  return ColorUtil.HSBToRGB(hsb.h, hsb.s, hsb.b);
};

Color.prototype.lighten = function(b) {
  var hsb = ColorUtil.RGBToHSB(this.hex);
  hsb.b = b;
  return ColorUtil.HSBToRGB(hsb.h, hsb.s, hsb.b);
}

Color.prototype.saturate= function() {
  var hsb = ColorUtil.RGBToHSB(this.hex);
  hsb.s = 0;
  hsb.b = 0.85;
  return ColorUtil.HSBToRGB(hsb.h, hsb.s, hsb.b);
}
ColorRange = function(c1, c2, total) {
  this.start = new Color(c1);
  this.end   = new Color(c2);
  this.index = 0;
  
  this.inbetween = total - 2;
  this.colors = [];
  if (total != undefined) {
    this.computeColors(total);
  } 
};

ColorRange.prototype.computeColors = function(total) {
  this.inbetween = total - 2;
  
  this.colors.push(this.start.toHex());

  var inc = 1 / (this.inbetween + 1);
  for (var i = 1; i <= this.inbetween; i++) {
    var fraction = i * inc;
    this.colors.push(ColorUtil.lerpColor(this.start, this.end, fraction).toHex());
  }

  this.colors.push(this.end.toHex());
};

ColorRange.prototype.reset = function() {
  this.index = 0;
};

ColorRange.prototype.next = function() {
  if (this.index >= this.colors.length) {
    this.index = 0;
  }
  return this.colors[this.index++];
};

ColorRange.prototype.first = function() {
  return this.colors[0];
};

ColorUtil = function() {};

ColorUtil.lerpColor = function(color1, color2, fraction) {
  
  var newColor = new Color();
  newColor.r = Math.ceil(Util.lerp(color1.r, color2.r, fraction));
  newColor.g = Math.ceil(Util.lerp(color1.g, color2.g, fraction));
  newColor.b = Math.ceil(Util.lerp(color1.b, color2.b, fraction));
  
  return newColor;
};

// Reused from: http://www.mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
ColorUtil.RGBToHSB = function(color) {
  
  color = new Color(color);
  var r = color.r;
  var g = color.g;
  var b = color.b;
  
  
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h : h, s : s, b : l };
};

// Reused from: http://www.mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
ColorUtil.HSBToRGB = function(h, s, l) {
  
  var r, g, b;

  if(s == 0){
      r = g = b = l; // achromatic
  } else {
    
      function hue2rgb(p, q, t){
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }
    
  var color = "#" + Util.toHex(parseInt(r * 255)) + Util.toHex(parseInt(g * 255)) + Util.toHex(parseInt(b * 255));
  return color;

};




