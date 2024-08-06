const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const bcrypt = require('bcryptjs')
const passport = require("passport");
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.signupGet = function(req, res, next) {
    res.render('signup', {title: 'Sign up'})
};

exports.signupPost = [
    // validate and sanitize inputs
    body('username', 'Username is required').isLength({min: 1}).custom(async (value) => {
        const user = await prisma.user.findFirst({where: {name: value}});
        if (user) {
            throw new Error(`Username '${value}' already in use. Please try a different one.`)
        }
    }).trim().escape(),
    body('password').notEmpty().withMessage('Password is required').trim().escape(),
    body('confirm-password').custom((value, {req}) => {
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

                    const user = await prisma.user.create({
                        data: {
                            name: req.body.username,
                            password: hashedPass
                        }
                    });
                    res.redirect('/login');
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

exports.loginGet = function(req, res, next) {
    res.render('login', {errors: req.session.messages})
}

exports.loginPost = passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureMessage: true
});

exports.logoutGet = function(req, res, next) {
    req.logout(function(err) {
        if (err) {
            return next(err)
        }
        res.redirect('/');
    })
}