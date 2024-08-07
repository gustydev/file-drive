const multer  = require('multer')
const upload = multer({ dest: './public/uploads/' })
const asyncHandler = require("express-async-handler");
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.fileUpload = [
    upload.single('file'),

    asyncHandler(async function(req, res, next) {
        if (req.file) {
            const file = await prisma.file.create({
                data: {
                    ownerId: req.user.id,
                    name: req.file.originalname,
                    type: req.file.mimetype,
                    size: req.file.size,
                    url: req.file.path, // Later this should be a cloudinary url probably
                    folderId: Number(req.body.folder) || undefined
                }
            })
            console.log(file)
        }
        if (req.body.folder) {
            res.redirect(`/folder/${req.body.folder}`);
        } else {
            res.redirect('/')
        }
    })
]

exports.fileDetailGet = asyncHandler(async function(req, res, next) {
    const file = await prisma.file.findUnique({where: {id: req.params.id}, include: {folder: true}});
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