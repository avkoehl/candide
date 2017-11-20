// cooccurence.js
// Version 1 11/19/2017
//
// Script that draws a heatmap from an input JSON file
// It is designed for d3 v4
//

//
// Get name of the Json file from HTML attribute given to the script
//
var scripts = document.getElementsByTagName ('script');
for (var s, i = scripts.length; i && (s = scripts[--i]);) {
        if ((t = s.getAttribute ('src')) && (t = t.match (/^(.*)cooccurence.js(\?\s*(.+))?\s*/))) {
                jsonfile=s.getAttribute('jsonfile');
        }
}

//
// Get size of the window from the size of the HTML element and adapt for
// margins
//

var margin = {top: 120, right: 0, bottom: 20, left: 120};
var width = parseInt(document.getElementById("matrix").style.width,10)-margin.right -margin.left;
var height = parseInt(document.getElementById("matrix").style.height,10)-margin.top-margin.bottom;

//
// set matrix, opacity, and color scales
// z: set opacity of each square in matrix, based on frequency of node
// c: color for each square in matrix, defined based on cluster defined
//    in Json file ("group" Attribute of nodes)
//

var x = d3.scaleBand().rangeRound([0, width]),
z = d3.scaleLinear().domain([0, 4]).clamp(true),
c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10)); 

//
// Define HTML svg element that will be added to the calling HTML page
//

var svg = d3.select("#matrix").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.style("margin-left", margin.left + "px")
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//
// Now read in the Json file and process its graph (given with nodes and links)
//

d3.json(jsonfile, function(graph) {

	var matrix = [],
	nodes = graph.nodes,
	n = nodes.length;

	// Compute index per node.

	nodes.forEach(function(node, i) {
		node.index = i;
		node.count = 0;
		matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
	});

	// Convert links to matrix; count character occurrences.

	graph.links.forEach(function(link) {
		matrix[link.source][link.target].z += link.value;
		matrix[link.target][link.source].z += link.value;
		matrix[link.source][link.source].z += link.value;
		matrix[link.target][link.target].z += link.value;
		nodes[link.source].count += link.value;
		nodes[link.target].count += link.value;
	});

	// Precompute the orders.

	var orders = {
		name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].id, nodes[b].id); }),
		count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
		group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
	};

	// The default sort order.

	x.domain(orders.name);

	svg.append("rect")
		.attr("class", "background")
		.attr("width", width)
		.attr("height", height);

	var row = svg.selectAll(".row")
		.data(matrix)
		.enter().append("g")
		.attr("class", "row")
		.attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
		.each(row);

	row.append("line")
		.attr("x2", width);

	row.append("text")
		.attr("x", -6)
		.attr("y", x.bandwidth() / 2)
		.attr("dy", ".32em")
		.attr("text-anchor", "end")
		.text(function(d, i) { return nodes[i].id; });

	var column = svg.selectAll(".column")
		.data(matrix)
		.enter().append("g")
		.attr("class", "column")
		.attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

	column.append("line")
		.attr("x1", -width);

	column.append("text")
		.attr("x", 6)
		.attr("y", x.bandwidth() / 2)
		.attr("dy", ".32em")
		.attr("text-anchor", "start")
		.text(function(d, i) { return nodes[i].id; });

	function row(row) {
		var cell = d3.select(this).selectAll(".cell")
		.data(row.filter(function(d) { return d.z; }))
		.enter().append("rect")
		.attr("class", "cell")
		.attr("x", function(d) { return x(d.x); })
		.attr("width",  x.bandwidth())
		.attr("height", x.bandwidth())
		.style("fill-opacity", function(d) { return z(d.z); })
		.style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
		.on("mouseover", mouseover)
		.on("mouseout", mouseout);
	}

	function mouseover(p) {
		d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
		d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
	}

	function mouseout() {
		d3.selectAll("text").classed("active", false);
	}

	d3.select("#order").on("change", function() {
		order(this.value);
	});

	function order(value) {
		x.domain(orders[value]);

		var t = svg.transition().duration(2500);

		t.selectAll(".row")
		.delay(function(d, i) { return x(i) * 4; })
		.attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
		.selectAll(".cell")
		.delay(function(d) { return x(d.x) * 4; })
		.attr("x", function(d) { return x(d.x); });

		t.selectAll(".column")
		.delay(function(d, i) { return x(i) * 4; })
		.attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
	}

});
