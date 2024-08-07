const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.viewFolderGet = asyncHandler(async function(req,res,next) {
    const folder = await prisma.folder.findUnique({ where: {id: Number(req.params.id)}, include: {files: true} });
    console.log(folder)
    res.render('folderDetail', {
        folder: folder
    })
});

exports.newFolderPost = [
    body('folder').isLength({min: 1}).withMessage('Folder must have a name')
    .isLength({max: 50}).withMessage('Folder name has a maximum length of 50 characters')
    .trim(),

    asyncHandler(async function(req,res,next) {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const folder = await prisma.folder.create({
                data: {
                    name: req.body.folder,
                    ownerId: req.user.id
                }
            });
            console.log(folder);
            res.redirect('/');
        } else {
            res.render('index', {
                title: 'gDrive',
                user: req.user,
                errors: errors.array()
            })
        }
    })
]