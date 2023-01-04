class GoalsPerMinute {
    constructor(parentId, goalData, width, height){
        this.parentId = parentId;
        this.goalData = goalData;
        this.filters = [];

        this.margin = {top: 50, right: 30, bottom: 40, left: 40};
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

        vis.svg.append("text")
        .attr("x", 0)
        .attr("y", -30)
        .attr("text-anchor", "left")
        .style("font-size", "22px")
        .text("Number of goals, in bins of 15 minutes");

        // Initialize and draw X axis
        vis.binGroups = ["0-15","15-30","30-45","45-60","60-75","75-90","90-105","105-120"]

        vis.minutes = d3.scaleBand()
        .domain(vis.binGroups)
        .range([0, vis.width]);

        vis.svg.append("g")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(vis.minutes).tickSize(0))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

        // Initialize Y axis
        vis.y = d3.scaleLinear()
        .range([vis.height, 0]);
        vis.yAxis = vis.svg.append("g");

        vis.setData();
        vis.drawAxis();
        vis.drawBars();

    }

    setData(){
        let vis = this;

        // No filters => all data
        if(vis.filters.length == 0){
            vis.activeData = this.goalData;
        } else{
            vis.activeData = this.goalData.filter(g => vis.filters.includes(g.team_id));
        }

        vis.activeData = vis.activeData.map(g =>{
            let goalData = g;
            if(g.minute_regulation >=0 && g.minute_regulation <= 15){
                goalData.minuteBin = "0-15"
            } else if(g.minute_regulation > 15 && g.minute_regulation <= 30){
                goalData.minuteBin = "15-30"
            } else if(g.minute_regulation > 30 && g.minute_regulation <= 45){
                goalData.minuteBin = "30-45"
            } else if(g.minute_regulation > 45 && g.minute_regulation <= 60){
                goalData.minuteBin = "45-60"
            } else if(g.minute_regulation > 60 && g.minute_regulation <= 75){
                goalData.minuteBin = "60-75"
            } else if(g.minute_regulation > 75 && g.minute_regulation <= 90){
                goalData.minuteBin = "75-90"
            } else if(g.minute_regulation > 90 && g.minute_regulation <= 105){
                goalData.minuteBin = "90-105"
            } else if(g.minute_regulation > 105 && g.minute_regulation <= 120){
                goalData.minuteBin = "105-120"
            }
            return goalData;
        });

        if(vis.filters.length === 0){
            vis.rolledData = d3.rollup(vis.activeData,v=>v.length,d=>d.minuteBin);
        } else{
            vis.rolledData = d3.rollup(vis.activeData,v=>v.length,d=>d.minuteBin,d=>d.team_id);
        }
    }

    drawAxis(){
        let vis = this;

        //vis.bins = vis.histogram(vis.activeData);
        let upperBound = 0;
        if(vis.filters.length === 0){
            for (const value of vis.rolledData.values()) {
                upperBound = value > upperBound ? value:upperBound
              }
        }else{
            for (const value of vis.rolledData.values()) {
                for (const team of value.values()){
                    upperBound = team > upperBound ? team:upperBound
                }
              }
        }

        // Y axis: update now that we know the domain
        vis.y.domain([0, upperBound]);   // d3.hist has to be called before the Y axis obviously
        vis.yAxis
        .transition()
        .duration(1000)
        .call(d3.axisLeft(vis.y));
    }

    drawBars(){
      let vis = this;

      // Another scale for subgroup position
      const xSubgroup = d3
        .scaleBand()
        .domain(vis.filters)
        .range([0, vis.minutes.bandwidth()])
        .padding([0.1]);

      // color palette = one color per subgroup
      vis.color = d3
        .scaleOrdinal()
        .domain(vis.filters)
        .range(vis.teamColors.slice(0, vis.length));

      vis.svg.selectAll("rect").remove();

      vis.svg
        .append("g")
        .selectAll("g")
        // Enter in data = loop group per group
        .data(vis.rolledData)
        .join("g")
        .attr("transform", (d) => `translate(${vis.minutes(d[0])}, 0)`)
        .selectAll("rect")
        .data(function (d) {
          if (vis.filters.length === 0) {
            return [{ key: "A", value: d[1] !== undefined ? d[1] : 0 }];
          } else {
            return vis.filters.map(function (key) {
              let result = {
                key: key,
                value: d[1].get(key) !== undefined ? d[1].get(key) : 0,
              };
              return result;
            });
          }
        })
        .join("rect")
        .transition() // and apply changes to all of them
        .duration(1000)
        .attr("x", (d) => (d.key === "A" ? 5 : xSubgroup(d.key)))
        .attr("y", (d) => vis.y(d.value))
        .attr("width", xSubgroup.bandwidth())
        .attr("height", (d) => {
          let result = vis.height - vis.y(d.value);
          if (isNaN(result)) {
            return 0;
          }
          return vis.height - vis.y(d.value);
        })
        .style("fill", (d) => {
          if (vis.filters.length === 0) return "#69b3a2";
          else return vis.color(d.key);
        });
    }

    updateFilter(filteredTeams){
        let vis = this;

        vis.filters = filteredTeams;

        vis.setData();
        vis.drawAxis();
        vis.drawBars();
    }
}