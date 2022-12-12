let geoData = d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
geoData.then(function (data){
    myMapVisGlobal = new MapVisGlobal('mapDiv', data, undefined)
})

// const svg = d3.select('#mapDiv').append('svg');
// const projection = d3.geoNaturalEarth1();
// const pathGenerator = d3.geoPath().projection(projection);
// svg.append('path')
//     .attr('class', 'sphere')
//     .attr('d', pathGenerator({type: 'Sphere'}));
// d3.json('https://unpkg.com/world-atlas@1.1.4/world/110m.json')
//   .then(data => {
//     const countries = topojson.feature(data, data.objects.countries);
//     svg.selectAll('path').data(countries.features)
//       .enter().append('path')
//         .attr('class', 'country')
//         .attr('d', pathGenerator);
//   });