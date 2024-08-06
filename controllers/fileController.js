const multer  = require('multer')
const upload = multer({ dest: './public/uploads/' })

exports.filePost = [
    upload.single('file'),

    function(req, res, next) {
        if (req.file) {
            res.render('index', {
                title: 'gDrive',
                user: req.user,
                file: req.file
            })
            // this will obviously be replaced later
        }
    }
]

