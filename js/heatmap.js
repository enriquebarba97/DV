class Heatmap {
    constructor(parentId, teamsData, goalData, matchData, width, height){
        this.parentId = parentId;
        this.teamsData = teamsData.sort((a,b)=>{
          if (a.confederation_id < b.confederation_id) {
            return -1;
          }
          if (a.confederation_id > b.confederation_id) {
            return 1;
          }
          return 0;
        });
        this.matchData = matchData;
        this.goalData = goalData;

        this.margin = {top: 10, right: 30, bottom: 70, left: 70};
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
        .domain(vis.teamsData.map(t => t.team_code))
        .range([0, vis.width])
        .padding(0.05);

        vis.svg.append("g")
        .style("font-size", 15)
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(vis.x).tickSize(0))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-90)")
        .style("text-anchor", "end");
        //.select(".domain").remove()
        //.selectAll("text")
        //.attr("transform", "translate(-10,0)rotate(-45)")
        //.style("text-anchor", "end");

        // Initialize Y axis
        vis.y = d3.scaleBand()
        .domain(vis.teamsData.map(t => t.team_code))
        .range([vis.height,0])
        .padding(0.05);

        vis.svg.append("g")
        .style("font-size", 15)
        .call(d3.axisLeft(vis.y).tickSize(0))
        .select(".domain").remove()

        vis.myColor = d3.scaleSequential()
        .interpolator(d3.interpolateInferno)
        .domain([0,7])

        vis.setData();

      const tooltip = d3.select("#"+vis.parentId)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute");
    
      // Three function that change the tooltip when user hover / move / leave a cell
      const mouseover = function(event,d) {
        tooltip
          .style("opacity", 1)
        d3.select(this)
          .style("stroke", "black")
          .style("opacity", 1)
      }
      const mousemove = function(event,d) {
        tooltip
          .html(`${d.team1.teamName} vs ${d.team2.teamName}: Matches played: ${d.totalMatches}`)
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
      }
      const mouseleave = function(event,d) {
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("stroke", "none")
          .style("opacity", d => {
            if(d.totalMatches==0)
              return 0;
            else
              return 0.8;
          })
      }

        vis.svg.selectAll()
        .data(vis.activeData, function(d) {return d.team1.teamId+':'+d.team2.teamId;})
        .join("rect")
        .attr("x", function(d) { return vis.x(d.team1.teamCode) })
        .attr("y", function(d) { return vis.y(d.team2.teamCode) })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", vis.x.bandwidth() )
        .attr("height", vis.y.bandwidth() )
        .style("fill", function(d) { return vis.myColor(d.totalMatches)} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", d => {
          if(d.totalMatches==0)
            return 0;
          else
            return 0.8;
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

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

        let rivalTeams = new Set();

        let max = 0;

        for(let i=0;i<vis.teamsData.length;i++){
          for(let j=i+1;j<vis.teamsData.length;j++){
            let item = {
              team1:{
                teamId: vis.teamsData[i].team_id,
                teamName: vis.teamsData[i].team_name,
                teamCode: vis.teamsData[i].team_code,
                matchesWon: 0,
                goalMargin: 0
              },
              team2:{
                teamId: vis.teamsData[j].team_id,
                teamName: vis.teamsData[j].team_name,
                teamCode: vis.teamsData[j].team_code,
                matchesWon: 0,
                goalMargin: 0
              },
              totalMatches: 0
            }
            

            let totalMatches = vis.matchData.filter(m => (m.home_team_id==item.team1.teamId && m.away_team_id==item.team2.teamId) || (m.home_team_id==item.team2.teamId && m.away_team_id==item.team1.teamId));

            item.totalMatches = totalMatches.length;

            item.team1.matchesWon = totalMatches.filter(m => (m.home_team_id==item.team1.teamId && m.home_team_win==1) || (m.away_team_id==item.team1.teamId && m.away_team_win==1));
            item.team2.matchesWon = totalMatches.filter(m => (m.home_team_id==item.team2.teamId && m.home_team_win==1) || (m.away_team_id==item.team2.teamId && m.away_team_win==1));

            data.push(item);
            
          }
        }
        console.log(max);
        vis.activeData = data;
    }
}