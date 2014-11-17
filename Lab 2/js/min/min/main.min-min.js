function initialize(){setMap()}function setMap(){function e(e,t,r){colorize=colorScale(t);for(var a=r.objects.europe.geometries,o=0;o<t.length;o++)for(var n=t[o],s=n.adm0_a3,l=0;l<a.length;l++)if(a[l].properties.adm0_a3==s){for(var c in keyArray){var i=keyArray[c],p=parseFloat(n[i]);a[l].properties[i]=p}a[l].properties.name=n.name;break}map.append("path").datum(topojson.feature(r,r.objects.europe)).attr("class","countries").attr("d",path),map.selectAll(".countriesEurope").data(topojson.feature(r,r.objects.europe).features).enter().append("g").attr("class","countriesEurope").append("path").attr("class",function(e){return e.properties.adm0_a3}).attr("d",path).style({stroke:"black"}).style("fill",function(e){return choropleth(e,colorize)}).on("mouseover",highlight).on("mouseout",dehighlight).append("desc").text(function(e){return choropleth(e,colorize)}),p=d3.selectAll("#mapType input[name=mode]").on("click",function(){p=this.value,"cartogram"===p?cartogram(t,r):setMap()}),createDropdown(t),setChart(t,colorize)}var t=700,r=700;map=d3.select("body").append("svg").attr("width",t).attr("height",r).attr("class","map");var a=d3.geo.conicConformal().center([-11,53]).rotate([-22,0]).parallels([43,62]).scale(1090).translate([t/2,r/2]);path=d3.geo.path().projection(a);var o=d3.geo.graticule().step([10,10]);map.append("path").datum(o.outline).attr("class","gratBackground").attr("d",path),map.selectAll(".gratlines").data(o.lines).enter().append("path").attr("class","gratLines").attr("d",path),queue().defer(d3.csv,"data/data.csv").defer(d3.json,"data/europe.topojson").await(e)}function setChart(e){var t=d3.select("body").append("svg").attr("width",chartWidth).attr("height",chartHeight).attr("class","chart"),r=(t.append("text").attr("x",20).attr("y",40).attr("class","chartTitle"),t.selectAll(".bar").data(e).enter().append("rect").sort(function(e,t){return e[expressed]-t[expressed]}).attr("class",function(e){return"bar "+e.adm0_a3}).attr("width",chartWidth/e.length-1).on("mouseover",highlight).on("mouseout",dehighlight));updateChart(r,e.length)}function colorScale(e){var t=d3.scale.quantile().range(["#EEF4FA","#DAE8F5","#C6DBEF","#9EC2E4","#8AB5DE"]);return t.domain([d3.min(e,function(e){return Number(e[expressed])}),d3.max(e,function(e){return Number(e[expressed])})]),t}function choropleth(e,t){var r=e.properties?e.properties[expressed]:e[expressed];return r?t(r):"rgba(255, 255, 255, 0)"}function updateChart(e,t){e.attr("height",function(e){return 3*Number(e[expressed])}).attr("y",function(e){return chartHeight-3*Number(e[expressed])}).attr("x",function(e,r){return r*(chartWidth/t)}).style("fill",function(e){return choropleth(e,colorize)}),d3.select(".chartTitle").text("Number of known languages in Europe")}function createDropdown(e){var t=d3.select("body").append("div").attr("class","dropdown").html("<h3>Select variable:</h3>").append("select").on("change",function(){changeAttribute(this.value,e)});t.selectAll("options").data(keyArray).enter().append("option").attr("value",function(e){return e}).text(function(e){return e})}function changeAttribute(e,t){expressed=e,colorize=colorScale(t),d3.selectAll(".countriesEurope").select("path").style("fill",function(e){return choropleth(e,colorize)}).select("desc").text(function(e){return choropleth(e,colorScale(t))});var r=d3.selectAll(".bar").sort(function(e,t){return e[expressed]-t[expressed]}).transition().delay(function(e,t){return 10*t});updateChart(r,t.length)}function highlight(e){var t=e.properties?e.properties:e;d3.selectAll("."+t.adm0_a3).style("fill","#000"),"<h1>"+t[expressed]+"</h1><br><b>"+expressed+"</b>",t.name,d3.select("body").append("div").attr("class","infolabel").attr("id",t.adm0_a3+"label")}function dehighlight(e){var t=e.properties?e.properties:e,r=d3.selectAll("."+t.adm0_a3),a=r.select("desc").text();r.style("fill",a),d3.select("#"+t.adm0_a3+"label").remove()}function cartogram(e,t){map.selectAll(".countriesEurope").data(topojson.feature(t,t.objects.europe).features).enter().append("path").attr("class","countriesEurope").attr("d",path).attr("transform",function(e){var t=path.centroid(e),r=t[0],a=t[1];return"translate("+r+","+a+")scale("+Math.sqrt(5*valueById[e.id]||0)+")translate("+-r+","+-a+")"}).style("stroke-width",function(e){return 1/Math.sqrt(5*valueById[e.id]||1)})}var keyArray=["No Languages","1 Language","2 Languages","3 Languages or more","Percent of foreigner"],expressed=keyArray[0],chartWidth=550,chartHeight=450,colorize,map,value,path;window.onload=initialize();