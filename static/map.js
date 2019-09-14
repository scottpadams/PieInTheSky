var startDate = new Date();
startDate.setUTCHours(0, 0, 0, 0);

var map = L.map('map', {
    zoom: 14,
    fullscreenControl: true,
    center: [39.3, 4]
});

// start of TimeDimension manual instantiation
var timeDimension = new L.TimeDimension({
        period: "PT5M",
    });
// helper to share the timeDimension object between all layers
map.timeDimension = timeDimension; 
// otherwise you have to set the 'timeDimension' option on all layers.

var player        = new L.TimeDimension.Player({
    transitionTime: 100, 
    loop: false,
    startOver:true
}, timeDimension);

var timeDimensionControlOptions = {
    player:        player,
    timeDimension: timeDimension,
    position:      'bottomleft',
    autoPlay:      true,
    minSpeed:      1,
    speedStep:     0.5,
    maxSpeed:      15,
    timeSliderDragUpdate: true,
    speedSlider: false,
};

var timeDimensionControl = new L.Control.TimeDimension(timeDimensionControlOptions);
map.addControl(timeDimensionControl);

var icon = L.icon({
    iconUrl: 'static/img/running.png',
    iconSize: [22, 22],
    iconAnchor: [5, 25]
});

var customLayer = L.geoJson(null, {
    pointToLayer: function (feature, latLng) {
        if (feature.properties.hasOwnProperty('last')) {
            return new L.Marker(latLng, {
                icon: icon
            });
        }
        return L.circleMarker(latLng);
    }
});

var gpxLayer = omnivore.gpx('static/data/tracking_points.gpx', null, customLayer).on('ready', function() {
    map.fitBounds(gpxLayer.getBounds(), {
        paddingBottomRight: [40, 40]
    });
});

var gpxTimeLayer = L.timeDimension.layer.geoJson(gpxLayer, {
    updateTimeDimension: true,
    addlastPoint: true,
    waitForReady: true
});

var kmlLayer = omnivore.kml('static/data/easy_currents_track.kml');
var kmlTimeLayer = L.timeDimension.layer.geoJson(kmlLayer, {
    updateTimeDimension: true,
    addlastPoint: true,
    waitForReady: true
});

var overlayMaps = {
    "GPX Layer": gpxTimeLayer,
    "KML Layer": kmlTimeLayer
};

var videoUrls = [
    //'http://118.243.204.173/cgi-bin/faststream.jpg?stream=half&fps=15&rand=COUNTER' // Doesn't work
    //'https://www.mapbox.com/bites/00188/patricia_nasa.mp4',
    'static/2019-09-11-22-56-51.mp4',
    //'video.mp4',
    
];

var bounds = L.latLngBounds([[ 39.793161, -86.237917], [ 39.798796, -86.226811]]);

var videoOverlay = L.videoOverlay( videoUrls, bounds, {
    opacity: 0.8
}).addTo(map);


videoOverlay.on('load', function () {
    var MyPauseControl = L.Control.extend({
        onAdd: function() {
            var button = L.DomUtil.create('button');
            button.innerHTML = '⏸';
            L.DomEvent.on(button, 'click', function () {
                videoOverlay.getElement().pause();
            });
            return button;
        }
    });
    var MyPlayControl = L.Control.extend({
        onAdd: function() {
            var button = L.DomUtil.create('button');
            button.innerHTML = '⏵';
            L.DomEvent.on(button, 'click', function () {
                videoOverlay.getElement().play();
                videoOverlay.getElement().currentTime = 10;
            });
            return button;
        }
    });

    var pauseControl = (new MyPauseControl()).addTo(map);
    var playControl = (new MyPlayControl()).addTo(map);
});

// var videoOverlay = L.videoOverlay( ['static/video.mp4'], bounds, {  //http://192.168.1.24:8000/stream.mjpg
//     opacity: 0.8
// });//.addTo(map);


var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});

var openStreetMapMapnikLayer = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// var bathymetryLayer = L.tileLayer.wms("http://ows.emodnet-bathymetry.eu/wms", {
//     layers: 'emodnet:mean_atlas_land',
//     format: 'image/png',
//     transparent: true,
//     attribution: "EMODnet Bathymetry",
//     opacity: 0.8
// });
// var coastlinesLayer = L.tileLayer.wms("http://ows.emodnet-bathymetry.eu/wms", {
//     layers: 'coastlines',
//     format: 'image/png',
//     transparent: true,
//     attribution: "EMODnet Bathymetry",
//     opacity: 0.8
// });
var bathymetryGroupLayer = L.layerGroup([openStreetMapMapnikLayer]);
bathymetryGroupLayer.addTo(map);
var baseLayers = {
    "EMODnet Bathymetry": bathymetryGroupLayer,
    "OSM": osmLayer
};


//var baseLayers = getCommonBaseLayers(map); // see baselayers.js
L.control.layers(baseLayers, overlayMaps).addTo(map);
gpxTimeLayer.addTo(map);
