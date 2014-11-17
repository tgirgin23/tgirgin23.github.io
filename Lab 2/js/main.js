// Global variables
var keyArray = ["No_Languages", "One_Language", "Two_Languages", "Three_Languages_or_more", "Percent_of_foreigner"];
var expressed = keyArray[0];
var chartWidth = 550, chartHeight = 450;
var colorize, map, value, path, diffCountries, countries, jsonCountries, csvCountries, currentCountry, dropdown;
var attributeValue;
var firstTime = true;
var cartogram = false;
var infoLabel;

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
	map = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "map")
		.style("stroke", function(d) 
			{
				return '#d4d4d8';
			})

	// Create Europe Albers equal area conic projection, centered on Europe
	var projection = d3.geo.conicConformal()
		.center([-11, 53])
		.rotate([-22, 0])
		.parallels([43, 62])
		.scale(1090)
		.translate([width / 2, height / 2])


	// Create svg path generator using the projection
	path = d3.geo.path()
		.projection(projection);

	// Create graticule generator
	var graticule = d3.geo.graticule()
		.step([10, 10]);

	// Create graticule background
	var gratBackground = map.append("path")
		.datum(graticule.outline)
		.attr("class", "gratBackground")
		.attr("d", path);

	// Creating the graticule lines
	/** @type {[type]} [description] */
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

	/**
	 * [callback description]
	 * @param  {[type]}   error
	 * @param  {[type]}   csvData
	 * @param  {[type]}   europe
	 * @return {Function}
	 */
	function callback(error, csvData, europe)
	{
		colorize = colorScale(csvData);
		// Storing all variables (properties + arcs) of the json file (168)
		jsonCountries = europe.objects.europe.geometries;
		// Loop through csv to assign each csv values to json countries
		for (var i = 0; i < csvData.length; i++)
		{
			// Storing the current country
			csvCountries = csvData[i];
			//Storing the ID of the current country  
			var csvId = parseFloat(csvCountries.id);
			// Storing every adm0_a3 code
			var csvAdmin = csvCountries.adm0_a3;

			// Loop through json countries to find the right country for current selected
			for (var j = 0; j < jsonCountries.length; j++)
			{
				// If adm0_a3 code matches, attach csv to json object
				if (jsonCountries[j].properties.adm0_a3 == csvAdmin)
				{
					// Assign all five key/value pairs
					for (var key in keyArray)
					{
						// Stores attributes of the CSV file
						var attr = keyArray[key];
						// Stores value of respective attribute
						var value = parseFloat(csvCountries[attr]);
						// Storing the key attribute and its value in the json
						jsonCountries[j].properties[attr] = value;
						// Storing the ID attribute and its value in the json
						jsonCountries[j].properties["id"] = csvId;
					};
					jsonCountries[j].properties.admin = csvCountries.Country;
					// Stop looking through countries
					break;
				};
			};
		};
		// Add Europe countries geometry to map and create SVG path element
		countries = map.append("path") 
			.datum(topojson.feature(europe,
									europe.objects.europe))
			.attr("class", "countries") // Class name for styling
			.attr("d", path); // Project data as geometry in SVG
		countriesColor(csvData, europe, countries);

		// Selecting the radioButton
		countriesCartogram = d3.selectAll("#mapType input[name=mode]")
			.on('click', function()
				{
					var check, centroid;
					value = this.value;	// Storing the value of the radio button in value
					var k = 0;			// Variables that plays the role of an iterator for the csv file
					var j = 0;

					if(value === "choropleth") // If/else that checks which radio button is pressed
					{
						cartogram = false;
						map.selectAll("g").remove();
						countries = map.append("path") 
							.datum(topojson.feature(europe,
									europe.objects.europe))
							.attr("class", "countries") 			// Class name for styling
							.attr("d", path); 						// Project data as geometry in SVG

						countriesColor(csvData, europe, countries);
					}
					else if(value === "cartogram")
					{
						//console.log(jsonCountries[i].properties);
						// Removing the foreground layer that has countries with colors
						cartogram = true;
						map.selectAll("g").remove();
						//map.selectAll("svg.chart").remove();
						countries = map.selectAll(".countriesEurope")
					 	  	.data(topojson.feature(europe,
														europe.objects.europe).features)
					    	.enter()
					    	.append("g")
					      	.attr("class", "countriesEurope")
					      	.append("path")
					      	.attr("class", function(d) { return d.properties.adm0_a3 })
					      	.attr("d", path)
					      	.attr("transform", function(d, i) 
							{
								// Boolean to return correct transform
								var thisCountry = false;
								check = jsonCountries[i].properties.adm0_a3;
								if(k <= 26)
								{
									currentCountry = csvData[k].adm0_a3;
									//console.log(check + ", " + currentCountry);
									if(check == currentCountry)
									{
										centroid = path.centroid(d),
										x = centroid[0],
										y = centroid[1];
										/*
											Aligning some countries correctly.
											Had to be corrected due to countries having territory(ies)
											in other parts of the world which would offset the centroid
										 */
										if(check == "FRA")
										{
											x2 = 56.01966;
											y2 = 460.33119;
											thisCountry = true;
										}
										if(check == "NOR")
										{
											x2 = 385.609856;
											y2 = 130.790958;
											thisCountry = true;
										}
										if(check == "GRC")
										{
											x2 = 485.2475;
											y2 = 623.98259;
											thisCountry = true;										
										}
										// Incrementing the csv iterator
										k++;
										// Resetting i to go through the json variable again
										i = 0;
										var calc = parseFloat(csvData[k-1].No_Languages);

										// If we have not corrected the centroid of the current country
										if(thisCountry == false)
										{
											return "translate(" + x + "," + y + ")" +
									        	"scale(" + Math.sqrt(calc / 100 || 0) + ")" +
									        	"translate(" + -x + "," + -y + ")";
										}
										// If we have corrected the centroid of the current country
										else
										{
											return "translate(" + x2 + "," + y2 + ")" +
									        	"scale(" + Math.sqrt(calc / 100 || 0) + ")" +
									        	"translate(" + -x + "," + -y + ")";
										}
									}
								}
							})
							.style("fill", function(d, i) 
							{
								// Loops until found last country in the csv file
								if(j <= 26)
								{
									currentCountry = csvData[j].adm0_a3;
								}
								check = d.properties.adm0_a3;
								if(check == currentCountry)
								{
									// Country found, one less country to search meaning
									// that we need to increment j++
									j++;
									// return '#7EBC4F';
								}
								else
								{
									// Returns a white country that has full opacity
									return 'rgba(255,255,255,0)';
								}
							});

							countriesColor(csvData, europe, countries);
							changeAttribute("No_Languages", csvData, europe);
					}
				});
		legend(csvData);
		createDropdown(csvData, europe);
		setChart(csvData, colorize);
	};
};

/**
 * Add countries to map as enumeration units colored by data
 * @param  {[type]} csvData
 * @param  {[type]} europe
 * @param  {[type]} countries
 * @return {[type]}
 */
function countriesColor(csvData, europe, countries)
{
	//console.log("countriesColor");
	diffCountries = map.selectAll(".countriesEurope")
		.data(topojson.feature(europe, 
								europe.objects.europe).features)
		.enter()
		.append("g")
		.attr("class", "countriesEurope")
		.append("path")
		.attr("class", function(d) { return d.properties.adm0_a3 })
		.attr("d", path) 
		.style({'stroke' : 'black'})
		.style("fill", function(d)
		{
			return choropleth(d, colorize);
		})
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel)
		.append("desc")
				.text(function(d) {
					return choropleth(d, colorize);
				});
}

/**
 * 
 * @param {object} csvData 
 * @param {function} colorize
 */
function setChart(csvData, colorize)
{
	//console.log("setChart");
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
			.on("mousemove", moveLabel);

	updateChart(bars, csvData.length);
};

/**
 * [colorScale description]
 * @param  {[type]} csvData
 * @return {[type]}
 */
function colorScale(csvData)
{
	//console.log("colorScale");
	// Creating a quantile color scale
	// The colors will range from the first one to the last one
	var color = d3.scale.quantile()
		.range([
				"#d8e9f3",
				"#b1d5e7",
				"#8bbfdb",
				"#64aacf",
				"#6baed6"
		]);
	// Set min and max data values as domain
	color.domain([
		d3.min(csvData, function(d) { return Number(d[expressed]); }),
		d3.max(csvData, function(d) { return Number(d[expressed]); })
	]);
	// Return the color scale generator
	return color;
};

/**
 * [choropleth description]
 * @param  {[type]} d
 * @param  {[type]} colorize
 * @return {[type]}
 */
function choropleth(d, colorize)
{
	//console.log("choropleth");
	// Get data value
	var value = d.properties ? d.properties[expressed] : d[expressed];
	// If value exists, assign it a color; otherwise assign gray
	if (value)
	{
		return colorize(value);
	} 
	else
	{
		return '#f1f1f4';
	};
};

/**
 * [updateChart description]
 * @param  {[type]} bars
 * @param  {[type]} numBars
 * @return {[type]}
 */
function updateChart(bars, numBars)
{
	//console.log("updateChart");
	// the bars according to currently expressed attribute
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

/**
 * [createDropdown description]
 * @param  {[type]} csvData
 * @return {[type]}
 */
function createDropdown(csvData, europe)
{
	//console.log("createDropdown");
	// Add a select element for the dropdown menu
	dropdown = d3.select("body")
			.append("div")
			.attr("class", "dropdown")
			.html("<h3>Select variable:</h3>")
			.append("select")
			.on("change", function() {
				attributeValue = this.value;
				changeAttribute(this.value, csvData, europe)
			});

	// Create each option element within the dropdown
	dropdown.selectAll("options")
			.data(keyArray)
			.enter()
			.append("option")
			.attr("value", function(d) { return d })
			.text(function(d) {
				var returnD = names(d);
				return returnD;
			});
};

/**
 * [changeAttribute description]
 * @param  {[type]} attribute
 * @param  {[type]} csvData
 * @return {[type]}
 */
function changeAttribute(attribute, csvData, europe)
{
	var k = 0;
	var j = 0;
	//console.log("changeAttribute");
	// Change the expressed attribute to the one selected in the dropdown
	expressed = attribute;
	colorize = colorScale(csvData);
	// Recolor the map
	// Select every country
	d3.selectAll(".countriesEurope") 
		.select("path")
		// Color enumeration units
		.style("fill", function(d) 
		{ 
			return choropleth(d, colorize); 
		})
		// Replace the color text in each countrie's desc element
		.select("desc")
			.text(function(d)
			{
				return choropleth(d, colorScale(csvData));
			});
	if(cartogram == true)
	{
		map.selectAll("g").remove();
		countries = map.selectAll(".countriesEurope2")
					.data(topojson.feature(europe,
											europe.objects.europe).features)
			    	.enter()
			    	.append("g")
			      	.attr("class", "countriesEurope")
			      	.append("path")
			      	.attr("class", function(d, i) { return d.properties.adm0_a3 })
			      	.attr("d", path)
					.attr("transform", function(d, i) 
						{
							// Boolean to return correct transform
							var thisCountry = false;
							check = jsonCountries[i].properties.adm0_a3;
							if(k <= 26)
							{
								currentCountry = csvData[k].adm0_a3;
								//console.log(check + ", " + currentCountry);
								if(check == currentCountry)
								{
									centroid = path.centroid(d),
									x = centroid[0],
									y = centroid[1];

									// Incrementing the csv iterator
									k++;
									// Resetting i to go through the json variable again
									i = 0;
									//console.log(expressed);
									var toCalc;
									if(expressed == "No_Languages")
									{
										toCalc = csvData[k-1].No_Languages;
										/*
										Aligning some countries correctly.
										Had to be corrected due to countries having territory(ies)
										in other parts of the world which would offset the centroid
									 	*/
										if(check == "FRA")
										{
											x2 = 56.01966;
											y2 = 460.33119;
											thisCountry = true;
										}
										if(check == "NOR")
										{
											x2 = 385.609856;
											y2 = 130.790958;
											thisCountry = true;
										}
										if(check == "GRC")
										{
											x2 = 485.2475;
											y2 = 623.98259;
											thisCountry = true;										
										}
									}
									if(expressed == "One_Language")
									{
										toCalc = csvData[k-1].One_Language;
										/*
										Aligning some countries correctly.
										Had to be corrected due to countries having territory(ies)
										in other parts of the world which would offset the centroid
									 	*/
										if(check == "FRA")
										{
											x2 = 65.01966;
											y2 = 460.33119;
											thisCountry = true;
										}
										if(check == "NOR")
										{
											// Original values
											x2 = 407.609856;
											y2 = 85.790958;
											thisCountry = true;
										}
										if(check == "GRC")
										{

											x2 = 483.2475;
											y2 = 620.98259;
											thisCountry = true;										
										}
									}
									if(expressed == "Two_Languages")
									{
										toCalc = csvData[k-1].Two_Languages;
										/*
										Aligning some countries correctly.
										Had to be corrected due to countries having territory(ies)
										in other parts of the world which would offset the centroid
									 	*/
										if(check == "FRA")
										{
											x2 = 107.01966;
											y2 = 460.33119;
											thisCountry = true;
										}
										if(check == "NOR")
										{
											// Original values
											x2 = 407.609856;
											y2 = 85.790958;
											thisCountry = true;
										}
										if(check == "GRC")
										{

											x2 = 470.2475;
											y2 = 623.98259;
											thisCountry = true;										
										}
									}
									if(expressed == "Three_Languages_or_more")
									{
										toCalc = csvData[k-1].Three_Languages_or_more;
										/*
										Aligning some countries correctly.
										Had to be corrected due to countries having territory(ies)
										in other parts of the world which would offset the centroid
									 	*/
										if(check == "FRA")
										{
											x2 = 170.01966;
											y2 = 450.33119;
											thisCountry = true;
										}
										if(check == "NOR")
										{
											// Original values
											x2 = 407.609856;
											y2 = 85.790958;
											thisCountry = true;
										}
										if(check == "GRC")
										{

											x2 = 473.2475;
											y2 = 620.98259;
											thisCountry = true;										
										}
									}
									if(expressed == "Percent_of_foreigner")
									{
										toCalc = csvData[k-1].Percent_of_foreigner;
										/*
										Aligning some countries correctly.
										Had to be corrected due to countries having territory(ies)
										in other parts of the world which would offset the centroid
									 	*/
										if(check == "FRA")
										{
											x2 = 160.01966;
											y2 = 450.33119;
											thisCountry = true;
										}
										if(check == "NOR")
										{
											// Original values
											x2 = 407.609856;
											y2 = 85.790958;
											thisCountry = true;
										}
										if(check == "GRC")
										{

											x2 = 473.2475;
											y2 = 623.98259;
											thisCountry = true;										
										}
									}
									var calc = parseFloat(toCalc);

									// If we have not corrected the centroid of the current country
									if(thisCountry == false)
									{
										return "translate(" + x + "," + y + ")" +
								        	"scale(" + Math.sqrt(calc / 100 || 0) + ")" +
								        	"translate(" + -x + "," + -y + ")";
									}
									// If we have corrected the centroid of the current country
									else
									{
										return "translate(" + x2 + "," + y2 + ")" +
								        	"scale(" + Math.sqrt(calc / 100 || 0) + ")" +
								        	"translate(" + -x + "," + -y + ")";
									}
								}
							}
						})
							.style("fill", function(d)
							{
								return choropleth(d, colorize);
							})
							.on("mouseover", highlight)
							.on("mouseout", dehighlight)
							.on("mousemove", moveLabel)
							.append("desc")
									.text(function(d) {
										return choropleth(d, colorize);
									})
						.style("fill", function(d, i) 
						{
							// Loops until found last country in the csv file
							if(j <= 26)
							{
								currentCountry = csvData[j].adm0_a3;
							}
							check = d.properties.adm0_a3;
							if(check == currentCountry)
							{
								// Country found, one less country to search meaning
								// that we need to increment j++
								j++;
								// return '#7EBC4F';
							}
							else
							{
								// Returns a white country that has full opacity
								return 'rgba(255,255,255,0)';
							}
						})
						// Color enumeration units
						.style("fill", function(d) 
						{ 
							return choropleth(d, colorize); 
						})
						.append("desc")
							.text(function(d)
							{
								return choropleth(d, colorScale(csvData));
							});
	}

	// Adding a simple transition to the chart
	var bars = d3.selectAll(".bar")
		.sort(function(a, b){
			return a[expressed] - b[expressed];
		})
		.transition()
		.delay(function(d, i){
			return i * 10 
		});
	legend(csvData);
	//update bars according to current attribute
	updateChart(bars, csvData.length);
	//updateLegend(expressed, csvData);
};

/**
 * Highlight function highlights parts of the map and chart when
 * the event listener mouseover is on
 * @param  {[type]} data
 * @return {[type]}
 */
function highlight(data)
{
	var props = data.properties ? data.properties : data;
	// Just highlighting the countries that have data
	if(props[expressed] != undefined)
	{
		// JSON or CSV properties
		d3.selectAll("." + props.adm0_a3)
				.style("fill", "#FDBAA0");
	}
	// For labeling the hover box on highlight
	var labelAttribute = names(expressed) +
			": "+ props[expressed];

	var labelName; //Variable holding the name of the countryh
	if(props.admin == undefined)
	{
		labelName = props.Country;
	}
	else if(props.admin != undefined)
	{
		labelName = props.admin;
	}

	// Don't show the hover box for countries without data
	if(props[expressed] == undefined)
	{
		// //Create info label div
		// var infoLabel = d3.select("body").append("div")
		// 	.attr("class", "infoLabel")
		// 	.attr("id", props.adm0_a3 + "label")
		// 	.html(labelName + "</br>" + "No data available");
	}
	else
	{
		// Create info label div
		infoLabel = d3.select("body").append("div")
				.attr("class", "infoLabel")
				.attr("id", props.adm0_a3 + "label")
				.html(labelName + "</br>" + labelAttribute + "%");
	}
}

/**
 * Dehighlight function dehighlights the highlighted parts of the map
 * and chart when the event listener mouseout is on
 * @param {object} data conta
 */
function dehighlight(data)
{
	var props = data.properties ? data.properties : data;
	var country = d3.selectAll("." + props.adm0_a3);
	var fillcolor = country.select("desc").text().substring(0,7); 
	country.style("fill", fillcolor);
	var test = d3.select("#" + props.adm0_a3 + "label").remove();
};

function moveLabel()
{
	// var x = d3.event.pageX < window.innerWidth - 245 ? d3.event.clientX + 3 : d3.event.clientX - 200;
	// var y = d3.event.pageY < window.innerHeight - 100 ? d3.event.clientY - 45 : d3.event.clientY - 175;
	var x = (d3.event.pageX + 3);
	var y = (d3.event.pageY - 45);
	d3.select(".infoLabel")
		.style("left", x + "px")
		.style("top", y + "px")
		.transition()
		.duration(300)
		.style("opacity", 0.9);
}

function legend(csvData)
{
	var colors = ["#EEF4FA",
				 "#DAE8F5",
				 "#C6DBEF",
				 "#9EC2E4",
				 "#8AB5DE"];

	var legendWidth = 40;
	var legendHeight = 20;

	// var chart = d3.select("body")
	// 		.append("svg")
	// 		.attr("width", chartWidth)
	// 		.attr("height", chartHeight)
	// 		.attr("class", "chart");

	// // Create a text element for the chart title
	// var chartTitle = chart.append("text")
	// 		.attr("x", 20)
	// 		.attr("y", 40)
	// 		.attr("class", "chartTitle");
	
	// for(var key in keyArray)
	// {
		//var attr = keyArray[key];
		//console.log(attr);
		//
		// var legend = d3.select("body")
		// 	.append("svg")
		// 	.attr("class", "map_legend")
		// 	.data(keyArray)
		// 	.enter();

	// map = d3.select("body")
	// 	.append("svg")
	// 	.attr("width", width)
	// 	.attr("height", height)
	// 	.attr("class", "map");

		var legend = d3.select("#mapLegend")
				.append("svg")
				.attr("width", legendWidth)
				.attr("height", legendHeight)
				.attr("class", "legend");

		var title = legend.append("text")
				.attr("x")

		legend.append("rect")
			.attr("width", legendWidth)
			.attr("height", legendHeight)
			.style("fill", function(keyArray, i)
			{
				console.log(colors[i])
				return colors[i];
			});
	// }
	// var legend = map.select("#legend")
	// 		.append("svg")
	// 		.attr("width", legendWidth)
	// 		.attr("height", legendHeight)
	// 		.attr("class", "legendDiv")
	// 		.style("margin-top", 540); // CHANGE CHANGE CHANGE CHANGE CHANGE

	// var items = legendDiv.selectAll(".items")

	// items.
	
}

//var keyArray = ["No_Languages", "One_Language", "Two_Languages", "Three_Languages_or_more", "Percent_of_foreigner"];
function names(attribute)
{
	var trueAttribute;
	if(attribute == "No_Languages")
	{
		trueAttribute = "No Languages";
	}
	else if(attribute == "One_Language")
	{
		trueAttribute = "One language"
	}
	else if(attribute == "Two_Languages")
	{
		trueAttribute = "Two languages"
	}
	else if(attribute == "Three_Languages_or_more")
	{
		trueAttribute = "Three languages or more"
	}
	else if(attribute == "Percent_of_foreigner")
	{
		trueAttribute = "% of foreigner"
	}
	return trueAttribute;
}