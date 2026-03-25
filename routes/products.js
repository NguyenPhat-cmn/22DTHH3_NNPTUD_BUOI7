var express = require('express');
var router = express.Router();
let slugify = require('slugify');
let productModel = require('../schemas/products');
let inventoryModel = require('../schemas/inventories');
let { authentication, authorization } = require('../utils/authHandler');

//R CUD
/* GET users listing. */
router.get('/', async function (req, res, next) {
  let queries = req.query;
  let titleQ = queries.title ? queries.title.toLowerCase() : '';
  let min = queries.minprice ? queries.minprice : 0;
  let max = queries.maxprice ? queries.maxprice : 10000;
  console.log(queries);
  let data = await productModel.find({
    isDeleted: false,
    title: new RegExp(titleQ,'i'),
    price:{
      $gte: min,
      $lte: max
    }
  }).populate({
    path: 'category',
    select: 'name'
  })
  res.send(data);
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await productModel.find({
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
  let newProduct = new productModel({
    title: req.body.title,
    slug: slugify(req.body.title,
      {
        replacement: '-',
        remove: undefined,
        lower: true,
        trim: true
      }
    ), price: req.body.price,
    images: req.body.images,
    description: req.body.description,
    category: req.body.category
  })
  await newProduct.save();
  // Tự động tạo inventory khi tạo product
  await inventoryModel.create({ product: newProduct._id });
  res.send(newProduct)
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
})
router.put('/:id', authentication, authorization('Quản trị viên', 'Biên tập viên'), async function (req, res, next) {
  try {
    let id = req.params.id;
    // let result = await productModel.findById(id)
    // let keys = Object.keys(req.body);
    // for (const key of keys) {
    //     result[key] = req.body[key]
    //     result.updatedAt = new Date(Date.now())
    // }
    // await result.save()
    let result = await productModel.findByIdAndUpdate(
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
    let result = await productModel.findById(id)
    result.isDeleted = true;
    await result.save()
    res.send(result)
  } catch (error) {
    res.status(404).send(error.message)
  }
})



module.exports = router;
