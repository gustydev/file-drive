const multer  = require('multer')
const upload = multer({ dest: './public/uploads/' })
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const prisma = require('../prisma/client');

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
                    folderId: req.body.folder || undefined
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
    const file = await prisma.file.findUnique({where: {id: req.params.id}, include: {folder: true, owner: true}});
    const folders = await prisma.folder.findMany();

    res.render('fileDetail', {
        file: file,
        user: req.user,
        folders: folders
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

exports.fileMove = [
    body('folder').custom(async (value) => {
        if (value === 'remove') {
            return;
        }
        
        const folder = await prisma.folder.findUnique({where: {id: value}});
        if (!folder) {
            throw new Error(`Invalid folder: ${value}`)
        }
    }),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            if (req.body.folder === 'remove') {
                await prisma.file.update({
                    where: {id: req.body.fileId},
                    data: {folderId: null}
                })
                res.redirect('/');
            } else {
                await prisma.file.update({
                    where: {id: req.body.fileId},
                    data: {folderId: req.body.folder}
                })
                res.redirect(`/folder/${req.body.folder}`)
            }
        } else {
            const file = await prisma.file.findUnique({where: {id: req.params.id}, include: {folder: true, owner: true}});
            const folders = await prisma.folder.findMany();

            res.render('fileDetail', {
                file: file,
                user: req.user,
                folders: folders,
                errors: errors.array()
            })
        }
    })
]