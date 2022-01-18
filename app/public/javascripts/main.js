(async () => {
    // Load data
    let usStates = await loadUsStates();
    let massShootings = await loadMassShootings();
    let stats = await computeStats(massShootings);

    // drawing
    drawMap(usStates, massShootings);
    drawTimeline(stats);
    drawBrush();

    // add event listeners
    var radios = document.querySelectorAll('input[type=radio]');
    for(var i = 0, max = radios.length; i < max; i++) {
        radios[i].onclick = function() {
            updateTimeline(this.value);
        }
    }
})();