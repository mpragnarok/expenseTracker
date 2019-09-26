const express = require('express')
const router = express.Router()
const passport = require('passport')

// user login with Facebook
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
)

// authentication grant
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/users/login'
  })
)

module.exports = router