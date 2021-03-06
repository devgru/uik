var RED = 'rgb(211,56,0)';
var ORANGE = 'rgb(232,204,0)';
var YELLOW = 'rgb(234,239,0)';
var GREEN = 'rgb(109,193,55)';

var getUicColor = function (uic, palette) {
    if (palette == 'observers') {
        switch (uic.total) {
            case 0:
                return RED;
            case 1:
                return ORANGE;
            case 2:
                return YELLOW;
        }
        return GREEN;
    }
    var p = uic.outdoorPercents;
    if (p > 20) return RED;
    if (p > 10) return ORANGE;
    if (p > 5) return YELLOW;
    return GREEN;
};

// размеры рабочей области
var margin = {top: 20, right: 30, bottom: 80, left: 50},
    width = 1200 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var minY = 0.1;

// лог-шкала надомного голосования
var yOutdoor = d3.scale.log()
    .domain([minY, 100])
    .range([height, 0]);

// отступ для нуля на лог-шкале
var y0Offset = 50;

// нуль
var y0 = d3.scale.ordinal()
    .domain([0])
    .range([height + y0Offset]);

// рисуем ось для нуля
var y0Axis = d3.svg.axis()
    .scale(y0)
    .orient("left");

// рисуем основную ось
var yOutdoorAxis = d3.svg.axis()
    .scale(yOutdoor)
    .orient("left")
    .ticks(20, function (num) {
        if(num >= 1) return num;
        return num.toFixed(1).substring(1);
    });

var xSobyanin = d3.scale.linear()
    .domain([30, 100])
    .range([0, width]);

var xObservers = d3.scale.linear()
    .domain([0, 5])
    .range([0, width]);

var yObservers = d3.scale.linear()
    .domain([0, 5])
    .range([0, width]);

var xSobyaninAxis = d3.svg.axis()
    .scale(xSobyanin)
    .orient("top");

var xObserversAxis = d3.svg.axis()
    .scale(xObservers)
    .orient("bottom")
    .ticks(6)
    .tickFormat('');

$.get('http://devgru.github.io/uik/uiks.json', function (data) {

    var svg;
    svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "y axis")
        .call(yOutdoorAxis);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height + y0Offset) + ")")
        .call(xObserversAxis);

    svg.append("g")
        .attr("class", "y-zero axis")
        .call(y0Axis);

    var group = svg.append("g")
    var control = svg.append("g")
    var region = svg.append("g")
    var zeroRegion = svg.append("g")

    newbies = group
        .selectAll('circle')
        .data(data, function (uik) { return uik.uik; })
        .enter();

    var colorScale = d3.scale.linear()
        .domain([0, 100])
        .interpolate(d3.interpolateHsl)
        .range(["#1dbe61", "#1d52bd"]);

    newbies
        .append('circle')
        .attr('cx',function (uik) {
            return xObservers(uik.observer + Math.random());
        })
        .attr('cy',function (uik) {
            if (uik.outdoorPercents == 0) {
                return - Math.random() * 50 + yOutdoor(minY) + y0Offset;
            }
            return yOutdoor(uik.outdoorPercents);
        })
        .attr('fill', function (uik) { return colorScale(uik.sobyaninPercents)})
        .attr('r', 1.5)
        .attr('opacity', 0.8)
    ;


    var getPercent = function (percentBlock) {
        if(percentBlock == 0) return 0.1;
        if(percentBlock == 1) return 1;
        if(percentBlock == 2) return 10;
        if(percentBlock == 3) return 100;
    };

    var getPercentPair = function (percentBlock) {
        return { from: getPercent(percentBlock), to: getPercent(percentBlock + 1)};
    };

    var regions = [];
    var zeroRegions = [];
    for (var observers = 0; observers < 5; observers++) {
        var uiks = data.filter(function (uik) {
            return uik.observer == observers;
        });
        for (var percentBlock = 0; percentBlock < 3; percentBlock++) {
            var percentPair = getPercentPair(percentBlock);
            var thisUiks = uiks.filter(function (uik) {
                return uik.outdoorPercents > percentPair.from && uik.outdoorPercents <= percentPair.to;
            });

            regions.push(
                {
                    observers: observers,
                    percents: percentPair,
                    uiks: thisUiks
                }
            );
        }
        var thisUiks = uiks.filter(function (uik) {
            return uik.outdoorPercents == 0;
        });

        zeroRegions.push(
            {
                observers: observers,
                uiks: thisUiks
            }
        );
    }

    var regionsGroups = region
        .selectAll('g')
        .data(regions)
        .enter()
        .append('g');

    // квадраты регионов графика
    regionsGroups
        .append('rect')
        .attr('class', 'group')
        .attr('x', function (region) {
            return 0.5 + xObservers(region.observers);
        })
        .attr('y', function (region) {
            return 0.5 + yOutdoor(region.percents.to);
        })
        .attr('width', xObservers(1))
        .attr('height', yOutdoor(10) - yOutdoor(100))
    ;

    // прямоугольник для цифр
    regionsGroups
        .append('text')
        .attr('class', 'total')
        .attr('x', function (region) {
            return 0.5 + xObservers(region.observers) + xObservers(1) - 35;
        })
        .attr('y', function (region) {
            return 0.5 + 20 + yOutdoor(region.percents.to);
        })
        .text(function (region) {
            if(region.uiks.length == 0)
                return '';
            return region.uiks.length;
        })
    ;

    // прямоугольник для количества выделенных
    regionsGroups
        .append('text')
        .attr('class', 'selected')
        .attr('x', function (region) {
            return 0.5 + xObservers(region.observers) + xObservers(1) - 35;
        })
        .attr('y', function (region) {
            return 0.5 + 40 + yOutdoor(region.percents.to);
        })
        .text(function (region) {
            if(region.uiks.length == 0)
                return '';
            return 0;
        })
    ;

    var zeroRegionsGroups = zeroRegion
        .selectAll('g')
        .data(zeroRegions)
        .enter()
        .append('g');

    // квадраты регионов графика
    zeroRegionsGroups
        .append('rect')
        .attr('class', 'group')
        .attr('x', function (region) {
            return 0.5 + xObservers(region.observers);
        })
        .attr('y', 0.5 + yOutdoor(0.1))
        .attr('width', xObservers(1))
        .attr('height', 50)
    ;

    // прямоугольник для цифр
    zeroRegionsGroups
        .append('text')
        .attr('class', 'total')
        .attr('x', function (region) {
            return 0.5 + xObservers(region.observers) + xObservers(1) - 35;
        })
        .attr('y', 0.5 + 20 + yOutdoor(0.1))
        .text(function (region) {
            if(region.uiks.length == 0)
                return '';
            return region.uiks.length;
        })
    ;

    // прямоугольник для количества выделенных
    zeroRegionsGroups
        .append('text')
        .attr('class', 'selected')
        .attr('x', function (region) {
            return 0.5 + xObservers(region.observers) + xObservers(1) - 35;
        })
        .attr('y', 0.5 + 40 + yOutdoor(0.1))
        .text(function (region) {
            if(region.uiks.length == 0)
                return '';
            return 0;
        })
    ;

    var updateRegions = function () {
        region
            .selectAll('g')
            .data(regions)
            .select('text.selected')
            .text(function (region) {
                if(region.uiks.length == 0)
                    return '';
                return intersect(region.uiks, selectedUiks);
            })
        ;

        zeroRegion
            .selectAll('g')
            .data(zeroRegions)
            .select('text.selected')
            .text(function (region) {
                if(region.uiks.length == 0)
                    return '';
                return intersect(region.uiks, selectedUiks);
            })
        ;
    }


    for (var observers = 0; observers < 5; observers++) {
        (function(observers) {
            group
                .append('text')
                .attr('x', xObservers(observers) + xObservers(1)/2)
                .attr('y', 665)
                .attr('text-anchor', 'middle')
                .text(function () {
                    if(observers == 0) return "не было наблюдателей";
                    if(observers == 1) return "1 наблюдатель";
                    return observers + " наблюдателя";
                })
        })(observers)
    }


    var selectedUiks = [];

    var controlSelect = control
        .selectAll('circle')
        .data([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100])
        .enter();
    controlSelect
        .append('circle')
        .attr("class", "unclicked")
        .attr('cx', function(control) { return 800 + control * 3; })
        .attr('cy', 20)
        .attr('fill', function (d) { return colorScale(d)})
        .attr('r', 6)
        .on('click', function(control) {
            var button = d3.select(this);
            var wasUnclicked = button.classed('unclicked');
            button.classed('unclicked', !wasUnclicked);

            var relatedUiks = data.filter(function (uik) {
                var sp = uik.sobyaninPercents;
                var result = (sp < control) && (sp > (control - 5));
                return result;
            });
            if (wasUnclicked) {// теперь нажата
                selectedUiks = selectedUiks.concat(relatedUiks);
            } else {
                selectedUiks = selectedUiks.filter(function(item) {
                    return relatedUiks.indexOf(item) === -1;
                });
            }
            updateRegions();
            group
                .selectAll('circle')
                .data(relatedUiks, function (uik) { return uik.uik; })
                .attr('r', wasUnclicked ? 6 : 1.5)
        })
    ;

    controlSelect
        .append('circle')
        .attr('cx', function(control) { return 800 + control * 3; })
        .attr('cy', 20)
        .attr('fill', function (d) { return colorScale(d)})
        .attr('r', 1.5)
    ;

    /*
    newbies
        .append('circle')
        .attr('cx',function (uik) {
            return xObservers(uik.observer + uik.sobyaninPercents/100);
        })
        .attr('cy', function (uik) {
            if (uik.outdoorPercents == 0) return yOutdoor(minY) + y0Offset;
            return yOutdoor(uik.outdoorPercents);
        })
        .attr('fill', 'transparent')
        .attr('stroke', 'rgb(200,200,200)')
        .attr('r', 10);
    */

    d3.select('.y-zero.axis text').attr('y', -25);
});


function intersect(a, b) {
    var c = 0
    for (var i = 0; i < a.length; i++)
        if (b.indexOf(a[i]) != -1)
            c++;
    return c
}