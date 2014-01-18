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

var makeDatabaseUrl = function (githubUsername) {
    return "./data";
    // return "https://raw.github.com/" + githubUsername + "/not-that-one-db/master";
}

var readDatabase = function (callback) {
    var tells = [ ];    
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
            callback(err);
        });
    });
}

var findProductTells = function (barcode, callback) {
    var tells = [ ];
    Object.keys(database.tells).forEach(function (tellName) {
        database.tells[tellName].products.forEach(function (product) {
            if (
                (product.barcode.contents == barcode.contents) &&
                (product.barcode.format == barcode.format) &&
                (product.barcode.type == barcode.type)
            ) {
                tells = tells.concat(database.tells[tellName]);
            }
        });
    });
    callback(null, tells);
}

var database = { };