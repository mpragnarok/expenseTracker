const express = require('express')
const router = express.Router()
const Record = require('../models/record')


// fetch all records
router.get('/', async (req, res) => {
  const date = new Date()
  const monthYear = req.query.monthYear
  let [day = (("0" + date.getDate()).slice(-2)), month = ('0' + ((date.getMonth() + 1).toString())).slice(-2), year = date.getFullYear().toString()] = []
  const subCategoryNum = req.query.subCategoryNum
  const subCategory = req.query.subCategory
  let regex = RegExp(/([0-9])$/)


  function checkSubCategory(query) {
    return regex.test(query)
  }

  console.log(checkSubCategory(subCategoryNum))

  try {
    if (monthYear !== undefined) {
      month = req.query.monthYear.split('-')[0]
      year = req.query.monthYear.split('-')[1]
    }


    // sum up all the expense and income


    const sumupMonth = await Record.aggregate([{
        $match: { $and: [{ 'month': month }, { 'year': year }] }
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
          expenseString: { $convert: { input: "$expense", to: "string" } },
          incomeString: { $convert: { input: "$income", to: "string" } }
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


    let sumupDay = await Record.aggregate([{
      $match: { $and: [{ 'month': month }, { 'year': year }] }
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
      $sort: { "dayOfMonth": 1 }
    }])

    if (subCategoryNum && checkSubCategory(subCategoryNum) === true) {

      sumupDay = await Record.aggregate([{
        $match: { $and: [{ 'month': month }, { 'year': year }, { 'subCategoryNum': subCategoryNum }] }
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
    }

    // console.log('sumupDay', sumupDay)
    // console.log('record', sumupDay[1].record)

    res.render('index', { month, year, sumupDay, sumupMonth, subCategoryNum, subCategory })
  } catch (e) {
    res.status(500).send(e)
  }
})

// create a new transaction in page

router.get('/add', async (req, res) => {
  const date = new Date()
  let [day = (("0" + date.getDate()).slice(-2)), month = ('0' + ((date.getMonth() + 1).toString())).slice(-2), year = date.getFullYear().toString()] = []

  try {
    res.render('add', { day, month, year, category: 'Select a category' })
  } catch (e) {
    res.status(500).send()
  }
})

// create a new transaction
router.post('/', async (req, res) => {
  let { name, date, subCategoryValue, amount, merchant } = req.body
  let [day, month, year] = date.split('-')
  let [category, subCategory, icon, subCategoryNum] = subCategoryValue.split('/')
  let sign = '+'
  const monthField = month
  const dayField = day
  month -= 1 //new Date() needs month index
  if (dayField === day) {
    day = parseInt(day) + 1
  }

  // console.log(dayField, day)
  amount = Math.abs(parseFloat(amount))

  if (category === 'expense') sign = '-'

  const record = new Record({
    name,
    date: new Date(year, month, day),
    subCategory,
    subCategoryNum,
    category,
    sign,
    icon,
    amount,
    month: monthField,
    year,
    day: dayField,
    merchant

  })
  let errors = []
  try {
    if (!name || !date || !subCategoryValue || !amount) {
      errors.push({ message: 'All fields are required' })
    }

    if (errors.length > 0) {
      month += 1
      return res.render('add', {
        errors,
        name,
        day,
        month,
        year,
        subCategoryValue,
        amount,
        merchant
      })
    }

    await record.save()
    res.redirect('/')
  } catch (e) {
    res.status(400).send(e)
  }
})

// update a transaction in page
router.get('/:id/edit', async (req, res) => {
  try {
    const record = await Record.findById(req.params.id)
    if (!record) {
      return res.status(404).send()
    }
    res.render('edit', { record })
  } catch (e) {
    res.status(500).send()
  }
})

// TODO: update transaction
// update a transaction
router.put('/:id', async (req, res) => {


  let errors = []
  const record = await Record.findOne({ _id: req.params.id })

  let { name, date, subCategoryValue, amount, merchant } = req.body
  let [day, month, year] = date.split('-')
  let [category, subCategory, icon, subCategoryNum] = subCategoryValue.split('/')
  let sign = '+'

  try {
    if (!name || !date || !subCategoryValue || !amount) {
      errors.push({ message: 'All fields are required' })
    }

    if (errors.length > 0) {
      month += 1
      return res.render('add', {
        errors,
        name,
        day,
        month,
        year,
        subCategoryValue,
        subCategory,
        amount,
        merchant
      })
    }



    const monthField = month
    const dayField = day
    month -= 1 //new Date() needs month index
    if (dayField === day) {
      day = parseInt(day) + 1
    }
    amount = Math.abs(parseFloat(amount))


    record.name = name
    record.date = new Date(year, month, day)
    record.subCategory = subCategory
    record.subCategoryNum = subCategoryNum
    record.category = category
    record.sign = sign
    record.icon = icon
    record.amount = amount
    record.month = monthField
    record.year = year
    record.day = dayField
    record.merchant = merchant

    if (category === 'expense') sign = '-'

    await record.save()
    res.redirect('/')



  } catch (e) {
    res.status(400).send(e)
  }
})
// delete a transaction
router.delete('/:id', async (req, res) => {
  try {
    const record = await Record.findOne({ _id: req.params.id })
    if (!record) {
      return res.status(404).send()
    }
    record.remove()
    res.redirect('/')
  } catch (e) {
    res.status(500).send()
  }
})

module.exports = router