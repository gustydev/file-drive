const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const prisma = require('../prisma/client')
const path = require('path');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    secure: true
});

exports.viewFolderGet = asyncHandler(async function(req,res,next) {
    const folder = await prisma.folder.findUnique({ where: {id: req.params.id}, include: {files: true, owner: true} });
    res.render('folderDetail', {
        title: `Folder: ${folder.name}`,
        folder: folder,
        user: req.user
    })
});

exports.newFolderPost = [
    body('folder').trim().isLength({min: 1}).withMessage('Folder must have a name')
    .isLength({max: 50}).withMessage('Folder name has a maximum length of 50 characters')
    .trim(),

    asyncHandler(async function(req,res,next) {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            await prisma.folder.create({
                data: {
                    name: req.body.folder,
                    ownerId: req.user.id
                }
            });
            res.redirect('/');
        } else {
            res.render('index', {
                title: 'File Drive',
                user: req.user,
                errors: errors.array()
            })
        }
    })
]

exports.deleteFolderGet = asyncHandler(async function(req, res, next) {
    const folder = await prisma.folder.findUnique({ where: {id: req.params.id}, include: {files: true, owner: true} });
    res.render('folderDelete', {
        title: `Delete folder: ${folder.name}`,
        folder: folder,
        user: req.user
    })
})

exports.deleteFolderPost = [
    body('fileOption').custom(async (value, {req}) => {
        const files = await prisma.file.findMany({where: {folderId: req.params.id}});

        if (!files.length) { // If folder is empty, proceed with deletion regardless of fileOption value
            return true
        }
        
        if (!['keep', 'delete'].includes(value)) {
            throw new Error('Invalid option for file handling (must either keep or delete)')
        }
    }),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            if (req.body.fileOption === 'keep') {
                await prisma.file.updateMany({
                    where: {
                      folderId: req.params.id
                    },
                    data: {
                      folderId: undefined,
                      shared: false
                    },
                  })
            }
            
            if (req.body.fileOption === 'delete') {
                const files = await prisma.file.findMany({where: {folderId: req.params.id}})
                files.forEach((file) => {
                    file.publicId = path.parse(file.url.substring(62)).name;
                })

                await Promise.all(files.map(async (file) => {
                    await cloudinary.uploader.destroy(file.publicId)
                    .then(async () => {
                        await prisma.file.delete({where: {id: file.id}}); // Only delete from database if it's deleted from cloud first
                    })
                    .catch(error => console.log('Error deleting file from cloudinary: ', error));
                }))
            }
            
            await prisma.folder.delete({where: {id: req.params.id}});

            res.redirect('/')
        } else {
            const folder = await prisma.folder.findUnique({ where: {id: req.params.id}, include: {files: true, owner: true} });
            res.render('folderDelete', {
                folder: folder,
                user: req.user,
                errors: errors.array()
            })
        }
    })
]

exports.folderShareGet = asyncHandler(async function(req, res, next) {
    const folder = await prisma.folder.findUnique({ where: {id: req.params.id}, include: {files: true, owner: true} });

    res.render('share', {
        title: `Share folder: ${folder.name}`,
        folder: folder,
        user: req.user
    })
})

exports.folderSharePost = [
    body('duration').isNumeric().withMessage('Duration must be a number')
    .isLength({min: 0}).withMessage('Duration must be at least 0 days')
    .custom((value) => {
        return !isNaN(new Date(Date.now() + value * 86400000)) // isNaN checks if date is invalid (true = invalid, false = valid). Invert to validate duration
    }).withMessage('Invalid date (probably too many days inserted)'),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            const sharedFolder = await prisma.folder.update({
                where: {
                    id: req.params.id
                },
                data: {
                    shared: true,
                    shareExpires: new Date(Date.now() + req.body.duration * 86400000) // number of days (user input) * milliseconds in a day
                },
                include: {
                    owner: true
                }
            })

            await prisma.file.updateMany({
                where: {
                    folder: {
                        id: req.params.id
                    }
                },
                data: {
                    shared: true,
                    shareExpires: new Date(Date.now() + req.body.duration * 86400000)
                }
            })

            res.render('share', {
                title: `Share folder: ${sharedFolder.name}`,
                folder: sharedFolder,
                user: req.user
            })

        } else {
            const folder = await prisma.folder.findUnique({ where: {id: req.params.id}, include: {files: true, owner: true} });

            res.render('share', {
                title: `Share folder: ${folder.name}`,
                folder: folder,
                user: req.user,
                errors: errors.array()
            })
        }
    }) 
]

exports.displaySharedFolder = asyncHandler(async function(req, res, next) {
    const folder = await prisma.folder.findFirst({where: {shareId: req.params.id}, include: {owner: true, files: true}});

    res.render('shareFolder', {
        title: `Shared folder: ${folder.name}`,
        folder: folder,
        user: req.user
    })
}) 