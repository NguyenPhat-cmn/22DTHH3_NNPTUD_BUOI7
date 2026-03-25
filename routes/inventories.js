var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');
let { authentication, authorization } = require('../utils/authHandler');

// GET ALL - có join với product
router.get('/', async function (req, res) {
    try {
        let data = await inventoryModel.find().populate({
            path: 'product',
            select: 'title price images category',
            populate: { path: 'category', select: 'name' }
        });
        res.send(data);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// GET BY ID - có join với product
router.get('/:id', async function (req, res) {
    try {
        let data = await inventoryModel.findById(req.params.id).populate({
            path: 'product',
            select: 'title price images category',
            populate: { path: 'category', select: 'name' }
        });
        if (!data) return res.status(404).send({ message: 'Không tìm thấy inventory' });
        res.send(data);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// ADD STOCK - tăng stock
router.post('/add-stock', authentication, authorization('Quản trị viên', 'Biên tập viên'), async function (req, res) {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0)
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });

        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) return res.status(404).send({ message: 'Không tìm thấy inventory cho product này' });

        inventory.stock += quantity;
        await inventory.save();
        res.send({ message: `Đã thêm ${quantity} vào stock`, inventory });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// REMOVE STOCK - giảm stock
router.post('/remove-stock', authentication, authorization('Quản trị viên', 'Biên tập viên'), async function (req, res) {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0)
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });

        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) return res.status(404).send({ message: 'Không tìm thấy inventory cho product này' });

        if (inventory.stock < quantity)
            return res.status(400).send({ message: `Stock không đủ. Hiện có: ${inventory.stock}` });

        inventory.stock -= quantity;
        await inventory.save();
        res.send({ message: `Đã giảm ${quantity} khỏi stock`, inventory });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// RESERVATION - giảm stock, tăng reserved
router.post('/reservation', authentication, async function (req, res) {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0)
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });

        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) return res.status(404).send({ message: 'Không tìm thấy inventory cho product này' });

        if (inventory.stock < quantity)
            return res.status(400).send({ message: `Stock không đủ để đặt. Hiện có: ${inventory.stock}` });

        inventory.stock -= quantity;
        inventory.reserved += quantity;
        await inventory.save();
        res.send({ message: `Đã đặt trước ${quantity} sản phẩm`, inventory });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// SOLD - giảm reserved, tăng soldCount
router.post('/sold', authentication, async function (req, res) {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0)
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });

        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) return res.status(404).send({ message: 'Không tìm thấy inventory cho product này' });

        if (inventory.reserved < quantity)
            return res.status(400).send({ message: `Reserved không đủ. Hiện có: ${inventory.reserved}` });

        inventory.reserved -= quantity;
        inventory.soldCount += quantity;
        await inventory.save();
        res.send({ message: `Đã bán ${quantity} sản phẩm`, inventory });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;
