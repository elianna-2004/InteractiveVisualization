const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
// The margin code above

const continents = ['Africa', 'Asia', 'Oceania', 'Americas', 'Europe']
const colorScale = d3.scaleOrdinal(continents, d3.schemeSet2); // d3.schemeSet2 is a set of predefined colors
const options = ['income', 'lifeExp', 'gdp', 'population', 'childDeaths']

// For animated transition
const t = 1000;  // 1000ms = 1 second

// Global Variables
let allData = []
let xVar = 'income', yVar = 'lifeExp', sizeVar = 'population', targetYear = 2000
let xScale, yScale, sizeScale

// Create SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Loading Data and Creating Visualization
function init(){
    d3.csv("./data/gapminder_subset.csv", 
        // This is our callback function, applied to each item in the array
        function(d){
            return {
            // Besides converting the types from string to int,
            // we also simplify the variable
            country: d.country,
            continent: d.continent,
            year: +d.year, // using + to convert to numbers
            lifeExp: +d.life_expectancy,
            income: +d.income_per_person,
            gdp: +d.gdp_per_capita,
            childDeaths: +d.number_of_child_deaths,
            population: +d.population
         }
        }) 
        .then(data => {
            console.log(data)
            allData = data
            setupSelector()

            // Initial rendering steps:
            // P.S. You could move these into setupSelector(),
            // but calling them seperately makes the flow clearer.
            updateAxes()
            updateVis()
            addLegend()

        })
    .catch(error => console.error('Error loading data:', error));
}

window.addEventListener('load', init);

// Here's what each function is responsible for:

function setupSelector(){
    // Handles UI chnages (sliders, dropdowns)
    // Anytime the user tweaks something, this function reacts.
    // Maye need to call updateAxes and updateVis() here when needed!

    //Slider Code
    let slider = d3
        .sliderHorizontal()
        .min(d3.min(allData.map(d => +d.year))) // setup the range
        .max(d3.max(allData.map(d => +d.year))) // setup the range
        .step(1)
        .width(width)   // Widen the slider if needed
        .displayValue(false)
        .default([1960])
        .on('onchange', (val) => {
            d3.select('#value').text(val); // updates the year above slider

            targetYear = +val // Update the year
            updateVis() // Refresh the chart
        });

    d3.select('#slider')
        .append('svg')
        .attr('width', width)  // Adjust width if needed
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(slider);

    // Data binding to populate each dropdown
    d3.selectAll('.variable')
        // loop over each dropdown button
        .each(function() {   // Can't use arrow function here because they do no create their own "this" binding
            d3.select(this).selectAll('myOptions')
                .data(options)
                .enter()
                .append('option')
                .text(d => d) // The displayed text
                .attr("value",d => d) // The actual value used in the code
    })

    d3.select('#xVariable').property('value', xVar)
    d3.select('#yVariable').property('value', yVar)
    d3.select('#sizeVariable').property('value', sizeVar)

    // Updating Dynamic Drop-Down Options
    //select all dropdown options
    d3.selectAll('.variable')
        .each(function() {
            // ... Loop over each dropdown button
        })
        .on("change", function (event) {
            // Placeholder: we'll chnage xVar, yVar, or sizeVar here
            console.log(d3.select(this).property("id"))  // Logs which dropdown (e.g., xVariable)
            console.log(d3.select(this).property("value"))  // logs the selected value

            // Based on drop option (x, y size) map chosen value to global variables
            if (d3.select(this).property("id") === "xVariable"){
                xVar = d3.select(this).property("value")
            }

            if (d3.select(this).property("id") === "yVariable"){
                yVar = d3.select(this).property("value")
            }

            if (d3.select(this).property("id") === "sizeVariable"){
                sizeVar = d3.select(this).property("value")
            }

            // Update Chart
            updateAxes();
            updateVis();

        })


}

function updateAxes(){
    // Draws the x-axis and y-axis
    // Adds ticks, labels, and makes sure everything lines up nicely

    // Prevent overlapping axes by clearing old one
    svg.selectAll('.axis').remove()
    svg.selectAll('.labels').remove()

    // Scaling the bubbles, we don't all the bubbles to be the same size
    sizeScale = d3.scaleSqrt() // makes size more visually accurate
        .domain([0, d3.max(allData, d => d[sizeVar])]) // Largest bubble = Largest data point
        .range([5,20]); // Can tweak for smaller or larger bubbles

    // Create X and Y Axes
    xScale = d3.scaleLinear()
        .domain([0, d3.max(allData, d => d[xVar])]) // .max() makes scale dynamic based on loaded data
        .range([0, width]);
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format("~s"));


    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`) // Position at the bottom
        .call(xAxis);


    yScale = d3.scaleLinear()
        .domain([0, d3.max(allData, d => d[yVar])])
        .range([height, 0]);  // Inverted for SVG coordinates
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format("~s"));

    svg.append("g")
        .attr("class", "axis")
        .call(yAxis);


    // X-axis Label
    svg.append("text")
        .attr("x", width/2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text(xVar) // Displays the current x-axis variable
        .attr('class', 'labels')

    // Y-axis Label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("y", -margin.left + 40)
        .attr("text-anchor", "middle")
        .text(yVar) // Displays the current y-axis variable
        .attr('class', 'labels')
}

function updateVis(){
    // Draws (or updates) the bubbles

    // Filter data for the current year
    let currentData = allData.filter(d => d.year === targetYear)

    svg.selectAll('.points')
        // why use d => d.country as the key?
        // Because each country is unique in the dataset for the current year
        // This helps d3 know which bubbles to keep, update, or remove.
        .data(currentData, d => d.country)
        .join(
            function(enter) {
                // New data points go here (when new bubbles are added)
                return enter
                    .append('circle')
                    .attr('class', 'points')
                    .attr('cx', d => xScale(d[xVar])) // Position on x-axis
                    .attr('cy', d => yScale(d[yVar])) // Position on y-axis
                    // Apply continent colors
                    .style('fill', d => colorScale(d.continent)) 
                    .style('opacity', .5) // Slight Transparency for better visibility
                    .attr('r', 0) // before transition r = 0 
                    // Add mouse events
                    .on('mouseover', function (event, d) {
                        console.log(d)  // See the data point in the console for debugging
                        d3.select('#tooltip')
                            // if you change the opacity to hide it, you should also change the opacity here
                            .style("display", 'block')  // Make the tooltip visible
                            .html( // Change the html content of the <div> directly
                            `<strong>${d.country}</strong><br/>
                            Continent: ${d.continent}`)
                            .style("left", (event.pageX + 20) + "px")
                            .style("top", (event.pageY - 28) + "px");
                        // Adding highlight on the hover
                        d3.select(this) // Refers to the hovered circle
                            .style('stroke', 'black')
                            .style('stroke-width', '4px');       
                    })
                    .on("mouseout", function (event, d) {
                        d3.select('#tooltip')
                            .style('display', 'none')   // Hide the tooltip when cursor leaves
                        d3.select(this)  // Undo the stroke in mouseout
                            .style('stroke', 'none');
                    })
                    .transition(t)  // Apply transition to bubble size
                    .attr('r', d => sizeScale(d[sizeVar]))
            }, 
            function(update){
                // Existing points get updated here (bubbles need to move or resize)
                return update
                    // Smoothly move to new positions/sizes
                    .transition(t)
                    .attr('cx', d => xScale(d[xVar]))
                    .attr('cy', d => yScale(d[yVar]))
                    .attr('r', d => sizeScale(d[sizeVar]))
            },
            function(exit){
                // Old points get removed here (bubbles need to be removed)
                exit
                .transition(t)
                .attr('r', 0) // Shrink to radius 0
                .remove()  // Then remove the bubble
            }
        )
}

function addLegend(){
    // Adds a legend so users can decode colors
    let size = 10 // size of legend squares

    // Draw a set of rectangles using D3

    svg.selectAll('continentSquare')
    // data here should be "continents", which we've defined as a global variable 
    // the rect's y could be -margin.top/2, x could be based on i * (size + 100) + 100
    // i is the index in the continents array
    // use "colorScale" to fill them; colorScale is a global variable we defined, used in coloring bubbles
        .data(continents)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr("x", (d, i) => i * (size + 100) + 100)
        .attr("y", -margin.top/2)
        .attr('width', 12)
        .attr('height', 12)
        .style("fill", d => colorScale(d))
        
    svg.selectAll("continentName")
        .data(continents)
        .enter()
        .append("text")
        .attr("y", -margin.top/2 + size)  // Align vertically with the square
        .attr("x", (d, i) => i * (size + 100) + 120)
        .style("fill", d => colorScale(d))    // Match text color to the square
        .text(d => d)  // The actual continent name
        .attr("text-anchor", "left")
        .style('font-size', '13px')
}