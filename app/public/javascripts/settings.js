var mapSize = d3.select("#map").node().getBoundingClientRect();
mapSize.height = mapSize.height - 150;

var timelineSize = d3.select("#timeline").node().getBoundingClientRect()
var timelineSettings = {
    width: timelineSize.width - 30,
    height: 60,
    minYears: new Date("2009"),
    maxYears: new Date("2017"),
    maxEvents: 0,
    maxDead: 0,
    maxInjured: 0,
};
timelineSettings.nbYears = timelineSettings.maxYears.getFullYear() - timelineSettings.minYears.getFullYear();
timelineSettings.barWidth = timelineSettings.width / timelineSettings.nbYears / 12;

var chartsSize = d3.select("#charts").node().getBoundingClientRect();

chartsSize.radius = 50;

chartsSize.innerRadius = 0;
chartsSize.outerRadius = 100;

let mentallys = ['unknown', 'yes', 'no', 'unclear'];
let races = ['white','black','asian','native'];
let dateRangeSaved = []