const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
// The margin code above

// Global Variables
allData = []
let xVar, yVar = 'BATTERY'
let xScale, yScale, newData

// For animated transition
const t = 1000;  // 1000ms = 1 second

const crimeColors = {
    "BATTERY": "#66c2a5",
    "ARSON": "#fc8d62",
    "CRIMINAL DAMAGE": "#8da0cb",
    "BURGLARY": "#e78ac3",
    "THEFT": "#a6d854",
    "NARCOTICS": "#ffd92f",
    "CRIMINAL SEXUAL ASSAULT": "#e5c494"

}

const codes = {
    "BATTERY": "08B",
    "ARSON": "09",
    "CRIMINAL DAMAGE": "14",
    "BURGLARY": "05",
    "THEFT": "06",
    "NARCOTICS": "18",
    "CRIMINAL SEXUAL ASSAULT": "02"

}

const options = ['BATTERY', 'ARSON', 'CRIMINAL DAMAGE','BURGLARY', 'THEFT', 'NARCOTICS', 'CRIMINAL SEXUAL ASSAULT']
const colorScale = d3.scaleOrdinal(options, d3.schemeSet2); // d3.schemeSet2 is a set of predefined colors

// Create SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Loading Data and Creating Visualization
function init(){
    d3.csv("./data/data.csv", 
        // This is our callback function, applied to each item in the array
        function(d){
            return {
            // Besides converting the types from string to int,
            // we also simplify the variable
            id: +d.ID,
            type: d['Primary Type'],
            location: d['Location Description'],
            year: +d.Year,
            code: d['FBI Code'],
            arrest: d.Arrest
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

// Visualization Functions

// Returns an array for a certain crime type, the location it occured and number of arrests
function getCrimeCounts(data){
    return Array.from(
        d3.rollup(
            data,
            v => v.length,
            d => d.location

        ),
        ([location, count]) => ({
            location,
            count
        })
    );
}

function setupSelector(){
    // Handles UI changes (options dropdowns)
    // Anytime the user tweaks something, this function reacts.
    // Maye need to call updateAxes and updateVis() here when needed!


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

    //d3.select('#xVariable').property('value', xVar)
    d3.select('#yVariable').property('value', yVar)

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

            // Based on drop option (y) map chosen value to global variables
            if (d3.select(this).property("id") === "yVariable"){
                yVar = d3.select(this).property("value")
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
    
    let filteredData = allData.filter(d => d.type === yVar)

    // Turns data into a list of record objects with
    // location field and number of crimes arrested there (yVar)
    let newData = getCrimeCounts(filteredData, yVar)
    console.log(newData)

    // Create X and Y Axes
    xScale = d3.scaleBand()
        .domain(allData.map(d => d.location)) // creates an x-axis tick for each location description
        .range([0, width]);

    const xAxis = d3.axisBottom(xScale)

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`) // Position at the bottom
        .call(xAxis);

    yScale = d3.scaleLinear()  
        .domain([0, d3.max(newData, d => d.count)])  // Max number present at a location for a given crime
        .range([height, 0]);  // Inverted for SVG coordinates

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format("~s"));

    svg.append("g")
        .attr("class", "axis")
        .call(yAxis);

    // X-axis Label
    svg.append("text")
        .attr("x", width/2)
        .attr("y", height + margin.bottom - 15)
        .attr("text-anchor", "middle")
        .text('Location of Crime') // Displays the current x-axis variable
        .attr('class', 'labels')

    // Y-axis Label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("y", -margin.left + 60)
        .attr("text-anchor", "middle")
        .text('Number of Arrests') // Displays the current y-axis variable
        .attr('class', 'labels')
}

function updateVis(){
    // Draws (or updates) the rectangles

    let filteredData = allData.filter(d => d.type === yVar)
    let newData = getCrimeCounts(filteredData, yVar)

    // Update Bars
    const bars = svg.selectAll("rect")
        .data(newData, d => d.location)

    bars.join("rect")
        .attr('x', d => xScale(d.location + 15))
        .attr('y', d => yScale(d.count))
        .attr('width', xScale.bandwidth() - 10)
        .attr('height', d => height - yScale(d.count))
        .attr('fill', crimeColors[yVar]) // Make bars color distinct to crime type
        // Add mouse events
        .on('mouseover', function (event, d) {
            console.log(d)  // See the data point in the console for debugging
            d3.select('#tooltip')
                // if you change the opacity to hide it, you should also change the opacity here
                .style("display", 'block')  // Make the tooltip visible
                .html( // Change the html content of the <div> directly
                `<strong>FBI Code: ${codes[yVar]}</strong><br/>
                Arrests: ${d.count}`)
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
        // Smoothly move to new positions/sizes
        .transition(t)  // Apply transition to bubble size
        .attr('x', d => xScale(d.location))
        .attr('y', d => yScale(d.count))

    // Keeps squares from dissapearing
    addLegend()
}


function addLegend(){
    // Adds a legend so users can decode colors
    let size = 10 // size of legend squares

    // Draw a set of rectangles using D3

    svg.selectAll('optionSqaure')
    // data here should be "continents", which we've defined as a global variable 
    // the rect's y could be -margin.top/2, x could be based on i * (size + 100) + 100
    // i is the index in the continents array
    // use "colorScale" to fill them; colorScale is a global variable we defined, used in coloring bubbles
        .data(options)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr("x", (d, i) => i * (size + 125) - 85)
        .attr("y", -margin.top/2)
        .attr('width', 12)
        .attr('height', 12)
        .style("fill", d => colorScale(d))
        
    svg.selectAll("optionName")
        .data(options)
        .enter()
        .append("text")
        .attr("y", -margin.top/2 + size)  // Align vertically with the square
        .attr("x", (d, i) => i * (size + 125) - 68)
        .style("fill", d => colorScale(d))    // Match text color to the square
        .text(d => d)  // The actual continent name
        .attr("text-anchor", "left")
        .style('font-size', '10px')
}