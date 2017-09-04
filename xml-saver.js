/*
  globals
    Blob
    saveAs
    FileReader
    satellite
 */

var elsetInput;
var satInfoArray = [];
var looksArray = [];
var posneg = [];
var NUM_SATS;
var TAU = 2 * Math.PI;            // PI * 2 -- This makes understanding the formulas easier
var RADIUS_OF_EARTH = 6371;       // Radius of Earth in kilometers
var RAD2DEG = 360 / TAU;          // Used to convert radians to degrees
var DEG2RAD = TAU / 360;          // Used to convert degrees to radians
var MINUTES_PER_DAY = 1440;

var latitude, longitude, height, obsminaz, obsmaxaz, obsminel, obsmaxel, obsminrange, obsmaxrange, deg2rad;
// var tempLat, tempLon, tempHei, tempMinaz, tempMaxaz, tempMinel, tempMaxel, tempMinrange, tempMaxrange;

var observerGd = {};

function pad (str, max) {
  return str.length < max ? pad('0' + str, max) : str;
}

function openFile (event) {
  var input = event.target;

  var reader = new FileReader();
  reader.onload = function () {
    elsetInput = reader.result;
    parseElsetInput();
    makeXML();
    var node = document.getElementById('output');
    node.innerText = JSON.stringify(satInfoArray);
    node.innerHTML += '<br><br>';
    node.innerText += JSON.stringify(looksArray);
  };
  reader.readAsText(input.files[0]);
}

function parseElsetInput () {
  var posnegList = document.getElementById('posnegList');
  posnegList = posnegList.value;
  posneg = posnegList.split(',');

  elsetInput = elsetInput.split('\n');
  var filteredElsets = [];
  for (var i = 0; i < elsetInput.length / 2; i++) {
    var tle1 = elsetInput[i * 2];
    var scc = pad(tle1.substr(2, 5).trim(), 5);
    for (var s = 0; s < posneg.length; s++) {
      if (scc === posneg[s]) {
        filteredElsets.push(elsetInput[i * 2]);
        filteredElsets.push(elsetInput[i * 2 + 1]);
      }
    }
  }
  NUM_SATS = filteredElsets.length / 2;

  (function parseSatInfo () {
    for (var i = 0; i < NUM_SATS; i++) {
      var tle1 = filteredElsets[i * 2];
      var tle2 = filteredElsets[i * 2 + 1];
      var scc = pad(tle1.substr(2, 5).trim(), 5);
      var elsetNum = tle1.substr(64, 4).trim();

      var satrec = satellite.twoline2satrec( // perform and store sat init calcs
                  tle1, tle2);
      var inclination = satrec.inclo * RAD2DEG;
      var eccentricity = satrec.ecco;
      var meanMotion = satrec.no * 60 * 24 / TAU; // convert rads/minute to rev/day
      var semiMajorAxis = Math.pow(8681663.653 / meanMotion, (2 / 3));
      var apogee = semiMajorAxis * (1 + eccentricity) - RADIUS_OF_EARTH;
      var perigee = semiMajorAxis * (1 - eccentricity) - RADIUS_OF_EARTH;
      var period = MINUTES_PER_DAY / meanMotion;

      satInfoArray.push({
        satno: scc,
        inc: inclination,
        e: eccentricity,
        meanmo: meanMotion,
        apogee: apogee,
        perigee: perigee,
        period: period,
        elset: elsetNum});
    }
    satInfoArray.sort(function (a, b) { return a.satno - b.satno; });
    // console.log(satInfoArray);
  })();

  (function parseLooks () {
    for (var i = 0; i < NUM_SATS; i++) {
      var tle1 = filteredElsets[i * 2];
      var tle2 = filteredElsets[i * 2 + 1];
      getlookangles(tle1, tle2);
    }
    looksArray.sort(function (a, b) { return a.time - b.time; });
    // console.log(looksArray);
  })();
}

function makeXML () {
  var xml = document.createElement('xml');

  (function satInfoXML () {
    var satinfo = document.createElement('satinfo');
    for (var i = 0; i < satInfoArray.length; i++) {
      var sat = document.createElement('sat');

      var satno = document.createElement('satno');
      var satnoText = document.createTextNode(satInfoArray[i].satno);
      satno.appendChild(satnoText);

      var inc = document.createElement('inc');
      var incText = document.createTextNode(satInfoArray[i].inc);
      inc.appendChild(incText);

      var e = document.createElement('e');
      var eText = document.createTextNode(satInfoArray[i].e);
      e.appendChild(eText);

      var apogee = document.createElement('apogee');
      var apogeeText = document.createTextNode(satInfoArray[i].apogee);
      apogee.appendChild(apogeeText);

      var perigee = document.createElement('perigee');
      var perigeeText = document.createTextNode(satInfoArray[i].perigee);
      perigee.appendChild(perigeeText);

      var meanmo = document.createElement('meanmo');
      var meanmoText = document.createTextNode(satInfoArray[i].meanmo);
      meanmo.appendChild(meanmoText);

      var period = document.createElement('period');
      var periodText = document.createTextNode(satInfoArray[i].period);
      period.appendChild(periodText);

      var elset = document.createElement('elset');
      var elsetText = document.createTextNode(satInfoArray[i].elset);
      elset.appendChild(elsetText);

      sat.appendChild(satno);
      sat.appendChild(inc);
      sat.appendChild(e);
      sat.appendChild(apogee);
      sat.appendChild(perigee);
      sat.appendChild(meanmo);
      sat.appendChild(period);
      sat.appendChild(elset);
      satinfo.appendChild(sat);
    }
    xml.appendChild(satinfo);
  })();

  (function looksXML () {
    var looks = document.createElement('looks');
    for (var i = 0; i < looksArray.length; i++) {
      var pass = document.createElement('pass');

      var time = document.createElement('time');
      var timeText = document.createTextNode(looksArray[i].time);
      time.appendChild(timeText);

      var unix = document.createElement('unix');
      var unixText = document.createTextNode(looksArray[i].unix);
      unix.appendChild(unixText);

      var az = document.createElement('az');
      var azText = document.createTextNode(looksArray[i].az);
      az.appendChild(azText);

      var el = document.createElement('el');
      var elText = document.createTextNode(looksArray[i].el);
      el.appendChild(elText);

      var rng = document.createElement('rng');
      var rngText = document.createTextNode(looksArray[i].rng);
      rng.appendChild(rngText);

      var rise = document.createElement('rise');
      var riseText = document.createTextNode(looksArray[i].rise);
      rise.appendChild(riseText);
      pass.appendChild(time);
      pass.appendChild(unix);
      pass.appendChild(az);
      pass.appendChild(el);
      pass.appendChild(rng);
      pass.appendChild(rise);
      looks.appendChild(pass);
    }
    xml.appendChild(looks);
  })();

  var blob = new Blob([xml.innerHTML], {type: 'text/plain;charset=utf-8'});
  var today = new Date();
  var year = today.getUTCFullYear();
  var start = new Date(today.getFullYear(), 0, 0);
  var diff = today - start;
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);
  var hour = today.getUTCHours();
  saveAs(blob, 'SatLooks_' + year.toString() + '_' + day.toString() + '_' + hour.toString() + '.txt');
}

function getlookangles (tle1, tle2) {
  var sensor = document.getElementById('selectSensor');
  sensor = parseInt(sensor.options[sensor.selectedIndex].value);
  setSensor(sensor);
  // Set default timing settings. These will be changed to find look angles at different times in future.
  var propTempOffset = 0;               // offset letting us propagate in the future (or past)
  // var propRealTime = Date.now();      // Set current time

  var satrec = satellite.twoline2satrec(tle1, tle2);// perform and store sat init calcs
  satrec.scc = pad(tle1.substr(2, 5).trim(), 5);
  var lookanglesInterval = 5;
  var tblLength = 0;

  for (var i = 0; i < (2 * 24 * 60 * 60); i += lookanglesInterval) {         // 2 days of looks
    propTempOffset = i * 1000 + 0;                 // Offset in seconds (msec * 1000)
    if (tblLength >= 1500) {                           // Maximum of 1500 lines in the look angles table
      break;                                            // No more updates to the table (Prevent GEO object slowdown)
    }
    tblLength += propagate(propTempOffset, satrec, true);   // Update the table with looks for this 5 second chunk and then increase table counter by 1
  }
  function propagate (curPropOffset, satrec, isRiseSetLookangles) {
    var now = propTime(curPropOffset, Date.now());
    var scc = satrec.scc;
    isRiseSetLookangles = isRiseSetLookangles || true;
    var j = jday(now.getUTCFullYear(),
    now.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
    j += now.getUTCMilliseconds() * 1.15741e-8; // days per millisecond
    var gmst = satellite.gstime_from_jday(j);

    var m = (j - satrec.jdsatepoch) * MINUTES_PER_DAY; // 1440 = minutes_per_day
    var pv = satellite.sgp4(satrec, m);
    var positionEcf, lookAngles, azimuth, elevation, rangeSat;

    positionEcf = satellite.eci_to_ecf(pv.position, gmst); // pv.position is called positionEci originally
    lookAngles = satellite.ecf_to_look_angles(observerGd, positionEcf);
    azimuth = lookAngles.azimuth / deg2rad;
    elevation = lookAngles.elevation / deg2rad;
    rangeSat = lookAngles.range_sat;

    if (obsminaz < obsmaxaz) {
      if (!((azimuth >= obsminaz && azimuth <= obsmaxaz) && (elevation >= obsminel && elevation <= obsmaxel) && (rangeSat <= obsmaxrange && rangeSat >= obsminrange))) {
        return 0;
      }
    }
    if ((azimuth >= obsminaz || azimuth <= obsmaxaz) && (elevation >= obsminel && elevation <= obsmaxel) && (rangeSat <= obsmaxrange && rangeSat >= obsminrange)) {
      if (isRiseSetLookangles) {
        // Previous Pass to Calculate first line of coverage
        var now1 = propTime(0 - (5 * 1000), now); // 5 second looks
        var j1 = jday(now1.getUTCFullYear(),
        now1.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
        now1.getUTCDate(),
        now1.getUTCHours(),
        now1.getUTCMinutes(),
        now1.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
        j1 += now1.getUTCMilliseconds() * 1.15741e-8; // days per millisecond
        var gmst1 = satellite.gstime_from_jday(j1);

        var m1 = (j1 - satrec.jdsatepoch) * MINUTES_PER_DAY; // 1440 = minutes_per_day
        var pv1 = satellite.sgp4(satrec, m1);
        var positionEcf1, lookAngles1, azimuth1, elevation1, rangeSat1;

        positionEcf1 = satellite.eci_to_ecf(pv1.position, gmst1); // pv.position is called positionEci originally
        lookAngles1 = satellite.ecf_to_look_angles(observerGd, positionEcf1);
        azimuth1 = lookAngles1.azimuth / deg2rad;
        elevation1 = lookAngles1.elevation / deg2rad;
        rangeSat1 = lookAngles1.range_sat;
        if (!((azimuth1 >= obsminaz || azimuth1 <= obsmaxaz) && (elevation1 >= obsminel && elevation1 <= obsmaxel) && (rangeSat1 <= obsmaxrange && rangeSat1 >= obsminrange))) {
          looksArray.push({
            scc: scc,
            time: now.toISOString(),
            unix: new Date(now).getTime() / 1000,
            az: azimuth.toFixed(0),
            el: elevation.toFixed(1),
            rng: rangeSat.toFixed(0),
            rise: 0});
          return 1;
        } else {
          // Next Pass to Calculate Last line of coverage
          now1 = propTime(0 + (5 * 1000), now); // 5 second looks
          j1 = jday(now1.getUTCFullYear(),
          now1.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
          now1.getUTCDate(),
          now1.getUTCHours(),
          now1.getUTCMinutes(),
          now1.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
          j1 += now1.getUTCMilliseconds() * 1.15741e-8; // days per millisecond
          gmst1 = satellite.gstime_from_jday(j1);

          m1 = (j1 - satrec.jdsatepoch) * MINUTES_PER_DAY; // 1440 = minutes_per_day
          pv1 = satellite.sgp4(satrec, m1);

          positionEcf1 = satellite.eci_to_ecf(pv1.position, gmst1); // pv.position is called positionEci originally
          lookAngles1 = satellite.ecf_to_look_angles(observerGd, positionEcf1);
          azimuth1 = lookAngles1.azimuth / DEG2RAD;
          elevation1 = lookAngles1.elevation / DEG2RAD;
          rangeSat1 = lookAngles1.range_sat;
          if (!((azimuth1 >= obsminaz || azimuth1 <= obsmaxaz) && (elevation1 >= obsminel && elevation1 <= obsmaxel) && (rangeSat1 <= obsmaxrange && rangeSat1 >= obsminrange))) {
            looksArray.push({
              scc: scc,
              time: now.toISOString(),
              unix: new Date(now).getTime() / 1000,
              az: azimuth.toFixed(0),
              el: elevation.toFixed(1),
              rng: rangeSat.toFixed(0),
              rise: 1});
            return 1;
          }
        }
        return 0;
      }
    }
    return 0;
  }
  function propTime (propOffset2, propRealTime) {
    'use strict';                                             // May be unnescessary but doesn't hurt anything atm.
    var now = new Date();                                     // Make a time variable
    now.setTime(Number(propRealTime) + propOffset2);           // Set the time variable to the time in the future
    return now;
  }
  function setSensor (sensor) {
    switch (sensor) {
      case 0:// Cod
        setobs({
          lat: 41.754785,
          long: -70.539151,
          hei: 0.060966,
          obsminaz: 347,
          obsmaxaz: 227,
          obsminel: 3,
          obsmaxel: 85,
          obsminrange: 200,
          obsmaxrange: 5555
        });
        break;
      case 1:// Clear
        setobs({
          lat: 64.290556,
          long: -149.186944,
          hei: 0.060966,
          obsminaz: 184,
          obsmaxaz: 64,
          obsminel: 3,
          obsmaxel: 85,
          obsminrange: 200,
          obsmaxrange: 4910
        });
        break;
      case 2:// Beale
        setobs({
          lat: 39.136064,
          long: -121.351237,
          hei: 0.060966, // TODO: Find correct height
          obsminaz: 126,
          obsmaxaz: 6,
          obsminel: 3,
          obsmaxel: 85,
          obsminrange: 200,
          obsmaxrange: 5555
        });
        break;
      case 3:// Cavalier
        setobs({
          lat: 48.724567,
          long: -97.899755,
          hei: 0.060966, // TODO: Find correct height
          obsminaz: 298,
          obsmaxaz: 78,
          obsminel: 1.9,
          obsmaxel: 95,
          obsminrange: 200,
          obsmaxrange: 3300 // TODO: Double check this
        });
        break;
      case 4:// Fylingdales
        setobs({
          lat: 54.361758,
          long: -0.670051,
          hei: 0.060966, // TODO: Find correct height
          obsminaz: 0,
          obsmaxaz: 360,
          obsminel: 3,
          obsmaxel: 85,
          obsminrange: 200,
          obsmaxrange: 4820
        });
        break;
      case 5:// Eglin
        setobs({
          lat: 30.572411,
          long: -86.214836,
          hei: 0.060966, // TODO: Confirm Altitude
          obsminaz: 120,
          obsmaxaz: 240,
          obsminel: 3,
          obsmaxel: 105,
          obsminrange: 200,
          obsmaxrange: 50000
        });
        break;
      case 6:// Thule
        setobs({
          lat: 76.570322,
          long: -68.299211,
          hei: 0.060966, // TODO: Find correct height
          obsminaz: 297,
          obsmaxaz: 177,
          obsminel: 3,
          obsmaxel: 85,
          obsminrange: 200,
          obsmaxrange: 5555
        });
        break;
      case 7:// Millstone
        setobs({
          lat: 42.6233,
          long: -71.4882,
          hei: 0.131,
          obsminaz: 0,
          obsmaxaz: 360,
          obsminel: 1,
          obsmaxel: 90,
          obsminrange: 200,
          obsmaxrange: 50000
        });
        break;
      case 8:// ALTAIR
        setobs({
          lat: 8.716667,
          long: 167.733333,
          hei: 0,
          obsminaz: 0,
          obsmaxaz: 360,
          obsminel: 1,
          obsmaxel: 90,
          obsminrange: 200,
          obsmaxrange: 50000
        });
        break;
    }
    observerGd = {                        // Array to calculate look angles in propagate()
      longitude: longitude * deg2rad,
      latitude: latitude * deg2rad,
      height: height * 1                  // Converts from string to number TODO: Find correct way to convert string to integer
    };
  }
  function setobs (obs) {
    // Set the Observer Location and variable to convert to RADIANS TODO: Change these to variables received in a method call.
    latitude = obs.lat;                   // Observer Lattitude - use Google Maps
    longitude = obs.long;                 // Observer Longitude - use Google Maps
    height = obs.hei;                     // Observer Height in Km
    obsminaz = obs.obsminaz;              // Observer min azimuth (satellite azimuth must be greater) left extent looking towards target
    obsmaxaz = obs.obsmaxaz;              // Observer max azimuth (satellite azimuth must be smaller) right extent looking towards target
    obsminel = obs.obsminel;              // Observer min elevation
    obsmaxel = obs.obsmaxel;              // Observer max elevation TODO: Determine if radars with 105deg elevation work correctly
    obsminrange = obs.obsminrange;        // Observer min range TODO: Determine how to calculate min range with transmit cycle information
    obsmaxrange = obs.obsmaxrange;        // Observer max range TODO: Determine how to calculate max range with transmit cycle information
    deg2rad = 0.017453292519943295;       // (angle / 180) * Math.PI --- Divide by deg2rad to get rad2deg
    observerGd = {                        // Array to calculate look angles in propagate()
      longitude: longitude * DEG2RAD,
      latitude: latitude * DEG2RAD,
      height: height * 1                  // Converts from string to number TODO: Find correct way to convert string to integer
    };
  }
  function jday (year, mon, day, hr, minute, sec) { // from satellite.js
    'use strict';
    return (367.0 * year -
      Math.floor((7 * (year + Math.floor((mon + 9) / 12.0))) * 0.25) +
      Math.floor(275 * mon / 9.0) +
      day + 1721013.5 +
      ((sec / 60.0 + minute) / 60.0 + hr) / 24.0  //  ut in days
    );
  }
}
