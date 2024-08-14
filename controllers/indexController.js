exports.indexGet = function(req, res, next) {
    if (req.user) {
        res.render('index', { title: 'File Drive', user: req.user });
    } else {
        res.redirect('/login');
    }
};

