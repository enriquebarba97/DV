class FilterMap {
    constructor(parentId, geoData, teamData){
        this.parentId = parentId;
        this.geoData = geoData;
        this.teamData = teamData;

        this.selection = new Set();
        this.init();
    }

    init() {
        let vis = this;
        let width = 960,
        height = 500;

        let projection = d3.geoEckert4()
        .center([0, 5 ])
        .scale(150);

        vis.svg = d3.select("#"+this.parentId).append("svg")
        .attr("width", width)
        .attr("height", height);

        var path = d3.geoPath()
            .projection(projection);

        // let grid = vis.svg.append("g").append("path")
        //     .datum(d3.geoGraticule())
        //     .attr("class", "graticule")
        //     .attr('fill', '#fff')
        //     .attr("stroke", "grey")
        //     .attr("d", path);

        var g = vis.svg.append("g");

        // load and display the World
        g.selectAll("path")
            .data(this.geoData.features)
            .enter().append("path")
            .attr("d", path)
            .attr("fill","green")
            .attr("stroke-width", 0.3)
            .attr("stroke", "#ff0000")
            .on('click', function(event,d){
                if(vis.selection.has(d.properties.name)){
                    vis.selection.delete(d.properties.name);
                    d3.select(this)
                    .attr("fill","green")
                }else{
                    vis.selection.add(d.properties.name);
                    d3.select(this)
                    .attr("fill","yellow")
                }
            });

        var zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', function(event, d) {
                grid.attr('transform', event.transform);
                g.selectAll('path')
                .attr('transform', event.transform);
            });

        vis.svg.call(zoom);
    }
}

var mapGlobal;

d3.json('custom.geo.json').then(function(data){
    mapGlobal = new FilterMap('my_dataviz',data,undefined);
});