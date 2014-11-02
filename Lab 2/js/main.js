// Global variables
var keyArray = ["No languages", "1 language", "2 Languages", "3 Languages", "Percent of foreigner"];
var expressed = keyArray[0];
var chartWidth = 550, chartHeight = 450;
var colorize;

// Being script when window loads
window.onload = initialize();

// The first function called once the html is loaded
function initialize()
{
	setMap();
}

// Set choropleth map parameters
function setMap()
{
	// Map frame dimensions
	var width = 700;
	var height = 700;

	// Create a new svg element with the above dimensions
	var map = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	// Create Europe Albers equal area conic projection, centered on Europe
	var projection = d3.geo.conicConformal()
		 .center([-11, 53])
		 .rotate([-22, 0])
		.parallels([43, 62])
		.scale(1090)
		.translate([width / 2, height / 2])


	// Create svg path generator using the projection
	var path = d3.geo.path()
		.projection(projection);

	// Create graticule generator
	var graticule = d3.geo.graticule()
		.step([10, 10]);

	// Create graticule background
	var gratBackground = map.append("path")
		.datum(graticule.outline)
		.attr("class", "gratBackground")
		.attr("d", path);

	// Create graticule lines
	var gratLines = map.selectAll(".gratlines")
		.data(graticule.lines)
		.enter()
		.append("path")
		.attr("class", "gratLines")
		.attr("d", path);

	// Use queue.js to parallelize asynchronous data loading
	queue()
		.defer(d3.csv, "data/data.csv") // Load attributes from csv
		.defer(d3.json, "data/europe.topojson") // Load geometry from topojson
		.await(callback); // Trigger callback function once data is loaded

	function callback(error, csvData, europe)
	{
		colorize = colorScale(csvData);
		// Variables for csv to json data transfer
		var jsonCountries = europe.objects.europe.geometries;

		// Loop through csv to assign each csv values to json countries
		for (var i = 0; i < csvData.length; i++)
		{
			var csvCountries = csvData[i]; 		// The current country
			var csvAdmin = csvCountries.adm0_a3;  // adm0_a3 code

			// Loop through json countries to find the right country for current selected
			for (var j = 0; j < jsonCountries.length; j++)
			{
				// If adm0_a3 code matches, attach csv to json object
				if (jsonCountries[j].properties.adm0_a3 == csvAdmin)
				{
					// Assign all five key/value pairs
					for (var key in keyArray)
					{
						var attr = keyArray[key];
						var value = parseFloat(csvCountries[attr]);
						jsonCountries[j].properties[attr] = value;
					};
					jsonCountries[j].properties.name = csvCountries.name;
					// Stop looking through provinces
					break;
				};
			};
		};

		// Add Europe countries geometry to map
		// var countries = map.append("path") // Create SVG path element
		// 	.datum(topojson.feature(europe,
		// 							europe.objects.europe)) //ne_50m_admin_0_countries
		// 	.attr("class", "countries") // Class name for styling
		// 	.attr("d", path); // Project data as geometry in SVG

		// Add countries to map as enumeration units colored by data
		var diffCountries = map.selectAll(".countriesEurope")
			.data(topojson.feature(europe, 
									europe.objects.europe).features)
			.enter()
			.append("g")
			.attr("class", "countriesEurope")
			.append("path")
			.attr("class", function(d) { return d.properties.adm0_a3 })
			.attr("d", path) 
			.style("fill", function(d)
			{
				return choropleth(d, colorize);
			})
			.on("mouseover", highlight)
			.on("mouseout", dehighlight)
			//.on("mousemove", moveLabel)
			.append("desc")
					.text(function(d) {
						return choropleth(d, colorize);
					});

		createDropdown(csvData);
		setChart(csvData, colorize);
	};
};
function setChart(csvData, colorize)
{
	// Create a second svg element to hold the bar chart
	var chart = d3.select("body")
			.append("svg")
			.attr("width", chartWidth)
			.attr("height", chartHeight)
			.attr("class", "chart");

	// Create a text element for the chart title
	var chartTitle = chart.append("text")
			.attr("x", 20)
			.attr("y", 40)
			.attr("class", "chartTitle");

	// Set bars for each country
	var bars = chart.selectAll(".bar")
			.data(csvData)
			.enter()
			.append("rect")
			.sort(function(a, b) { return a[expressed] - b[expressed] })
			.attr("class", function(d) { return "bar " + d.adm0_a3; })
			.attr("width", chartWidth / csvData.length - 1)
			.on("mouseover", highlight)
			.on("mouseout", dehighlight)
			//.on("mousemove", moveLabel);

	updateChart(bars, csvData.length);
};

function colorScale(csvData)
{
	//console.log(csvData);
	// Create quantile classes with color scale
	var color = d3.scale.quantile()
		.range([
				"#FFFFFF",
				"#DAE8F5",
				"#C6DBEF",
				"#9EC2E4",
				"#8AB5DE"
		]);

	// Set min and max data values as domain
	color.domain([
		d3.min(csvData, function(d) { return Number(d[expressed]); }),
		d3.max(csvData, function(d) { return Number(d[expressed]); })
	]);
	// Return the color scale generator
	return color;
};

function choropleth(d, colorize)
{
	// Get data value
	var value = d.properties ? d.properties[expressed] : d[expressed];

	// If value exists, assign it a color; otherwise assign gray
	if (value)
	{
		return colorize(value);
	} 
	else
	{
		return "#CCC";
	};
};

function updateChart(bars, numBars)
{
	// Style the bars according to currently expressed attribute
	bars.attr("height", function(d, i)
		{
			return Number(d[expressed]) * 3;
		})
		.attr("y", function(d, i)
		{
			return chartHeight - Number(d[expressed]) * 3;
		})
		.attr("x", function(d, i)
		{
			return i * (chartWidth / numBars);
		})
		.style("fill", function(d)
		{
			return choropleth(d, colorize);
		});

	// Update chart title
	d3.select(".chartTitle")
			.text("Number of known languages in Europe");
};

function createDropdown(csvData)
{
	// Add a select element for the dropdown menu
	var dropdown = d3.select("body")
			.append("div")
			.attr("class", "dropdown")
			.html("<h3>Select variable:</h3>")
			.append("select");

	// Create each option element within the dropdown
	dropdown.selectAll("options")
			.data(keyArray)
			.enter()
			.append("option")
			.attr("value", function(d) { return d })
			.text(function(d) {
				d = d[0].toUpperCase() +
					d.substring(1, 3) + " " +
					d.substring(3);
				return d
			});
};

function changeAttribute(attribute, csvData)
{
	// Change the expressed attribute
	expressed = attribute;
	colorize = colorScale(csvData);

	// Recolor the map
	// Select every province
	d3.selectAll(".provinces") 
		.select("path")
		// Color enumeration units
		.style("fill", function(d) { 
			return choropleth(d, colorize); 
		})
		// Replace the color text in each province's desc element
		.select("desc")
				.text(function(d)
				{
					return choropleth(d, colorScale(csvData));
				});


	// Re-sort the bar chart
	var bars = d3.selectAll(".bar")
		.sort(function(a, b){
			return a[expressed] - b[expressed];
		})
		// Add animation
		.transition()
		.delay(function(d, i){
			return i * 10 
		});

	//update bars according to current attribute
	updateChart(bars, csvData.length);
};

function highlight(data)
{
	// JSON or CSV properties
	var props = data.properties ? data.properties : data;

	d3.selectAll("." + props.adm0_a3)
			.style("fill", "#000");

	var labelAttribute = "<h1>"+props[expressed]+
			"</h1><br><b>"+expressed+"</b>";
	var labelName = props.name;

	// Create info label div
	var infolabel = d3.select("body").append("div")
			.attr("class", "infolabel")
			.attr("id", props.adm0_a3 + "label")
}

function dehighlight(data)
{
	var props = data.properties ? data.properties : data;
	var prov = d3.selectAll("." + props.adm0_a3); 
	var fillcolor = prov.select("desc").text(); 
	prov.style("fill", fillcolor);
	
	d3.select("#" + props.adm0_a3 + "label").remove();
};
