window.onload = function () 
{
	var map, cities, tiles;
	var array = [];

	map = L.map('map', 
	{
    	center: [50, 22.316667],
    	zoom: 4
	});

	tiles = L.tileLayer('http://{s}.tiles.mapbox.com/v3/examples.map-y7l23tes/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGdpcmdpbiIsImEiOiIxV0ExandNIn0.T0lIyQKqIktV__nqnLSxCQ', 
    {
    	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    	maxZoom: 7
	}).addTo(map);


	$.getJSON("data/map.geojson").done(function(data)
	{
		var info = processData(data);
		createPropSymbols(info.timestamps, data);
		createLegend(info.min,info.max);
		createSliderUI(info.timestamps);
		console.log("Loaded the data successfully!");
	}).fail(function()
	{
		alert("There has been a problem loading the data");
	})

	function processData(data)
	{
		var timestamps = [];
		var min = Infinity;
		var max = -Infinity;

		for (var feature in data.features) 
		{
			var properties = data.features[feature].properties;

			for (var attribute in properties) 
			{
				if (attribute != 'id' && attribute != 'name' && attribute != 'lat' && attribute != 'lon')
				{
					// Slicing off the last character (')')
					// Spliting the first and second value into 2 different values in the array
					// array[0] returns the total number of homicides
					// array[1] returns homicide/100.000
					properties[attribute] = String(properties[attribute]).slice(0, -1).split('(');
					array = properties[attribute.split(',')];
					if ($.inArray(attribute, timestamps) === -1)
					{
						timestamps.push(attribute);
					}

					if (Number(array[1]) < min)
					{
						min = Number(array[1]);
					}

					if (Number(array[1]) > max)
					{
						max = Number(array[1]);
					}
				}
			}
		}
		return(
		{
			timestamps: timestamps,
			min: min,
			max: max
		})
	}

	function createPropSymbols(timestamps, data)
	{
		cities = L.geoJson(data, {
			pointToLayer: function(feature, latlng)
			{
				return L.circleMarker(latlng, {
					fillColor: "#8A0707",
					color: "#8E0707",
					weight: 1,
					fillOpacity: 0.6
				}).on({
						mouseover: function(e) 
						{
							this.openPopup();
							this.setStyle(
							{
								color: "yellow"
							});
						},
						mouseout: function(e)
						{
							this.closePopup();
							this.setStyle(
							{
								color: "#537898"
							});
						}
					});
			}
		}).addTo(map);
		updatePropSymbols(timestamps[0]);
	}

	function updatePropSymbols(timestamps)
	{
		cities.eachLayer(function(layer)
		{
			var props = layer.feature.properties;
			var radius = calcPropRadius(props[timestamps]);
			var popupContent = "<b>" + String(props[timestamps][1]) + 
								" homicides</b><br>" + "<i>" + 
								props.name + "</i> in </i>" + 
								timestamps + "</i>";
			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0, -radius + 5) });
		});
	}
	function calcPropRadius(attributeValue)
	{
			var scaleFactor = 35;
			var area = Number(attributeValue[1]) * scaleFactor;
			return Math.sqrt(area/Math.PI)*2;
		
	}

	function createLegend(min, max)
	{
		if(min < 1)
		{
			min = 1;
		}
		function roundNumber(inNumber)
		{
			return (Math.round(inNumber));
		}	
		var legend = L.control({position: 'bottomright'});
		legend.onAdd = function(map)
		{
			var legendContainer = L.DomUtil.create("div", "legend");
			var symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
			var classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)];
			var legendCircle;
			var lastRadius = 0;
			var currentRadius;
			var margin;

			L.DomEvent.addListener(legendContainer, 'mousedown', function(e) 
			{
				L.DomEvent.stopPropagation(e);
			});

			$(legendContainer).append("<h2 id='legendTitle'>Number of </br>homicides</h2>");

			for (var i = 0; i <= classes.length-1; i++)
			{
				legendCircle = L.DomUtil.create("div", "legendCircle");
				currentRadius = calcPropRadius([0,classes[i]]);
				margin = -currentRadius - lastRadius;

				$(legendCircle).attr("style", "width: " + currentRadius * 2 +
					"px; height: " + currentRadius * 2 +
					"px; margin-left: " + margin + "px");

				$(legendCircle).append("<span class = 'legendValue'>" + classes[i] + "<span>");

				$(symbolsContainer).append(legendCircle);
				lastRadius = currentRadius;
			}

			$(legendContainer).append(symbolsContainer);
			return legendContainer;
		};
		legend.addTo(map);
	}
	function createSliderUI(timestamps) 
	{
		var sliderControl = L.control({ position: 'bottomleft'} );
		sliderControl.onAdd = function(map) 
		{
			var slider = L.DomUtil.create("input", "range-slider");
			L.DomEvent.addListener(slider, 'mousedown', function(e) 
			{ 
				L.DomEvent.stopPropagation(e); 
			});

			$(slider)
				.attr({'type':'range',
					   'max': timestamps[timestamps.length-1],
					   'min':timestamps[0],
					   'step': 1,
					   'value': String(timestamps[0])
				}).on('input', function() {
		        	updatePropSymbols($(this).val().toString());
		        	$(".temporal-legend").text(this.value);
		        });
			return slider;
		}
		sliderControl.addTo(map);
		createTemporalLegend(timestamps[0]);
	}

	function createTemporalLegend(startTimestamp)
	{
		var temporalLegend = L.control({ position: 'bottomleft'});

		temporalLegend.onAdd = function(map) 
		{
			var output = L.DomUtil.create("output", "temporal-legend");
			return output;
		}
		temporalLegend.addTo(map);
	}
}