// File: routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);


// ADD THIS LINE:
router.put('/:id/restock', productController.restockProduct);


// Category Routes
router.get('/categories', productController.getCategories);
router.post('/categories', productController.addCategory);




module.exports = router;