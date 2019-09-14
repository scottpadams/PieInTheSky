var intervalRewind;
var socket = io.connect("127.0.0.1" + ':' + "5000");
var time;
var dataArray = [];
var startDate = new Date();
startDate.setUTCHours(0, 0, 0, 0);

var map = L.map('map', {
    zoom: 14,
    fullscreenControl: true,
    center: [39.3, 4]
});

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
    draw: {
        polygon: false,
        polyline: false,
        circle: false,
        marker: false,
        circlemarker: false
    },
    edit: {
        featureGroup: drawnItems
    }
});
map.addControl(drawControl);

map.on('draw:created', function (e) {
    var type = e.layerType,
        layer = e.layer;
    drawnItems.addLayer(layer);
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
    speedSlider: true,
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
    //'http://10.34.240.169:8000/stream.mjpg',
    'static/video/bomber.mp4',
    
];

var bounds = L.latLngBounds([[ 39.79622751241632, -86.2398540974482], [ 39.795811639766534 , -86.23946517697733]]);


var videoOverlay = L.videoOverlay( videoUrls, bounds, {
    opacity: 0.6
}).addTo(map);

map.timeDimension.on('timeloading', function(e){ 
    
    videoOverlay._image.currentTime = e.target._currentTimeIndex;
    time = e.time;
    //console.log(e);
});

videoOverlay.on('load', function () {
    var MyRewindControl = L.Control.extend({
        onAdd: function() {
            var button = L.DomUtil.create('button');
            button.innerHTML = '<<';
            L.DomEvent.on(button, 'click', function () {
                rewind(3.0, videoOverlay.getElement());
            });
            return button;
        }
    });
    videoOverlay.getElement().pause();
    var MyPauseControl = L.Control.extend({
        onAdd: function() {
            var button = L.DomUtil.create('button');
            button.innerHTML = '⏸';
            L.DomEvent.on(button, 'click', function () {
                if (intervalRewind) {
                    clearInterval(intervalRewind);
                }
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
                if (intervalRewind) {
                    clearInterval(intervalRewind);
                }
                videoOverlay.getElement().playbackRate = 1.0;
                videoOverlay.getElement().play();
            });
            return button;
        }
    });

    var MyPlayFastControl = L.Control.extend({
        onAdd: function() {
            var button = L.DomUtil.create('button');
            button.innerHTML = '>>';
            L.DomEvent.on(button, 'click', function () {
                if (intervalRewind) {
                    clearInterval(intervalRewind);
                }
                socket.emit('start tracking', {data : "new data"});
                videoOverlay.getElement().playbackRate = 3.0;
                videoOverlay.getElement().play();
            });
            return button;
        }
    });

    var rewindControl = (new MyRewindControl()).addTo(map);
    var pauseControl = (new MyPauseControl()).addTo(map);
    var playControl = (new MyPlayControl()).addTo(map);
    var playControl = (new MyPlayFastControl()).addTo(map);
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

function mapFunc(e) {
    var mapWidth=map._container.offsetWidth;
    var mapHeight=map._container.offsetHeight;

    e.latlng.time = time;
    window.latlng = e.latlng;
    dataArray.push(e.latlng);
    console.log(e.latlng);
}

map.on('click', mapFunc);

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

function rewind(rewindSpeed, videoElement) {    
    clearInterval(intervalRewind);
    var startSystemTime = new Date().getTime();
    var startVideoTime = videoElement.currentTime;
    
    intervalRewind = setInterval(function(){
        videoElement.playbackRate = 1.0;
        if(videoElement.currentTime == 0){
            clearInterval(intervalRewind);
            videoElement.pause();
        } else {
            var elapsed = new Date().getTime()-startSystemTime;
            videoElement.currentTime = Math.max(startVideoTime - elapsed*rewindSpeed/1000.0, 0);
        }
    }, 30);
 }

 function geoToPixel(topLeftVideo, bottomRightVideo, topLeftSelection, bottomRightSelection) {
    var latitudeDifference = topLeftVideo.lat - bottomRightVideo.lat;
    var longitudeDifference = topLeftVideo.long - bottomRightVideo.long;

    /// TODO: Replace HORIZONTALMAXPIXELS and VERTICALMAXPIXELS with width and height of video respectively.
    var HORIZONTALMAXPIXELS = 4096;
    var VERTICALMAXPIXELS = 2160;

    var pixelCoordinates;
    pixelCoordinates.topLeft.x = (topLeftVideo.long - topLeftSelection.long) / (longitudeDifference / HORIZONTALMAXPIXELS);
    pixelCoordinates.topLeft.y = (topLeftVideo.lat - topLeftSelection.lat) / (latitudeDifference / VERTICALMAXPIXELS);
    pixelCoordinates.bottomRight.x = (bottomRightVideo.long - bottomRightSelection.long) / (longitudeDifference / HORIZONTALMAXPIXELS);
    pixelCoordinates.bottomRight.y = (bottomRightVideo.lat - bottomRightSelection.lat) / (latitudeDifference / VERTICALMAXPIXELS);

    return pixelCoordinates;
 }

 function pixelToGeo(topLeftVideo, bottomRightVideo, topLeftSelection, bottomRightSelection) {
    var latitudeDifference = topLeftVideo.lat - bottomRightVideo.lat;
    var longitudeDifference = topLeftVideo.long - bottomRightVideo.long;

    /// TODO: Replace HORIZONTALMAXPIXELS and VERTICALMAXPIXELS with width and height of video respectively.
    var HORIZONTALMAXPIXELS = 4096;
    var VERTICALMAXPIXELS = 2160;

    var geoCoordinates;
    geoCoordinates.topLeft.x = topLeftVideo.long + topLeftSelection.long * (longitudeDifference / HORIZONTALMAXPIXELS);
    geoCoordinates.topLeft.y = topLeftVideo.lat + topLeftSelection.lat * (latitudeDifference / VERTICALMAXPIXELS);
    geoCoordinates.bottomRight.x = bottomRightVideo.long + bottomRightSelection.long * (longitudeDifference / HORIZONTALMAXPIXELS);
    geoCoordinates.bottomRight.y = bottomRightVideo.lat + bottomRightSelection.lat * (latitudeDifference / VERTICALMAXPIXELS);

    return geoCoordinates;
 }