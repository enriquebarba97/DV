var mapGlobal;
var goalsPerMinuteGlobal;
var teamData;

Promise.all([d3.json('data/custom.geo.json'),
            d3.csv('data/teams.csv'),
            d3.csv('data/goals.csv')])
        .then(function(loaded){
            teamData = loaded[1]
            mapGlobal = new FilterMap('map-holder',loaded[0],teamData,960,500);
            goalsPerMinuteGlobal = new GoalsPerMinute('goals-per-minute',loaded[2],960,500);
        });
