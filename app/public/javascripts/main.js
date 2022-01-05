var map = new L.Map("map", {center: [37.8, -96.9], zoom: 4})
    .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));
var svg = d3.select(map.getPanes().overlayPane).append("svg"),
g = svg.append("g").attr("class", "leaflet-zoom-hide");


function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}

d3.csv("data/Mass Shootings Dataset.csv", function(data){
    console.log(data);
    var transform = d3.geo.transform({point: projectPoint}),
    path = d3.geo.path().projection(transform);
});






// Resize SVG
var bounds = path.bounds(collection),
    topLeft = bounds[0],
    bottomRight = bounds[1];

svg.attr("width", bottomRight[0] - topLeft[0])
    .attr("height", bottomRight[1] - topLeft[1])
    .style("left", topLeft[0] + "px")
    .style("top", topLeft[1] + "px");

g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");