class GoalsPerMinute {
    constructor(parentId, goalData, width, height){
        this.parentId = parentId;
        this.goalData = goalData;
        this.filters = [];

        this.margin = {top: 10, right: 30, bottom: 30, left: 40};
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

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

        // Initialize and draw X axis
        vis.minutes = d3.scaleLinear()
        .domain([0, 120])
        .range([0, vis.width]);

        vis.svg.append("g")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(vis.minutes));

        // Initialize Y axis
        vis.y = d3.scaleLinear()
        .range([vis.height, 0]);
        vis.yAxis = vis.svg.append("g");

        // Create histogram function
        vis.histogram = d3.bin()
        .value(function(d) { return d.minute_regulation; })   // I need to give the vector of value
        .domain(vis.minutes.domain())  // then the domain of the graphic
        .thresholds([15,30,45,60,75,90,105,120]); // 15 minutes intervals

        vis.activeData = vis.goalData;

        vis.drawAxis();
        vis.drawBars();

    }

    setData(){
        let vis = this;

        if(vis.filter.length == 0){
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
    }

    drawAxis(){
        let vis = this;

        vis.bins = vis.histogram(vis.activeData);

        // Y axis: update now that we know the domain
        vis.y.domain([0, d3.max(vis.bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
        vis.yAxis
        .transition()
        .duration(1000)
        .call(d3.axisLeft(vis.y));
    }

    drawBars(){
        let vis = this;
        vis.u = vis.svg.selectAll("rect")
        .data(vis.bins);

        // Manage the existing bars and eventually the new ones:
        vis.u
        .join("rect") // Add a new rect for each new elements
        .transition() // and apply changes to all of them
        .duration(1000)
        .attr("x", 1)
        .attr("transform", function(d) { return `translate(${vis.minutes(d.x0)}, ${vis.y(d.length)})`})
        .attr("width", function(d) { return vis.minutes(d.x1) - vis.minutes(d.x0) -1 ; })
        .attr("height", function(d) { 
            return vis.height - vis.y(d.length); })
        .style("fill", "#69b3a2");
    }

    updateFilter(filteredTeams){
        let vis = this;
        
        vis.filters = filteredTeams;
        vis.activeData = this.goalData.filter(g => filteredTeams.includes(g.team_id));

        vis.drawAxis();
        vis.drawBars();
    }
}