var mapboxgl = require('mapbox-gl');
var d3 = require('d3');

// MAP OPTIONS
var options = {
  container: "map",
  hash: true,
  style:'./style/oud_svbp.json',
  zoom: 10,
  pitch: 0,
  bearing: 0,
  center: [5.16199, 52.16],
  attributionControl: false
};

// INITIALIZE MAP
var map = new mapboxgl.Map(options);

// // MAP ATTRIBUTE CONTROLL
// var att = new mapboxgl.AttributionControl();
// att._updateAttributions = function(){
//   this._container.innerHTML = "&copy; <a href=\'http://webmapper.net\' target=\'_blank\'>Webmapper</a> | <a href=\'http://www.mapbox.com\' target=\'_blank\'>Mapbox</a>"
// };
// map.addControl(att, 'bottom-left');

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
map.on("mousemove", "perceel", function (e) {
  // panel.innerHTML = e.features[0].properties.name;
  // console.log(e)
  map.setFilter("perceel-select", ["==", "perceelnummer", e.features[0].properties.perceelnummer]);
});

// Reset the state-fills-hover layer's filter when the mouse leaves the layer.
map.on("mouseleave", "perceel", function () {
  map.setFilter("perceel-select", ["==", "perceelnummer", ""]);
});


map.on('click', 'perceel', function (e) {
  // console.log(e)
  var coordinates = e.features[0].geometry.coordinates.slice();
  var description = e.features[0].properties.waarde;
  var perceel = e.features[0].properties.perceelnummer;
  var sectie = e.features[0].properties.sectie;

  // Ensure that if the map is zoomed out such that multiple
  // copies of the feature are visible, the popup appears
  // over the copy being pointed to.
  // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
  //   coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  // }

  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML("waarde:  "+ description + "</br>" + "perceel nummer:  "+ perceel + "</br>" + "sectie:  " + sectie)
    .addTo(map);
});

// ================================//
// 3D!  
var status = '';
// 3D layers!!!
var drieD = d3.select('body');
drieD.on("keypress", function(){
  if(d3.event.key == 3 && status == ''){
    status = '3d';
    goDrieD();
  } else if (d3.event.key == 3 && status == '3d'){
    status = '';
    goFlat();
  }
});

function goDrieD(){
  map.setPaintProperty('pand', 'fill-extrusion-height', 15);
  map.setPaintProperty('pand', 'fill-extrusion-opacity', 0.8);
};

function goFlat(){
  map.setPaintProperty('pand', 'fill-extrusion-height', 0);
  map.setPaintProperty('pand', 'fill-extrusion-opacity', 1);
};