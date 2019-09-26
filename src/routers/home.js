const express = require('express')
const router = express.Router()
const Record = require('../models/record')
const { authenticated } = require('../../config/auth')
const mongoose = require('mongoose')
let ObjectId = mongoose.Types.ObjectId


// expense-tracker homepage
router.get('/', authenticated, async (req, res) => {
  const date = new Date()
  const monthYear = req.query.monthYear
  let [day = (("0" + date.getDate()).slice(-2)), month = ('0' + ((date.getMonth() + 1).toString())).slice(-2), year = date.getFullYear().toString()] = []
  try {
    if (monthYear !== undefined) {
      month = req.query.monthYear.split('-')[0]
      year = req.query.monthYear.split('-')[1]
    }

    // sum up all the expense and income
    const sumupMonth = await Record.aggregate([{
        $match: {
          $and: [{ 'month': month }, { 'year': year },
            { 'userId': new ObjectId(req.user._id) }
          ]
        }
      }, {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" }
          },
          expense: {
            $sum: {
              $cond: [
                { $eq: ["$category", "expense"] },
                "$amount", 0
              ]
            },
          },
          income: {
            $sum: {
              $cond: [
                { $eq: ["$category", "income"] },
                "$amount", 0
              ]
            }
          }
        }
      }, {
        $addFields: {
          expenseString: { $substr: ["$expense", 0, -1] },
          incomeString: { $substr: ["$income", 0, -1] }
        }
      },
      {
        $project: {

          category: "$_id.category",
          expenseWithSign: {
            $concat: ["-", "$expenseString"]
          },
          incomeWithSign: {
            $concat: ["+", "$incomeString"]
          },
          sum: { $subtract: ["$income", "$expense"] }
        }
      }
    ])

    // sumup day balance
    const sumupDay = await Record.aggregate([{
      $match: {
        $and: [{ 'month': month }, { 'year': year },
          { 'userId': new ObjectId(req.user._id) }
        ]
      }
    }, {
      $group: {
        _id: {
          dayOfMonth: { $dayOfMonth: "$date" },
          month: { $month: "$date" },
          year: { $year: "$date" },
          dayOfWeek: { $dayOfWeek: "$date" }
        },
        expense: {
          $sum: {
            $cond: [
              { $eq: ["$category", "expense"] },
              "$amount", 0
            ]
          },
        },
        income: {
          $sum: {
            $cond: [
              { $eq: ["$category", "income"] },
              "$amount", 0
            ]
          }
        },
        record: {
          $push: "$$ROOT"
        },

      }
    }, {
      $project: {
        sum: { $subtract: ["$income", "$expense"] },
        record: "$record",
        year: '$_id.year',
        month: '$_id.month',
        dayOfMonth: '$_id.dayOfMonth',
        dayOfWeek: '$_id.dayOfWeek'
      }
    }, {
      $addFields: {
        monthName: {
          $let: {
            vars: {
              monthsInString: [, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            },
            in: {
              $arrayElemAt: ['$$monthsInString', '$month']
            }
          }
        },
        dayOfWeekName: {
          $let: {
            vars: {
              dayOfWeekInString: [, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            },
            in: {
              $arrayElemAt: ['$$dayOfWeekInString', '$dayOfWeek']
            }
          }
        }
      }
    }, {
      $sort: { "dayOfMonth": -1 }
    }])



    res.render('index', { month, year, sumupDay, sumupMonth })
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router