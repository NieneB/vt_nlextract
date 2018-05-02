var mapboxgl = require('mapbox-gl');
var d3 = require('d3');
var typeahead = require('typeahead.js');
var Bloodhound = require('bloodhound-js');
var $ = require('jquery');

// MAP OPTIONS
var options = {
  container: "map",
  hash: true,
  style:'./style/style.json',
  zoom: 15,
  pitch: 0,
  bearing: 0,
  center: [5.16199, 52.16],
  attributionControl: false
};

// INITIALIZE MAP
var map = new mapboxgl.Map(options);

// MAP ATTRIBUTE CONTROLL
var att = new mapboxgl.AttributionControl();
att._updateAttributions = function(){
  this._container.innerHTML = "&copy; <a href=\'http://webmapper.net\' target=\'_blank\'>Webmapper</a> | <a href=\'http://www.mapbox.com\' target=\'_blank\'>Mapbox</a>"
};
map.addControl(att, 'bottom-left');

document.addEventListener('touchmove', function(event) {
  event.preventDefault();
}, false);

// NO CONTROLS WHEN PHONE!
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  document.getElementById('search_bar').style.left = '10px';
  // MAP TOUCH EVENT
  map.touchZoomRotate.enable();
  map.touchZoomRotate.enable({ around: 'center' });
  map.touchZoomRotate.enableRotation();
} else { 
  map.addControl(new mapboxgl.NavigationControl(), 'top-left'); 
  // MAP MOUSE EVENT
  map.scrollZoom.enable();
  map.scrollZoom.enable({ around: 'center' })
  map.dragPan.enable();
  map.dragRotate.enable();
  map.doubleClickZoom.enable();
};

// Debugging mode:
// map.showTileBoundaries = true;
// map.showCollisionBoxes = true;
// map.repaint = false;


// LOADER
var loader = d3.selectAll('.loader');
// Timer check if map.style is loaded or not:
function isloaded(){
  var id = setInterval(frame, 40);
  function frame() {
    if (map.loaded()){
      loader.style("display","none");
    }else{
      loader.style("display" , "block");
    }
  };
};
isloaded();

// POSTCODE highlight
//Adding hover effect
map.on("click", "perceel", function (e) {
  // panel.innerHTML = e.features[0].properties.name;
  // console.log(e)
  map.setFilter("perceel-select", ["==", "perceelnummer", e.features[0].properties.perceelnummer]);
});

map.on('click', 'perceel', function (e) {
  // console.log(e)
  var coordinates = e.features[0].geometry.coordinates.slice();
  var description = e.features[0].properties.waarde;
  var perceel = e.features[0].properties.perceelnummer;
  var sectie = e.features[0].properties.sectie;

  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML("waarde:  "+ description + "</br>" + "perceel nummer:  "+ perceel + "</br>" + "sectie:  " + sectie)
    .addTo(map);
});



// SEARCH BAR
var searchdata = {};
function enableTypeahead() {
  $('#ttinput .typeahead').typeahead({
    hint: false,
    highlight: true,
    minLength: 2
  },
    {
      name: 'PDOK',
      displayKey: 'value',
      display: 'value',
      limit: 5,
      source: searchdata.bloodhoundengine,
      templates: {
        empty: [
          "<div class='noitems'>",
          'Niets gevonden',
          '</div>'
        ].join('\n')
      }
    });
};

var searchInputListeners = function () {
  $('#ttinput .typeahead').on('typeahead:select', function (ev, suggestion) {
    getCoordinates(suggestion);
  });
  $('#ttinput .typeahead').on('typeahead:autocomplete', function (ev, suggestion) {
    getCoordinates(suggestion);
  });
};
// SUGGESTION API
function enableBloodhound() {
  searchdata.bloodhoundengine = new Bloodhound({
    datumTokenizer: function (d) { return Bloodhound.tokenizers.whitespace(d.value); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
      url: 'https://geodata.nationaalgeoregister.nl/locatieserver/suggest?rows=10&fq=type:woonplaats&q=%QUERY',
      wildcard: '%QUERY',
      transform: function (response) {
        return $.map(response.response.docs, function (item) {
          return {
            value: item.weergavenaam,
            id: item.id
          };
        });
      }
    }
  });
  searchdata.bloodhoundengine.initialize();
};

// GET COORDINATES OF CHOSEN LOCATION API
function getCoordinates(suggestion) {
  var plaats = suggestion.id;
  var url = 'https://geodata.nationaalgeoregister.nl/locatieserver/lookup?wt=json&id=' + plaats;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var myArr = JSON.parse(this.responseText);
      getTarget(myArr);
    }
  };
  xmlhttp.open('GET', url, true);
  xmlhttp.send();
};

// GET TARGET
function getTarget(plaats) {
  var target = [];
  var locatieString = plaats.response.docs[0].centroide_ll;
  target.push(Number(locatieString.substring(6, 16)), Number(locatieString.substring(17, locatieString.length - 1)));
  recenterMap(target);
};

// RECENTER MAP ON CHOSEN LOCATION
function recenterMap(target) {
  map.jumpTo({
    center: target,
    zoom: 15.5,
    speed: 1,
    minZoom: 15
  });
};

// START SEARCH
function initSearch() {
  enableBloodhound();
  enableTypeahead();
  searchInputListeners();
};
initSearch();