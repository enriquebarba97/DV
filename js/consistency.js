class Consistency {
    constructor(parentId, tournamentData, goalData, matchData, squadsData, width, height){
        this.parentId = parentId;
        this.tournamentData = tournamentData;
        this.matchData = matchData;
        this.squadsData = squadsData;
        this.goalData = goalData;
        this.filters = [];

        this.margin = {top: 10, right: 30, bottom: 30, left: 40};
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

        this.teamColors = ['#e41a1c','#377eb8','#4daf4a','yellow']

        this.init();
    }

    init(){
        let vis = this;

        vis.svg = d3
        .select("#" + this.parentId)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // // Initialize and draw X axis
        // vis.binGroups = ["0-15","15-30","30-45","45-60","60-75","75-90","90-105","105-120"]

        vis.x = d3.scaleBand()
        .domain(vis.tournamentData.map(t => t.year))
        .range([0, vis.width]);

        vis.svg.append("g")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(vis.x).tickSize(0))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

        // Initialize Y axis
        vis.y = d3.scaleLinear()
        .range([vis.height, 0]);
        vis.yAxis = vis.svg.append("g");

        vis.y2 = d3.scaleLinear()
        .range([vis.height, 0]);
        vis.yAxis2 = vis.svg.append("g")
        .attr("transform", "translate("+vis.width+",0)");

        vis.setData();

        // Create histogram function
        // vis.histogram = d3.bin()
        // .value(function(d) { return d.minute_regulation; })   // I need to give the vector of value
        // .domain(vis.minutes.domain())  // then the domain of the graphic
        // .thresholds([15,30,45,60,75,90,105,120]); // 15 minutes intervals

        // vis.drawAxis();
        // vis.drawBars();

    }

    setData(){
        let vis = this;

        let data = [];

        let oldPlayers = {}

        let previousTournament = {
          tournamentId: vis.tournamentData[0].tournament_id,
          year: vis.tournamentData[0].year,
          teamsData:[]
        }

        for(const teamId of vis.filters){
          let matches = vis.matchData.filter(m => m.tournament_id===vis.tournamentData[0].tournament_id && (m.home_team_id===teamId || m.away_team_id===teamId));
          
          let wonMatches = matches.filter(m=>(m.home_team_id===teamId && m.home_team_win===1) || (m.away_team_id===teamId && m.away_team_win===1));

          let players = vis.squadsData.filter(p => p.tournament_id===previousTournament.tournamentId && p.team_id === teamId);

          oldPlayers[teamId] = players;

          previousTournament.teamsData.push({
            teamId: teamId,
            matches: matches,
            wonMatches: wonMatches,
            newPlayers: []
          });

        }

        data.push(previousTournament);

        for(let i=1;i<vis.tournamentData.length;i++){
          let tournament = vis.tournamentData[i]
          let previousTournament = data[i-1];

          let currentTournament = {
            tournamentId: tournament.tournament_id,
            year: tournament.year,
            teamsData:[]
          }

          for(const teamId of vis.filters){
            let matches = vis.matchData.filter(m => m.tournament_id===currentTournament.tournamentId && (m.home_team_id===teamId || m.away_team_id===teamId));
            
            let wonMatches = matches.filter(m=>(m.home_team_id===teamId && m.home_team_win==1) || (m.away_team_id===teamId && m.away_team_win==1));

            let previousPlayers = vis.squadsData.filter(p => p.tournament_id===previousTournament.tournamentId && p.team_id === teamId);

            if(previousPlayers.length === 0){
              previousPlayers = oldPlayers[teamId];
            }else{
              oldPlayers[teamId] = previousPlayers
            }

            let newPlayers = vis.squadsData.filter(p =>  p.tournament_id===currentTournament.tournamentId && p.team_id === teamId && !previousPlayers.some(old=>old.player_id===p.player_id))
            
            currentTournament.teamsData.push({
              teamId: teamId,
              matches: matches,
              wonMatches: wonMatches,
              newPlayers: newPlayers
            });
            
          }

          data.push(currentTournament);

        }

        console.log(data);

        vis.activeData = data;
    }

    drawAxis(){
        let vis = this;

        //vis.bins = vis.histogram(vis.activeData);
        let upperBound = 0;
        let upperBound2 = 0;
        if(vis.filters.length !== 0){
          for (const tournament of vis.activeData) {
            for(const teamData of tournament.teamsData){
              upperBound = teamData.newPlayers.length > upperBound ? teamData.newPlayers.length:upperBound;

              let winRate = teamData.wonMatches==0 ? 0:100*teamData.wonMatches.length/teamData.matches.length;
              upperBound2 = winRate > upperBound ? winRate:upperBound;

            }
          }

          // Y axis: update now that we know the domain
          vis.y.domain([0, upperBound*1.5]);   // d3.hist has to be called before the Y axis obviously
          vis.yAxis
          .transition()
          .duration(1000)
          .call(d3.axisLeft(vis.y));

          vis.y2.domain([0,100]);
          vis.yAxis2
          .transition()
          .duration(1000)
          .call(d3.axisRight(vis.y2));
        }
    }

    drawBars(){
      let vis = this;

      // Another scale for subgroup position
      const xSubgroup = d3
        .scaleBand()
        .domain(vis.filters)
        .range([0, vis.x.bandwidth()])
        .padding([0.1]);

      // color palette = one color per subgroup
      vis.color = d3
        .scaleOrdinal()
        .domain(vis.filters)
        .range(vis.teamColors.slice(0, vis.filters.length));

      vis.svg.selectAll("rect").remove();
      vis.svg.selectAll("circle").remove();

      vis.groups = vis.svg
        .append("g")
        .selectAll("g")
        // Enter in data = loop group per group
        .data(vis.activeData)
        .join("g")
        .attr("transform", (d) => `translate(${vis.x(d.year)}, 0)`);
      
      vis.groups.selectAll("rect")
        .data(function (d) {
          if (vis.filters.length === 0) {
            //return [{ key: "A", value: d[1] !== undefined ? d[1] : 0 }];
          } else {
            return d.teamsData;
          }
        })
        .join("rect")
        .transition() // and apply changes to all of them
        .duration(1000)
        .attr("x", (d) => {
          console.log(d.teamId)
          return xSubgroup(d.teamId);
        })
        .attr("y", (d) => vis.y(d.newPlayers.length))
        .attr("width", xSubgroup.bandwidth())
        .attr("height", (d) => {
          let result = vis.height - vis.y(d.newPlayers.length);
          if (isNaN(result)) {
            return 0;
          }
          return vis.height - vis.y(d.newPlayers.length);
        })
        .style("fill", (d) => {
          if (vis.filters.length === 0) return "#69b3a2";
          else{ 
            console.log(vis.color(d.key));
            return vis.color(d.teamId);
          }
        })
        .style("opacity", "60%");

      vis.groups
      .selectAll("myPoints")
      .data(d => d.teamsData,d=>d.teamId)
      .join("circle")
        .attr("cx", d => xSubgroup(d.teamId) + xSubgroup.bandwidth()/2)
        .attr("cy", d => vis.y2(d.wonMatches==0 ? 0:100*d.wonMatches.length/d.matches.length))
        .attr("r", 5)
        .attr("stroke", "white")
        .style("fill", d => vis.color(d.teamId))
        .style("opacity",d=>{
          if(d.matches.length===0)
            return "0%";
          else
            return "100%";
        })
    }

    updateFilter(filteredTeams){
        let vis = this;

        vis.filters = filteredTeams;

        vis.setData();
        vis.drawAxis();
        vis.drawBars();
    }
}