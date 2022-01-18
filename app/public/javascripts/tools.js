async function loadUsStates() {
    return await d3.json("data/us-states.json");
}

async function loadMassShootings() {
    let massShootings = await d3.csv("data/Mass Shootings Dataset.csv");
    
    let filteredMassShootings = [];

    massShootings.forEach(event => {
        if (event.Latitude == "" || event.Longitude == "") return;

        let date = new Date(event.Date.split("/")[2], event.Date.split("/")[0]-1);
        if(date < timelineSettings.minYears || date > timelineSettings.maxYears) return;   
    
        event.Date = new Date(event.Date);
        filteredMassShootings.push(event);
    });

    return filteredMassShootings;
}

async function computeStats(data) {
    let stats = {}
    data.forEach(event => {

        let date = new Date(event.Date.getFullYear(), event.Date.getMonth());
        
        if (stats[date] == undefined) {
            stats[date] = {
                date: date,
                Dead: 0,
                Injured: 0,
                Total: 0,
                Events: 0,
                height: 5
            };
        }

        stats[date].Events++;
        stats[date].Dead += parseInt(event.Fatalities);
        stats[date].Injured += parseInt(event.Injured);
        stats[date].Total += parseInt(event["Total victims"]);
        timelineSettings.maxEvents = stats[date].Events > timelineSettings.maxEvents ? stats[date].Events : timelineSettings.maxEvents;
        timelineSettings.maxDead = stats[date].Dead > timelineSettings.maxDead ? stats[date].Dead : timelineSettings.maxDead;
        timelineSettings.maxInjured = stats[date].Injured > timelineSettings.maxInjured ? stats[date].Dead : timelineSettings.maxInjured;
    });

    return stats;
}

function drawMap(usStates, massShootings) {
    let projection = d3.geoAlbersUsa()
    .translate([mapSize.width/2, mapSize.height/2])
    .scale([1000]);

    let path = d3.geoPath().projection(projection);

    let tooltip = d3.select("#tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")

    let map = d3.select("#map")

    map.selectAll("path")
        .data(usStates.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("stroke", "#fff")
        .style("stroke-width", "1")
        .style("fill", "rgb(213,222,217)")
        .on("mouseover", function (d, i) { 
            let state = d.properties.name;
            updateStats(dateRangeSaved, state);
        })
        .on("mouseout", function (d) { 
            updateStats(dateRangeSaved);
        })

    // draw events
    map.selectAll("circle")
    .data(massShootings)
    .enter()
    .append("circle")
    .attr("cx", (d) => projection([d.Longitude, d.Latitude])[0])
    .attr("cy", (d) => projection([d.Longitude, d.Latitude])[1])
    .attr("r", (d) => d.Fatalities)
    .attr("class", "points")
    .style("stroke", "#fff")
    .style("stroke-width", "1")
    .style("fill", "rgb(255,0,0)")
    .style("opacity", 0.4)
    .on("mouseover", function (d, i) {
        let box = this.getBoundingClientRect();

        d3.select(this)
        .attr("r", (d) => d["Total victims"])

        drawTip(d, box);
    })
    .on("mouseout", function (d) { 
        d3.select(this)
        .attr("r", (d) => d.Fatalities)
        tooltip.style("visibility", "hidden");
    })
    .on("click", function(d) {
        updateDetail(d);
    })
}

function drawTip(d, box) {
    let tip = `<div>
        <h3>${d.Location}</h3>
        <p>${d.Date.toLocaleDateString()}</p>
        <p>Fatalities: ${d.Fatalities}</p>
        <p>Injured: ${d.Injured}</p>
        <p>Total victims: ${d["Total victims"]}</p>
        <p class="info">click for details</p>
    </div>`;

    tooltip = d3.select("#tooltip")

    tooltip.html(tip)
    .style("top", box.top - this.height).style("left",box.left)
    .style("visibility", "visible")

    let bcr = tooltip.node().getBoundingClientRect();

    tooltip.style("top", box.top - bcr.height - 10)
    .style("left", box.left - bcr.width / 2)
    .style("visibility", "visible")
}

function generateTip(d) {
    let tip = `<div>
        <h3>${d.Location}</h3>
        <p>${d.Date.toLocaleDateString()}</p>
        <p>Fatalities: ${d.Fatalities}</p>
        <p>Injured: ${d.Injured}</p>
        <p>Total victims: ${d["Total victims"]}</p>
    </div>`;

    return tip;
}

function updateDetail(d) {
    let html = `
        <p id="det-title">${d.Title}</p>
        <p><span class="det-head">SUMMARY:</span> ${d.Summary}</p>
        <p><span class="det-head">DATE:</span> ${d.Date.toLocaleDateString()}</p>
        <p><span class="det-head">LOCATION:</span> ${d.Location}</p>
        <p><span class="det-head">FATALITIES:</span> ${d.Fatalities}</p>
        <p><span class="det-head">INJURED:</span> ${d.Injured}</p>
    `;
    d3.select("#details").html(html);
}

function drawTimeline(stats) {
    // draw timeline
    var timeline = d3.select("#timeline")
        .attr("width", timelineSettings.width)

    let context = timeline.append('g')
        .attr('class', 'context')
        .attr('transform', `translate(0, ${timelineSettings.height})`);
        
    let xScale = d3.scaleTime()
        .range([0, timelineSettings.width])
        .domain([timelineSettings.minYears, timelineSettings.maxYears]);
        
    let xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeYear, 1)
        .tickSizeOuter(0)
        .tickFormat(function(date){
        if (d3.timeYear(date) < date) {
            return d3.timeFormat('%b')(date);
        } else {
            return d3.timeFormat('%Y')(date);
        }
        });

    context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0,0)")
        .call(xAxis);

    // draw bars
    timeline.selectAll(".bar")
        .data(d3.entries(stats))
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => xScale(new Date(d.value.date)))
        .attr("y", (d, i) => timelineSettings.height - (timelineSettings.height * d.value.Events / timelineSettings.maxEvents))
        .attr("width", timelineSettings.barWidth)
        .attr("height", (d, i) => timelineSettings.height * d.value.Events / timelineSettings.maxEvents)
        .style("fill", "#ff0000")
        .style("opacity", 0.5)
}

function updateTimeline(type) {

    d3.select("#timeline").selectAll(".bar")
    .attr("y", (d, i) => timelineSettings.height - (timelineSettings.height * d.value[type] / timelineSettings["max" + type]))
    .attr("height", (d, i) => timelineSettings.height * d.value[type] / timelineSettings["max" + type])
}

function drawBrush() {
    let xScale = d3.scaleTime()
    .range([0, timelineSettings.width])
    .domain([timelineSettings.minYears, timelineSettings.maxYears]);

    let xBrush = d3.scaleTime()
    .range([0, timelineSettings.width])
    .domain(xScale.domain());

    let brush = d3.brushX(xBrush)
    .extent([[0, 0], [timelineSettings.width, timelineSettings.height]])
    .on('start end', () => {
        var selection = d3.event.selection;
        var dateRange = selection.map(xScale.invert, xScale);
        updateMap(dateRange)
        updateStats(dateRange)
    });

    //  Appending brush
    d3.select("#timeline").append('g')
    .call(brush)
    .call(brush.move, xScale.range())
    .selectAll('rect')
    .attr('y', 0)
}

function updateMap(dateRange) {
    d3.select("#map").selectAll("circle")
    .style("visibility", (d) => {
        if (d.Date > dateRange[0] && d.Date < dateRange[1]) {
            return "visible"
        } else {
            return "hidden"
        }
    })
}

function updateStats(dateRange, state=null) {

    d3.select("#charts").selectAll("*").remove();

    let circles = d3.select("#map").selectAll("circle")["_groups"][0];

    let stats = {
        nbShooting: 0,
        nbDead: 0,
        nbInjured: 0,
        mentally: [],
        race: []
    };
    let mentallysData = []
    let racesData = []
    circles.forEach(circle => {
        let data = circle.__data__;
        if (data.Date > dateRange[0] && data.Date < dateRange[1] && (state === null || data.Location.toLowerCase().indexOf(state.toLowerCase()) > -1)) {
            stats.nbShooting += 1;
            stats.nbDead += parseInt(data.Fatalities);
            stats.nbInjured += parseInt(data.Injured);

            mentallysData.push(data["Mental Health Issues"].toLowerCase())
            racesData.push(data["Race"].toLowerCase())
        }
    });

    if (stats.nbShooting === 0) {
        let html = `
        <p id="no-data">No data to display in selection</p>
    `;
        d3.select("#legend").html(html);
        return;
    };

    mentallys.forEach(d => {
        stats["mentally"][d] = mentallysData.filter(x => x==d).length;
    });

    races.forEach(d => {
        stats["race"][d] = racesData.filter(x => x.indexOf(d) != -1).length;
    });

    let html = `
        <p><span class="stat-head">Total Shootings:</span><span class="stat-body">${stats.nbShooting}</span></p>
        <p><span class="stat-head">Total Dead:</span><span class="stat-body">${stats.nbDead}</span></p>
        <p><span class="stat-head">Total Injured:</span><span class="stat-body">${stats.nbInjured}</span></p>
    `;
    d3.select("#legend").html(html);

    
    generatePieChart("MentallyChart", "Shooter mentally?", stats["mentally"])
    generatePieChart("RaceChart", "Race of shooter", stats["race"])

    dateRangeSaved = dateRange;
}

function generatePieChart(id, title, data) {

    for (key in data) {
        if (data[key] == 0) {
           delete data[key]
        }
    }

    let keys = Object.keys(data);
    let hasData = Object.values(data).some(x => x>0);
    
    let container = d3.select("#charts")
        .append("div")
        .attr("class", "chart")
        .html(`<p>${title}</p>`)

    var svg = container
    .append("svg")
    .attr("width", chartsSize.width/2)
    .attr("height", chartsSize.width)
    .append("g")
    .attr("transform", "translate(" + chartsSize.width/2 / 2 + "," + chartsSize.width/6  + ")")
    .attr("id", id)

    // set the color scale
    var color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeSet2);

    // Compute the position of each group on the pie:
    var pie = d3.pie()
    .value(function(d) {return d.value; })
    var data_ready = pie(d3.entries(data))

    // shape helper to build arcs:
    var arcGenerator = d3.arc()
    .innerRadius(chartsSize.innerRadius)         // This is the size of the donut hole
    .outerRadius(chartsSize.outerRadius)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
    .selectAll('whatever')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', function(d){ return(color(d.data.key)) })
    .attr("stroke", "black")
    .style("stroke-width", "2px")
    .style("opacity", 0.7)

    svg
    .selectAll('mySlices')
    .data(data_ready)
    .enter()
    .append('text')
    .text(function(d){ return d.data.value})
    .attr("transform", function(d) { return "translate(" + arcGenerator.centroid(d) + ")";  })
    .style("text-anchor", "middle")
    .style("font-size", 17)
    .attr("font-weight", "bold")

    // Add one dot in the legend for each name.
    svg.selectAll("mydots")
    .data(keys)
    .enter()
    .append("circle")
    .attr("cx", -30)
    .attr("cy", function(d,i){ return 130 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("r", 7)
    .style("fill", function(d){ return color(d)})

    // Add one dot in the legend for each name.
    svg.selectAll("mylabels")
    .data(keys)
    .enter()
    .append("text")
    .attr("x", -10)
    .attr("y", function(d,i){ return 130 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .style("fill", function(d){ return color(d)})
    .text(function(d){ return d})
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")


    
}