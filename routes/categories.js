var express = require('express');
var router = express.Router();
let slugify = require('slugify');
let categoryModel = require('../schemas/categories');
let { authentication, authorization } = require('../utils/authHandler');

//R CUD
/* GET users listing. */
router.get('/', async function (req, res, next) {
  let data = await categoryModel.find({
    isDeleted: false
  })
  res.send(data);
});
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await categoryModel.find({
      isDeleted: false,
      _id: id
    })
    if (result.length > 0) {
      res.send(result[0])
    } else {
      res.status(404).send("ID NOT FOUND")
    }
  } catch (error) {
    res.status(404).send(error.message)
  }

});

router.post('/', authentication, authorization('Quản trị viên', 'Biên tập viên'), async function (req, res, next) {
  try {
    let newCate = new categoryModel({
      name: req.body.name,
      slug: slugify(req.body.name, { replacement: '-', lower: true, trim: true }),
      image: req.body.image
    })
    await newCate.save();
    res.send(newCate)
  } catch (error) {
    if (error.code === 11000) return res.status(400).send({ message: 'Tên category đã tồn tại' });
    res.status(400).send({ message: error.message });
  }
})
router.put('/:id', authentication, authorization('Quản trị viên', 'Biên tập viên'), async function (req, res, next) {
  try {
    let id = req.params.id;
    // let result = await categoryModel.findById(id)
    // let keys = Object.keys(req.body);
    // for (const key of keys) {
    //     result[key] = req.body[key]
    //     result.updatedAt = new Date(Date.now())
    // }
    // await result.save()
    let result = await categoryModel.findByIdAndUpdate(
      id, req.body, {
      new: true
    })
    res.send(result)
  } catch (error) {
    res.status(404).send(error.message)
  }
})
router.delete('/:id', authentication, authorization('Quản trị viên'), async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findById(id)
    result.isDeleted = true;
    await result.save()
    res.send(result)
  } catch (error) {
    res.status(404).send(error.message)
  }
})



module.exports = router;
