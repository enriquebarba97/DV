var mapGlobal;
var goalsPerMinuteGlobal;
var consistencyGlobal;
var heatmapGlobal;
var teamData;
var teamColors = ['#e41a1c','#377eb8','#4daf4a'];

function updateGoalChart(filters){
    goalsPerMinuteGlobal.updateFilter(Array.from(filters));
}

function updateConsistencyChart(filters){
    consistencyGlobal.updateFilter(Array.from(filters))
}

Promise.all([d3.json('data/custom.geo.json'),
            d3.csv('data/teams.csv'),
            d3.csv('data/goals.csv'),
            d3.csv('data/tournaments.csv'),
            d3.csv('data/matches.csv'),
            d3.csv('data/squads.csv'),
            d3.csv('data/qualified_teams.csv'),
            d3.csv('data/tournament_standings.csv')])
        .then(function(loaded){
            teamData = loaded[1]
            mapGlobal = new FilterMap('map-holder',loaded[0],teamData,loaded[6],loaded[7],672,350);
            goalsPerMinuteGlobal = new GoalsPerMinute('goals-per-minute',loaded[2],672,350);
            consistencyGlobal = new Consistency("consistency",loaded[3],loaded[2],loaded[4],loaded[5],672,350);
            heatmapGlobal = new Heatmap('heatmap',teamData,loaded[2],loaded[4],600,600);
        });