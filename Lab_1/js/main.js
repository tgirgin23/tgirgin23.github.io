window.onload = function () 
{
	var map, cities, tiles;

	map = L.map('map', 
	{
    	center: [56, 25.316667],
    	zoom: 3
	});

	tiles = L.tileLayer('http://{s}.tiles.mapbox.com/v3/tgirgin.jinodeg7/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGdpcmdpbiIsImEiOiIxV0ExandNIn0.T0lIyQKqIktV__nqnLSxCQ', 
    {
    	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    	maxZoom: 18
	}).addTo(map);

	$.getJSON("data/map.geojson").done(function(data)
	{
		var info = processData(data);
		createPropSymbols(info.timestamps, data);
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
					if ($.inArray(attribute, timestamps) === -1)
					{
						timestamps.push(attribute);
					}

					if (properties[attribute] < min)
					{
						min = properties[attribute];
					}

					if (properties[attribute] > max)
					{
						max = properties[attribute];
					}
				}
			}
		}
		console.log(timestamps);
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
			var popupContent = "<b>" + String(props[timestamps]) + 
								" units</b><br>" + "<i>" + 
								props.name + "</i> in </i>" + 
								timestamps + "</i>";
			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0, radius) });
		});
	}
	function calcPropRadius(attributeValue)
	{
		// Slicing off the last character (')')
		// Spliting the first and second value into 2 different values in the array
		attributeValue = attributeValue.slice(0, -1).split('('[0]);
		console.log(attributeValue[0]);
		// attributeValue[0] returns the total number of homicides
		// attributeValue[1] returns homicide/100.000

		var scaleFactor = 20;
		var area = attributeValue[1] * scaleFactor;
		return Math.sqrt(area/Math.PI)*2;
	}
}