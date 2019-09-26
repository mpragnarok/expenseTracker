const mongoose = require('mongoose')
const Schema = mongoose.Schema
var Float = require('mongoose-float').loadType(mongoose)

const recordSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String
  },
  subCategory: {
    type: String,
    required: true
  },
  amount: {
    type: Float,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  month: {
    type: String
  },
  year: {
    type: String
  },
  day: {
    type: String
  },
  sign: {
    type: String
  },
  icon: {
    type: String
  },
  merchant: {
    type: String
  },
  subCategoryNum: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true
  }

}, {
  timestamps: true
})



const Record = mongoose.model('Record', recordSchema)

module.exports = Record