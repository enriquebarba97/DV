class FilterMap {
  constructor(parentId, geoData, teamData, qualifiedTeamsData, tournamentStandingsData, matchData, width, height) {
    this.parentId = parentId;
    this.geoData = geoData;
    this.teamData = teamData;
    this.qualifiedTeamsData = qualifiedTeamsData;
    this.tournamentStandingsData = tournamentStandingsData;
    this.matchData = matchData;
    this.width = width;
    this.height = height;
    this.margin = {top: 50, right: 30, bottom: 40, left: 40};

    var teamColors = ['#e41a1c','#377eb8','#4daf4a'];

    this.selection = new Set();
    this.selectedObjects = new Set();
    this.init();
  }

  init() {
    let vis = this;

    vis.setData();

    let projection = d3.geoMercator().center([0, 5]).scale(150);

    vis.tokens = d3
      .select("#" + this.parentId)
      .append("div")
      .attr("id", "tokens")
      .attr("class", "wrapper");

    vis.tokens.selectAll('div')
      .data(this.selection)
      .enter()

      // Tooltip on hover
      const tooltip = d3.select("#"+vis.parentId)
      .append("div")
      .style("opacity", 0)
      .attr("class", "customTooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px")
  
    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function(event,d) {

      let team = vis.activeData.find((t) => t.teamCode === d.properties.su_a3);
      if (team !== undefined) {
        let wonChampionships = team.champions.length;
        let wonString = "";
        
        // Build string with won years
        if(wonChampionships != 0){
          wonString += "(";
          for(let standing of team.champions){
            wonString += standing.tournament_id.substring(3) + ", ";
          }
          wonString = wonString.substring(0,wonString.length-2) + ")";
        }

        tooltip.style("opacity", 1)
          .html(`<div class="card" style="width: 18rem;">
        <div class="card-header">
          <b>${team.teamName} (${team.teamCode})</b>
        </div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item">Appearances: ${team.appearances}</li>
          <li class="list-group-item">Matches (W/D/L): ${team.totalMatches} (${team.wonMatches}/${team.draws}/${team.lostMatches})</li>
          <li class="list-group-item">Won championships: ${wonChampionships} ${wonString}</li>
        </ul>
        </div>`);
        d3.select(this).style("stroke", "black").style("opacity", 1);
      }
    }

    const mousemove = function(event,d) {
      tooltip
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
    }

    const mouseleave = function(event,d) {
      tooltip
        .style("opacity", 0)
        .style("left", vis.width + "px")
        .style("top", vis.height + "px");
      d3.select(this)
        .style("stroke", "red")
        .style("opacity", d => {
          if(d.totalMatches==0)
            return 0;
          else
            return 1;
        })
    }

    vis.svg = d3
      .select("#" + this.parentId)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    var path = d3.geoPath().projection(projection);

    // scale for number of appearances
    vis.colorScale = d3.scaleLinear()
      .domain([0,22])
      .range(["#fff5eb","#f57724"]);   

    var g = vis.svg;

    // load and display the World
    g.selectAll("path")
      .data(this.geoData.features)
      .enter()
      .append("path")
      .attr("id", d => d.properties.su_a3)
      .attr("d", path)
      .attr("fill", function (d) {
        let team = vis.activeData.find((t) => t.teamCode === d.properties.su_a3);
        if (team !== undefined) {
          return vis.colorScale(team.appearances);
        }
        return "grey";
      })
      .attr("stroke-width", 0.3)
      .attr("stroke", "#ff0000")
      .on("click", function (event, d) {
        // exclude countries that never played
        let team = vis.teamData.find((t) => t.team_code == d.properties.su_a3);
        if(team !== undefined){
            vis.updateFilters(team);
        }
      })
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

    // Zoom function
    var zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", function (event, d) {
        g.selectAll("path").attr("transform", event.transform);
      });

    vis.svg.call(zoom);
  }

  setData(){
    let vis = this;
    let data = [];

    // Build a basic data structure for each team
    for(let team of vis.teamData){
      let item = {
        teamId: team.team_id,
        teamCode: team.team_code,
        teamName: team.team_name,
      }
      // Bumber of appearances and tournament victories
      item.appearances = vis.qualifiedTeamsData.filter(q => q.team_code === team.team_code).length;
      item.champions = vis.tournamentStandingsData.filter(s => s.team_code === team.team_code && s.position == 1);
      
      // Get Win/Draw/Lose matches
      let matches = vis.matchData.filter(m => (m.home_team_code===team.team_code || m.away_team_code===team.team_code));

      let wonMatches = matches.filter(m=>(m.home_team_code===team.team_code && m.home_team_win==1) || (m.away_team_code==team.team_code && m.away_team_win==1));

      let lostMatches = matches.filter(m=>(m.home_team_code===team.team_code && m.away_team_win==1) || (m.away_team_code==team.team_code && m.home_team_win==1));

      let draws = matches.filter(m=>m.draw==1);

      item.totalMatches = matches.length;
      item.wonMatches = wonMatches.length;
      item.lostMatches = lostMatches.length;
      item.draws = draws.length
      data.push(item);
    }

    vis.activeData = data;
  }

  updateFilters(team) {
    let vis = this;

    let teamId = team.team_id;
    let countryCode = team.team_code;

    // Add or delete clicked team from filter array
    if (vis.selection.has(teamId)) {
        vis.selectedObjects.delete(team);
        vis.selection.delete(teamId);
        d3.select('#' + countryCode).attr("fill", vis.colorScale(vis.qualifiedTeamsData.filter(q => q.team_code === countryCode).length)); // Recolor unselected
    } else if(vis.selection.size < 3){
        vis.selectedObjects.add(team);
        vis.selection.add(teamId);
    }

    // Color selected countries with the same colors as the graphs
    let selectedArray = Array.from(vis.selectedObjects);
    for(let i = 0; i<selectedArray.length;i++){
      d3.select('#' + selectedArray[i].team_code).attr("fill", teamColors[i]);
    }

    // Tokens in top of the map
    let tokenData = d3.select('#tokens')
    .selectAll('div')
    .data(this.selectedObjects,d => d.team_id)

    let tokenDivs = tokenData.enter()
    .append('div')
    .attr('class', 'token')
    .style("font-size", "15px")
    .style('background',(d,i) => teamColors[i])
    .on('click', (event,d) => {
        vis.updateFilters(d);
    });
    
    tokenDivs.append('span')
    .text(d => d.team_name)
    .attr('class','token-content');
    
    tokenDivs.append('i')
    .attr('class','bi bi-x-lg');

    tokenData
    .exit()
    .remove();

    // Update graphs
    updateGoalChart(vis.selection);
    updateConsistencyChart(vis.selection);
  }
}