const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const prisma = require('../prisma/client');
const multer  = require('multer')
const maxSize = 3 * 1024 * 1024; // 3 MB
const upload = multer({ dest: './public/uploads/', limits: {fileSize: maxSize} })

exports.fileDetailGet = asyncHandler(async function(req, res, next) {
    const file = await prisma.file.findUnique({where: {id: req.params.id}, include: {folder: true, owner: true}});
    const folders = await prisma.folder.findMany({where: {owner: {id: req.user.id}}});
    
    res.render('fileDetail', {
        file: file,
        user: req.user,
        folders: folders
    })
}) 

exports.fileUpload = [
    upload.single('file'), // Add custom error handling for files larger than 3MB later

    asyncHandler(async function(req, res, next) {
        if (req.file) {
            await prisma.file.create({
                data: {
                    ownerId: req.user.id,
                    name: req.file.originalname,
                    type: req.file.mimetype,
                    size: req.file.size,
                    url: req.file.path, // Later this should be a cloudinary url probably
                    folderId: req.body.folder || undefined
                }
            })
        }

        if (req.body.folder) {
            res.redirect(`/folder/${req.body.folder}`)
        } else {
            res.redirect('/')
        }
    })
]

exports.fileDownload = [
    body('fileId').custom(async (value) => {
        const file = await prisma.file.findUnique({where: {id: value}});

        if (!file) {
            throw new Error(`Invalid file ID: ${value}`)
        }
    }),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req);
        
        if (errors.isEmpty()) {
            const file = await prisma.file.findUnique({where: {id: req.body.fileId}});
            res.download(file.url, file.name, (err) => {
                if (err) {
                    next(err)
                }
            })
        }
        else {
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

exports.fileMove = [
    body('fileId').custom(async (value) => {
        const file = await prisma.file.findUnique({where: {id: value}});
        if (!file) {
            throw new Error(`Invalid file ID: ${value}`)
        }
    }),

    body('folder').custom(async (value) => {
        if (value === 'remove') {
            return;
        }

        const folder = await prisma.folder.findUnique({where: {id: value}});
        if (!folder) {
            throw new Error(`Invalid folder ID: ${value}`)
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

exports.fileDelete = [
    body('fileId').custom(async (value) => {
        const file = await prisma.file.findUnique({where: {id: value}});
        if (!file) {
            throw new Error(`Invalid file ID: ${value}`)
        }
    }),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req);
        
        if (errors.isEmpty()) {
            await prisma.file.delete({where: {id: req.body.fileId}});
            // Add later: remove from cloud hosting as well, not just the database
        }

        if (req.body.folder) {
            res.redirect(`/folder/${req.body.folder}`)
        } else {
            res.redirect('/')
        }
    })
]