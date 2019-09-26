const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Create user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: 'User'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: {
      type: Date,
      default: Date.now
    }
  }
})

// Hash the plain text password before saving
userSchema.pre('save', async function(next) {
  const user = this
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }
  next()
})

// export user model
const User = mongoose.model('User', userSchema)

module.exports = User