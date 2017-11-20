// forcenetwork.js
// Version 1 11/19/2017
//
// Javascript for displaying a network using force-based layout
// It is designed for d3 v4
//

//
// Get name of the Json file from HTML attribute given to the script
//

var scripts = document.getElementsByTagName ('script');
for (var s, i = scripts.length; i && (s = scripts[--i]);) {
        if ((t = s.getAttribute ('src')) && (t = t.match (/^(.*)forcenetwork.js(\?\s*(.+))?\s*/))) {
                jsonfile=s.getAttribute('jsonfile');
		forcevalue=parseInt(s.getAttribute('force'),10);
        }
}

var margin = {top: 60, right: 0, bottom: 20, left: 0};
var width = parseInt(document.getElementById("network").style.width,10)-margin.right -margin.left;
var height = parseInt(document.getElementById("network").style.height,10)-margin.top-margin.bottom;


var color = d3.scaleOrdinal(["#66c2a5", "#fc8d62" , "#8da0cb", "#e78ac3", "#a6d854"]);

var svgnet = d3.select("#network").append("svg")
        .attr("width", 1.2*width + margin.left + margin.right)
        .attr("height", 1.2*height + margin.top + margin.bottom)
        .style("margin-left", margin.left + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var simulation = d3.forceSimulation()
	.force("link", d3.forceLink())
	.force("charge", d3.forceManyBody().strength(-forcevalue))
	.force("center", d3.forceCenter(width / 2, height / 2));

d3.json(jsonfile, function(error, graph) {
	if (error) throw error;

	var link = svgnet.append("g")
	.attr("class", "links")
	.selectAll("line")
	.data(graph.links)
	.enter().append("line")
	.attr("stroke-width", function(d) { return Math.sqrt(d.value); });

	var node = svgnet.append("g")
	.attr("class", "nodes")
	.selectAll("g")
	.data(graph.nodes)
	.enter().append("g")

	var circles = node.append("circle")
		.attr("r", 15)
		.attr("fill", function(d) { return color(d.group); })
		.call(d3.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended));

	var labels = node.append("text")
		.text(function(d) {
			return d.id;
		} )
		.attr('x',10)
		.attr('y',-10)
		.style("font-style","Italic")
		.style("font-size",14)
		.style("font-weight","Bold");

	node.append("title")
		.text(function(d) { return d.id; });

	simulation
		.nodes(graph.nodes)
		.on("tick", ticked);

	simulation.force("link")
		.links(graph.links);

	function ticked() {
		link
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; })
			.attr("transform", function(d) {
				return "translate(" +d.x + "," + d.y + ")";
			})
		}
});

function dragstarted(d) {
	if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}

function dragended(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
}
