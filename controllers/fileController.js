const multer  = require('multer')
const upload = multer({ dest: './public/uploads/' })
const asyncHandler = require("express-async-handler");
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.filePost = [
    upload.single('file'),

    asyncHandler(async function(req, res, next) {
        if (req.file) {
            const file = await prisma.file.create({
                data: {
                    ownerId: req.user.id,
                    name: req.file.originalname,
                    type: req.file.mimetype,
                    size: req.file.size,
                    url: req.file.path
                }
            })
            console.log(file)
        }
        res.redirect('/');
    })
]

