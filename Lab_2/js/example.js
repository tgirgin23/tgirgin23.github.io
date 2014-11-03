window.onload = initialize();

// WHAT DO I REALLY WANT TO DO HERE ANYWAY??
// A: Create a D3 map
// Ingredients: geojson or topojson data, d3.js, topojson.js. queue.js
// Step 1: Create a SVG container
// Step 2: Bring in the data with AJAX
// Step 3: Create a projection -- requires a projection generator
// Step 4: Create paths based on the data -- requires a path generator
// Step 5: 

var mapContainer, path;

function setMap(){

	var mapWidth = 550, mapHeight = 1000; // In D3, no need to assign "px"

	mapContainer = d3.select("body")
		.append("svg")
		.attr("width", mapWidth)
		.attr("height", mapHeight)
		.attr("class", "mapContainer");

		path = d3.geojson.path;

	d3.json("data/europe.topojson", callback);
}

function callback(error, data)
{
	var projection = d3.geo.albers()
		.center([-8, 46.2]) // Lon, lat
		.rotate([-10, 0])
		.parallels([43, 62])
		.scale(2000)
		.transalte([mapwidth / 2, mapHeight / 2]);

	var countries = mapContainer.append("path")
		.datum(topojson.feature(data, data.objects.EuropeCountries))
		.attr("class", "countries")
		.attr

	var provinces = mapContainer.selectAl(".provinces")
		.data(topojson.feature(data, data.objects.FranceProvinces).features)
		.enter()
		.append("path")
		.attr("class", function(d)
		{
			return "provinces" + d.properties.adm1.code
		});
		.attr("d", path/* Path generator */) // Passes d to the path generator function
		.attr("fill", "#CCC")
}