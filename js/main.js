var mapGlobal;
var teamData;

Promise.all([d3.json('data/custom.geo.json'),
            d3.csv('data/teams.csv')])
        .then(function(loaded){
            teamData = loaded[1]
            mapGlobal = new FilterMap('map-holder',loaded[0],teamData);
        });
