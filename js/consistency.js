class Consistency {
    constructor(parentId, tournamentData, teamsData, goalData, matchData, squadsData, width, height){
        this.parentId = parentId;
        this.tournamentData = tournamentData;
        this.teamsData = teamsData;
        this.matchData = matchData;
        this.squadsData = squadsData;
        this.goalData = goalData;
        this.filters = [];

        // Selector options
        this.axisLeftOptions = [
          {
            text: "# new players",
            selector: "newPlayers"
          },{
            text: "# defense",
            selector: "defenders"
          },{
            text: "# midfielders",
            selector: "midfielders"
          },{
            text: "# forward",
            selector: "forward"
        }];
        this.axisRightOptions = [
          {
            text:"Win rate",
            selector: "winRate"
          },{
            text: "# Goals",
            selector: "totalGoals"
        }];

        this.margin = {top: 10, right: 30, bottom: 40, left: 40};
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

        this.teamColors = ['#e41a1c','#377eb8','#4daf4a','yellow']

        this.init();
    }

    // Update after changing selector
    updateAxis(){
      let vis = this;

      if(vis.filters.length !== 0){
        vis.drawAxis();
        vis.drawBars();
      }
    }

    init(){
        let vis = this;

        // Selector left axis
        vis.selectLeft = d3
        .select("#" + this.parentId)
        .append("select")
        .attr("class","form-select d-inline-block")
        .style("width","20%")
        .style("float","left")
        .on("change",d=>vis.updateAxis());

        vis.optionsLeft = vis.selectLeft.selectAll("option")
        .data(vis.axisLeftOptions)
        .enter()
        .append("option")
        .text(d=>d.text)
        .attr("value",d=>d.selector);

        // Selector right axis
        vis.selectRight = d3
        .select("#" + this.parentId)
        .append("select")
        .attr("class","form-select d-inline-block")
        .style("width","20%")
        .style("float","right")
        .on("change",d=>vis.updateAxis());

        vis.optionsRight = vis.selectRight.selectAll("option")
        .data(vis.axisRightOptions)
        .enter()
        .append("option")
        .text(d=>d.text)
        .attr("value",d=>d.selector);

        // Main canvas
        vis.svg = d3
        .select("#" + this.parentId)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.svg.append("text")
        .attr("x", 0)
        .attr("y", 10)
        .attr("text-anchor", "left")
        .style("font-size", "22px")
        .text("Performance and player data");

        // Draw x axis (years)
        vis.x = d3.scaleBand()
        .domain(vis.tournamentData.map(t => t.year))
        .range([0, vis.width])
        .padding(0.1);

        vis.svg.append("g")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(vis.x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

        vis.svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", vis.width)
        .attr("y", vis.height+vis.margin.bottom-5)
        .style("font-size", "15px")
        .text("Year");

        vis.blankText = vis.svg.append("text")
        .attr("text-anchor", "end")
        .style("font-size", "22px")
        .attr("x", vis.width/2)
        .attr("y", vis.height/2)
        .text("Select at least one team");

        // Initialize Y axis
        vis.y = d3.scaleLinear()
        .range([vis.height, 0]);
        vis.yAxis = vis.svg.append("g");

        vis.y2 = d3.scaleLinear()
        .range([vis.height, 0]);
        vis.yAxis2 = vis.svg.append("g")
        .attr("transform", "translate("+vis.width+",0)");

        vis.setData();

    }

    setData(){
        let vis = this;

        let data = [];

        let oldPlayers = {}

        // Obtain data for first tournament
        let previousTournament = {
          tournamentId: vis.tournamentData[0].tournament_id,
          year: vis.tournamentData[0].year,
          teamsData:[]
        }

        for(const teamId of vis.filters){
          // matches of a team
          let matches = vis.matchData.filter(m => m.tournament_id===vis.tournamentData[0].tournament_id && (m.home_team_id===teamId || m.away_team_id===teamId));
          
          // won matches
          let wonMatches = matches.filter(m=>(m.home_team_id===teamId && m.home_team_win==1) || (m.away_team_id===teamId && m.away_team_win==1));

          // win rate
          let winRate = wonMatches==0 ? 0:100*wonMatches.length/matches.length;

          // players for that team and year
          let players = vis.squadsData.filter(p => p.tournament_id===previousTournament.tournamentId && p.team_id === teamId);

          let goals = vis.goalData.filter(g => g.tournament_id===previousTournament.tournamentId && g.team_id===teamId && g.own_goal != "1");

          oldPlayers[teamId] = players;

          // Get number of goals for each player
          for(let i=0;i<players.length;i++){
            let playerGoals = goals.filter(g => g.player_id===players[i].player_id);
            players[i].numberOfGoals = playerGoals.length;
          }
          // Get players of each position
          let defenders = players.filter(p => p.position_code === "DF");
          let midfielders = players.filter(p => p.position_code === "MF");
          let forward = players.filter(p => p.position_code === "FW");

          previousTournament.teamsData.push({
            teamId: teamId,
            tournamentId: vis.tournamentData[0].tournament_id,
            matches: matches,
            wonMatches: wonMatches,
            winRate: winRate,
            players: players,
            newPlayers: [],
            defenders: defenders,
            midfielders: midfielders,
            forward: forward,
            totalGoals: goals.length
          });

        }

        data.push(previousTournament);

        // repeat for every year, comparing with the previous one
        for(let i=1;i<vis.tournamentData.length;i++){
          let tournament = vis.tournamentData[i]
          let previousTournament = data[i-1];

          let currentTournament = {
            tournamentId: tournament.tournament_id,
            year: tournament.year,
            teamsData:[]
          }

          for(const teamId of vis.filters){
            // matches
            let matches = vis.matchData.filter(m => m.tournament_id===currentTournament.tournamentId && (m.home_team_id===teamId || m.away_team_id===teamId));
            
            //won matches
            let wonMatches = matches.filter(m=>(m.home_team_id===teamId && m.home_team_win==1) || (m.away_team_id===teamId && m.away_team_win==1));

            // win rate
            let winRate = wonMatches==0 ? 0:100*wonMatches.length/matches.length;

            // previous tournament players
            let previousPlayers = vis.squadsData.filter(p => p.tournament_id===previousTournament.tournamentId && p.team_id === teamId);

            // If team did not play in previous tournament, take the players from the last year they played
            if(previousPlayers.length === 0){
              previousPlayers = oldPlayers[teamId];
            }else{
              oldPlayers[teamId] = previousPlayers;
            }

            // Get players and positions
            let players = vis.squadsData.filter(p => p.tournament_id===currentTournament.tournamentId && p.team_id === teamId);

            let goals = vis.goalData.filter(g => g.tournament_id===currentTournament.tournamentId && g.team_id===teamId && g.own_goal != "1");

            // Get number of goals for each player
            for(let i=0;i<players.length;i++){
              let playerGoals = goals.filter(g => g.player_id===players[i].player_id);
              players[i].numberOfGoals = playerGoals.length;
            }

            let defenders = players.filter(p => p.position_code === "DF");
            let midfielders = players.filter(p => p.position_code === "MF");
            let forward = players.filter(p => p.position_code === "FW");

            // New players compared to previous tournament
            let newPlayers = players.filter(p => !previousPlayers.some(old=>old.player_id===p.player_id));
            
            currentTournament.teamsData.push({
              teamId: teamId,
              tournamentId: tournament.tournament_id,
              matches: matches,
              wonMatches: wonMatches,
              winRate: winRate,
              players: players,
              newPlayers: newPlayers,
              defenders: defenders,
              midfielders: midfielders,
              forward: forward,
              totalGoals: goals.length
            });
          }

          data.push(currentTournament);

        }

        vis.activeData = data;
    }

    drawAxis(){
        let vis = this;

        // Get max value for each axis, according to the selector
        let leftSelector = vis.selectLeft.property("value");
        let rightSelector = vis.selectRight.property("value")

        let upperBound = 0;
        let upperBound2 = 0;
        if(vis.filters.length !== 0){
          for (const tournament of vis.activeData) {
            for(const teamData of tournament.teamsData){
              upperBound = teamData[leftSelector].length > upperBound ? teamData[leftSelector].length:upperBound;

              upperBound2 = teamData[rightSelector] > upperBound2 ? teamData[rightSelector]:upperBound2;

            }
          }
          console.log(upperBound2);

          // Y axis: update now that we know the domain
          vis.y.domain([0, upperBound*3]);
          vis.yAxis
          .transition()
          .duration(1000)
          .call(d3.axisLeft(vis.y));


          vis.y2.domain([0,rightSelector=="winRate"?100:upperBound2]);
          vis.yAxis2
          .transition()
          .duration(1000)
          .call(d3.axisRight(vis.y2));
        }
    }

    drawBars(){
      let vis = this;

      let leftSelector = vis.selectLeft.property("value");
      let rightSelector = vis.selectRight.property("value");
      console.log(rightSelector);

      // Tooltip div and functions
      const tooltip = d3.select("#"+vis.parentId)
        .append("div")
        .style("opacity", 0)
        .attr("class", "customTooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
    
      const mouseover = function(event,d) {
        let team = vis.teamsData.find(t=>t.team_id === d.teamId);

        // Get top 3 scorers in counted players
        let playersSorted = d[leftSelector].sort((a,b)=>{
          if(a.numberOfGoals<b.numberOfGoals)
            return -1;
          else if(a.numberOfGoals>b.numberOfGoals)
            return 1;
          return b.given_name.localeCompare(a.given_name);
        }).reverse();

        // Write HTML
        let html = `<div class="card" style="width: 18rem;">
        <div class="card-header">
          <b>${team.team_name} top scorers in selected category (${d.tournamentId.substring(3)})</b>
        </div>
        <ul class="list-group list-group-flush">`;

        for(let i=0; i<3 && i<playersSorted.length; i++){
          html += `<li class="list-group-item">${playersSorted[i].given_name == "not applicable"?"":playersSorted[i].given_name} ${playersSorted[i].family_name== "not applicable"?"":playersSorted[i].family_name}: ${playersSorted[i].numberOfGoals}</li>`
        }

        html += `</ul>
        </div>`;

        tooltip
          .style("opacity", 1)
          .html(html)
        d3.select(this)
          .style("stroke", "black")
          .style("opacity", 1)
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
          .style("stroke", "none")
          .style("opacity", d => {
            if(d.totalMatches==0)
              return 0;
            else
              return 0.6;
          })
      }

      // Tooltip for circles
      const tooltip2 = d3.select("#"+vis.parentId)
        .append("div")
        .style("opacity", 0)
        .attr("class", "customTooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
    
      const mouseover2 = function(event,d) {
        let team = vis.teamsData.find(t=>t.team_id === d.teamId);

        let playersSorted = d.players.sort((a,b)=>{
          if(a.numberOfGoals<b.numberOfGoals)
            return -1;
          else if(a.numberOfGoals>b.numberOfGoals)
            return 1;
          return b.given_name.localeCompare(a.given_name);
        }).reverse();

        let html = `<div class="card" style="width: 18rem;">
        <div class="card-header">
          <b>${team.team_name} top scorers (${d.tournamentId.substring(3)})</b>
        </div>
        <ul class="list-group list-group-flush">`;

        for(let i=0; i<3 && i<playersSorted.length; i++){
          html += `<li class="list-group-item">${playersSorted[i].given_name == "not applicable"?"":playersSorted[i].given_name} ${playersSorted[i].family_name== "not applicable"?"":playersSorted[i].family_name}: ${playersSorted[i].numberOfGoals}</li>`
        }

        html += `</ul>
        </div>`;

        tooltip2
          .style("opacity", 1)
          .html(html)
        d3.select(this)
          .style("stroke", "black")
          .style("opacity", 1)
      }
      const mousemove2 = function(event,d) {
        tooltip2
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
      }
      const mouseleave2 = function(event,d) {
        tooltip2
          .style("opacity", 0)
          .style("left", vis.width + "px")
          .style("top", vis.height + "px");
        d3.select(this)
          .style("stroke", "white")
          .style("opacity", d => {
            if(d.totalMatches==0)
              return 0;
            else
              return 1;
          })
      }

      // Scale for positioning teams in a year
      const xSubgroup = d3
        .scaleBand()
        .domain(vis.filters)
        .range([0, vis.x.bandwidth()])
        .padding([0.1]);

      // color palette, one color per team
      vis.color = d3
        .scaleOrdinal()
        .domain(vis.filters)
        .range(vis.teamColors.slice(0, vis.filters.length));

      // clean board
      vis.svg.selectAll("rect").remove();
      vis.svg.selectAll("circle").remove();

      if (vis.filters.length !== 0) {
        vis.blankText
        .style("opacity","0");

        // Groups, one per year
        vis.groups = vis.svg
          .append("g")
          .selectAll("g")
          .data(vis.activeData)
          .join("g")
          .attr("transform", (d) => `translate(${vis.x(d.year)}, 0)`);

        // One bar per team
        vis.groups
          .selectAll("rect")
          .data(function (d) {
            if (vis.filters.length !== 0) {
              return d.teamsData;
            }
          })
          .join("rect")
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseleave", mouseleave)
          .transition() // and apply changes to all of them
          .duration(1000)
          .attr("x", (d) => { // adjust position in subgroup
            return xSubgroup(d.teamId);
          })
          .attr("y", (d) => vis.y(d[leftSelector].length)) // 
          .attr("width", xSubgroup.bandwidth())
          .attr("height", (d) => {
            let result = vis.height - vis.y(d[leftSelector].length);
            if (isNaN(result)) {
              return 0;
            }
            return vis.height - vis.y(d[leftSelector].length); // left axis => bar height
          })
          .style("fill", (d) => { // color of the team
            if (vis.filters.length !== 0)
              return vis.color(d.teamId);
          })
          .style("opacity", "60%"); // semiclear

        // Create points
        vis.groups
          .selectAll("myPoints")
          .data(
            (d) => d.teamsData,
            (d) => d.teamId
          )
          .join("circle")
          .on("mouseover", mouseover2)
          .on("mousemove", mousemove2)
          .on("mouseleave", mouseleave2)
          .attr("cx", (d) => xSubgroup(d.teamId) + xSubgroup.bandwidth() / 2)
          .attr("cy", (d) =>
            vis.y2(d[rightSelector])
          )
          .attr("r", 5)
          .attr("stroke", "white")
          .style("fill", (d) => vis.color(d.teamId))
          .style("opacity", (d) => {
            // if 0 matches, the team did not play that year, don't show
            if (d.matches.length === 0) return "0%";
            else return "100%";
          });
      } else {
        vis.blankText.style("opacity", "1");
      }
    }

    // Update after clicking in map
    updateFilter(filteredTeams){
        let vis = this;

        vis.filters = filteredTeams;

        vis.setData();
        vis.drawAxis();
        vis.drawBars();
    }
}