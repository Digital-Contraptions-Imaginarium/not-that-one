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
    jyql('select * from json where url="https://raw.github.com/' + qs.githubUsername + '/not-that-one-db/master/tells.json" and itemPath = "json"', function (err, tempTells) { 
        tells = tempTells.query.results.json.json.reduce(function (memo, tell) {
            memo[tell.name] = tell;
            return memo;
        }, { });
        async.each(Object.keys(tells), function (tellName, callback) {
            jyql('select * from json where url="https://raw.github.com/' + qs.githubUsername + '/not-that-one-db/master/tells/' + tellName + '.json" and itemPath = "json.products"', function (err, tellData) { 
                tells[tellName].products = [ ].concat(tellData.query.results.products);
                callback(null);
            });
        }, function (err) {
            jyql('select * from json where url="https://raw.github.com/' + qs.githubUsername + '/not-that-one-db/master/whitelist.json" and itemPath = "json.products"', function (err, whitelistedProducts) { 
                database = { whitelist: { products: [ ].concat(whitelistedProducts.query.results.products) }, tells: tells };
                callback(err);
            });
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

var isWhitelisted = function (barcode, callback) {
    callback(null, database.whitelist.products.some(function (product) {
        return (product.barcode.contents == barcode.contents) &&
               (product.barcode.format == barcode.format) &&
               (product.barcode.type == barcode.type);
    }));  
}

var findMaxWarningLevel = function (barcode, callback) {
    isWhitelisted(barcode, function (err, whitelisted) {
        if (whitelisted) {
            callback(err, 0);
        } else {
            findProductTells(barcode, function (err, tells) {
                callback(err, tells.reduce(function (memo, tell) {
                    return parseInt(tell.warning_level) > memo ? parseInt(tell.warning_level) : memo;
                }, -1));
            });
        }
    });
}

var findProductTellsForDisplay = function (barcode, callback) {
    var maxWarningLevel = -1,
        tellsMessages = [ ];
    isWhitelisted(barcode, function (err, whitelisted) {
        if (whitelisted) {
            callback(err, { maxWarningLevel: 0, tellsMessage: [ ] });
        } else {
            findProductTells(barcode, function (err, tells) {
                tellsMessages = tells.map(function (t) { return [ parseInt(t.warning_level), t.description ]; }).sort(function (a, b) { return a[0] - b[0]; });
                callback(err, { maxWarningLevel: (tellsMessages[0] || [ -1 ])[0], tellsMessages: tellsMessages });
            });
        }
    });
}

var database = { };