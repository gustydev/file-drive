const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const bcrypt = require('bcryptjs')
const passport = require("passport");
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.indexGet = function(req, res, next) {
    res.render('index', { title: 'gDrive' });
};

exports.signupGet = function(req, res, next) {
    res.render('signup', {title: 'Sign up'})
};

exports.signupPost = [
    // validate and sanitize inputs
    body('username', 'Username is required').isLength({min: 1}).custom(async (value) => {
        console.log(username)
        const user = await prisma.user.findFirst({where: {name: username}});
        console.log(user)
        if (user) {
            throw new Error(`Username '${value}' already in use. Please try a different one.`)
        }
    }).trim().escape(),
    body('password').notEmpty().withMessage('Password is required').trim().escape(),
    body('passwordConfirm').custom((value, {req}) => {
        if (value === req.body.password) {
            return true
        } else {
            throw new Error('Passwords do not match!')
        }
    }),

    asyncHandler(async function(req, res, next) {
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            try {
                bcrypt.hash(req.body.password, 10, async(err, hashedPass) => {
                    if (err) {
                        return next(err)
                    }

                    const user = {
                        username: req.body.username,
                        password: hashedPass,
                        joined: new Date()
                      }

                    // await user.save()
                    // ^ that would be replaced by prisma command
                    console.log(user);
                    res.render('/', {
                        title: 'Log in success',
                        user: user
                    })
                })
              } catch {
                return next(err)
              }
        } else {
            res.render('signup', {
                title: 'Sign up', 
                username: req.body.username,
                errors: errors.array()
            })
        }
    })
];

