const mongoose = require('mongoose')
const Record = require('../record')
const User = require('../user')
const { users } = require('./user.json')
const { records } = require('./record.json')


mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense', { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })

const db = mongoose.connection
db.on('error', async () => {
  console.log('db error')
})

db.once('open', () => {
  console.log('db connected!')

  users.forEach((user) => {
    const newUser = new User({
      email: user.email,
      password: user.password
    })
    newUser.save()

    records.splice(-3).forEach((record) => {
      Record.create({
        name: record.name,
        date: record.date,
        category: record.category,
        subCategory: record.subCategory,
        amount: record.amount,
        merchant: record.merchant,
        month: record.month,
        year: record.year,
        day: record.day,
        sign: record.sign,
        icon: record.icon,
        subCategoryNum: record.subCategoryNum,
        userId: newUser._id
      })

    })
  })

  console.log('done')
})