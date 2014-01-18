var qs = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=');
        if (p.length != 2) continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

var readDatabase = function (callback) {
    var tells = [ ];
    database = { };
    // for the time being, the database is just made of the 'tells'
	d3.json("./data/tells.json", function (tempTells) {
        tells = tempTells.reduce(function (memo, tell) {
            memo[tell.name] = tell;
            return memo;
        }, { });
        async.each(Object.keys(tells), function (tellName, callback) {
            d3.json("./data/tells/" + tellName + ".json", function (tellData) {
                tells[tellName].products = tellData.products;
                callback(!tellData.products);
            });
        }, function (err) {
            database = { tells: tells };
            console.log(JSON.stringify(database));
            callback(err);
        });
    });
}

var readProductTells = function (barcode, callback) {
    callback(null, { });
}

var database = { };