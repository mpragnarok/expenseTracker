const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const bcrypt = require('bcryptjs')


const User = require('../src/models/user')

module.exports = passport => {
  // setup local passport
  passport.use(
    new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
      try {

        const user = await User.findOne({ email })
        if (!user) {
          return done(null, false, { message: 'That email is not registered' })
        }
        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
          return done(null, user)
        } else {
          return done(user.errors, null, { message: 'Email or password incorrect' })
        }

      } catch (e) {
        throw e
      }
    })
  )
  // setup facebook passport
  passport.use(
    new FacebookStrategy({
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: (process.env.CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/facebook/callback',
        profileFields: ['email', 'displayName']
      },
      async (accessToken, refreshToken, profile, done) => {
        // find and create user
        const user = await User.findOne({
          email: profile._json.email
        })
        try {
          // if email is not exists, create a new user
          if (!user) {
            let randomPassword = Math.random().toString(36).slice(-8)
            const hash = await bcrypt.hash(randomPassword, 8)
            let newUser = User({
              name: profile._json.name,
              email: profile._json.email,
              password: hash
            })
            await newUser.save()
            return done(null, user)
          }
          return done(null, user)
        } catch (e) {
          console.log(e)
        }
      }
    )
  )
  // passport serializeUser & deserializeUser
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user)
    })
  })
}