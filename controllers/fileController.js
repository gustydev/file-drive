const multer  = require('multer')
const upload = multer({ dest: './public/uploads/' })
const asyncHandler = require("express-async-handler");
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.newFilePost = [
    upload.single('file'),

    asyncHandler(async function(req, res, next) {
        if (req.file) {
            const file = await prisma.file.create({
                data: {
                    ownerId: req.user.id,
                    name: req.file.originalname,
                    type: req.file.mimetype,
                    size: req.file.size,
                    url: req.file.path // Later this should be a cloudinary url probably
                }
            })
            console.log(file)
        }
        res.redirect('/');
    })
]

exports.fileDetailGet = asyncHandler(async function(req, res, next) {
    const file = await prisma.file.findUnique({where: {id: req.params.id}});
    res.render('fileDetail', {
        file: file
    })
}) 

exports.fileDownload = asyncHandler(async function(req, res, next) {
    const file = await prisma.file.findUnique({where: {id: req.body.fileId}});
    res.download(file.url, file.name, (err) => {
        if (err) {
            next(err)
        }
    })
}) 