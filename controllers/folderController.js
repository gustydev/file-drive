const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const prisma = require('../prisma/client')

exports.viewFolderGet = asyncHandler(async function(req,res,next) {
    const folder = await prisma.folder.findUnique({ where: {id: req.params.id}, include: {files: true, owner: true} });
    res.render('folderDetail', {
        folder: folder,
        user: req.user
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