const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const prisma = require('../prisma/client');
const multer  = require('multer')
const storage = multer.memoryStorage();
const path = require('path');
const maxSize = 3 * 1024 * 1024; // 3 MB
const upload = multer({ storage: storage, limits: {fileSize: maxSize} }).single('file');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    secure: true
});

exports.fileDetailGet = asyncHandler(async function(req, res, next) {
    const file = await prisma.file.findUnique({where: {id: req.params.id}, include: {folder: true, owner: true}});
    const folders = req.user ? await prisma.folder.findMany({where: {owner: {id: req.user.id}}}) : undefined;
    
    const downloadName = path.parse(file.name).name.replace(/[^\w\s]/gi, ''); // special characters make the file undownloadable from cloudinary       
    const url = file.url.replace('upload', `upload/fl_attachment:${downloadName}`)

    res.render('fileDetail', {
        title: `File: ${file.name}`,
        file: file,
        user: req.user,
        folders: folders,
        url: url
    })
}) 

exports.fileUpload = [
    upload,

    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            // Custom error message for file size limit exceeded
            if (err.code === 'LIMIT_FILE_SIZE') {
                req.fileValidationError = 'File size exceeds 3MB limit';
            } else {
                req.fileValidationError = err.message;
            }
        }
        next();
    },

    asyncHandler(async function(req, res, next) {
        let fileError = req.fileValidationError || (!req.file ? 'Invalid file' : req.file.size === 0 ? 'File is too small (0 bytes)' : null);
        const folder = await prisma.folder.findUnique({ where: {id: req.body.folder}, include: {files: true, owner: true} });
        
        if (fileError) {
            if (req.body.folder) {
                res.render('folderDetail', {
                    folder: folder,
                    user: req.user,
                    errors: [{msg: fileError}]
                })
            } else {
                res.render('index', { 
                    title: 'File Drive', 
                    user: req.user, 
                    errors: [{msg: fileError}]
                });
            }
            return;
        }

        if (!fileError && req.file) {
            const data = {
                ownerId: req.user.id,
                name: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
                type: req.file.mimetype,
                size: req.file.size,
                url: undefined,
                folderId: req.body.folder || undefined,
                shared: folder.shared,
                shareExpires: folder.shareExpires
            };

            await new Promise((resolve) => {
                cloudinary.uploader.upload_stream({resource_type: 'auto'}, (error, uploadResult) => {
                    return resolve(uploadResult);
                }).end(req.file.buffer)
            }).then((uploadResult) => {
                console.log(`Buffer upload_stream wth promise success - ${uploadResult.public_id}`);
                data.url = uploadResult.secure_url;
            })

            await prisma.file.create({
                data: data
            });
        }

        if (req.body.folder) {
            res.redirect(`/folder/${req.body.folder}`)
        } else {
            res.redirect('/')
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
            const file = await prisma.file.findUnique({where: {id: req.body.fileId}});
            const filePublicId = path.parse(file.url.substring(62)).name; // Extracts only the file's public id from cloudinary
            
            await cloudinary.uploader.destroy(filePublicId)
            .then(async () => {
                await prisma.file.delete({where: {id: req.body.fileId}}); // Only delete from database if it's deleted from cloud first
            })
            .catch(error => console.log('Error deleting file from cloudinary: ', error));
            
        }

        if (req.body.folder) {
            res.redirect(`/folder/${req.body.folder}`)
        } else {
            res.redirect('/')
        }
    })
]

exports.fileShareGet = asyncHandler(async function (req, res, next) {
    const file = await prisma.file.findUnique({where: {id: req.params.id}, include: {owner: true}});

    res.render('share', {
        title: `Share file: ${file.name}`,
        file: file,
        user: req.user
    })
}) 

exports.fileSharePost = [
    body('duration').isNumeric().withMessage('Duration must be a number')
    .isLength({min: 0}).withMessage('Duration must be at least 0 days'),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            const sharedFile = await prisma.file.update({
                where: {id: req.params.id},
                data: {
                    shared: true,
                    shareExpires: new Date(Date.now() + req.body.duration * 86400000) // number of days (user input) * milliseconds in a day
                },
                include: {owner: true}
            })
            
            res.render('share', {
                title: `Share file: ${sharedFile.name}`,
                file: sharedFile,
                user: req.user
            })

        } else {
            const file = await prisma.file.findUnique({where: {id: req.params.id}, include: {owner: true}});

            res.render('share', {
                title: `Share file: ${file.name}`,
                file: file,
                user: req.user,
                errors: errors.array()
            })
        }
    })
]

exports.displaySharedFile = asyncHandler(async function(req, res, next) {
    const file = await prisma.file.findFirst({where: {shareId: req.params.id}, include: {owner: true, folder: true}});
    const downloadName = path.parse(file.name).name.replace(/[^\w\s]/gi, ''); // special characters make the file undownloadable from cloudinary       
    const url = file.url.replace('upload', `upload/fl_attachment:${downloadName}`)

    res.render('shareFile', {
        title: `Shared file: ${file.name}`,
        file: file,
        url: url,
        user: req.user
    })
}) 