exports.indexGet = function(req, res, next) {
    if (req.user) {
        res.render('index', { title: 'gDrive', user: req.user });
    } else {
        res.redirect('/login');
    }
};

