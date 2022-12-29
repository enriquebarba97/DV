class FilterMap {
  constructor(parentId, geoData, teamData, width, height) {
    this.parentId = parentId;
    this.geoData = geoData;
    this.teamData = teamData;
    this.width = width;
    this.height = height

    this.selection = new Set();
    this.selectedObjects = new Set();
    this.init();
  }

  init() {
    let vis = this;

    let projection = d3.geoMercator().center([0, 5]).scale(150);

    vis.tokens = d3
      .select("#" + this.parentId)
      .append("div")
      .attr("id", "tokens")
      .attr("class", "wrapper");

    this.tokens.selectAll('div')
      .data(this.selection)
      .enter()

    vis.svg = d3
      .select("#" + this.parentId)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    var path = d3.geoPath().projection(projection);

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
      .enter()
      .append("path")
      .attr("id", d => d.properties.su_a3)
      .attr("d", path)
      .attr("fill", function (d) {
        if (vis.teamData.some((t) => t.team_code === d.properties.su_a3)) {
          return "green";
        }
        return "grey";
      })
      .attr("stroke-width", 0.3)
      .attr("stroke", "#ff0000")
      .on("click", function (event, d) {
        let team = vis.teamData.find((t) => t.team_code == d.properties.su_a3);
        if(team !== undefined){
            vis.updateFilters(team);
        }
      });

    var zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", function (event, d) {
        //grid.attr('transform', event.transform);
        g.selectAll("path").attr("transform", event.transform);
      });

    vis.svg.call(zoom);
  }

  updateFilters(team) {
    let vis = this;

    let teamId = team.team_id;
    let countryCode = team.team_code;

    if (vis.selection.has(teamId)) {
        vis.selectedObjects.delete(team);
        vis.selection.delete(teamId);
        d3.select('#' + countryCode).attr("fill", "green");
    } else {
        vis.selectedObjects.add(team);
        vis.selection.add(teamId);
        d3.select('#' + countryCode).attr("fill", "yellow");
    }

    let tokenData = d3.select('#tokens')
    .selectAll('div')
    .data(this.selectedObjects,d => d.team_id)

    let tokenDivs = tokenData.enter()
    .append('div')
    .attr('class', 'token label')
    .on('click', (event,d) => {
        vis.updateFilters(d);
    });
    
    tokenDivs.append('span')
    .text(d => d.team_name)
    .attr('class','token-content');
    
    tokenDivs.append('i')
    .attr('class','glyphicon glyphicon-remove');

    tokenData
    .exit()
    .remove();

    updateGoalChart(vis.selection);
  }
}