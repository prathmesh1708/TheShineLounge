const SalonProduct = require('../models/SalonProduct');
const SalonProductSale = require('../models/SalonProductSale');
const SalonProductOption = require('../models/SalonProductOption');
const { nextSequentialId } = require('../utils/sequentialId');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Mongo's regex metacharacters would otherwise turn a search for "Wax (50%)"
// into an invalid pattern and 500 the request.
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// SKUs are generated from the name so the shelf label means something:
// "Argan Hair Serum" -> SAL-ARGANHA-0007.
const buildSku = async (name) => {
  const slug = String(name || 'ITEM')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'ITEM';
  const count = await SalonProduct.countDocuments();
  let candidate = `SAL-${slug}-${String(count + 1).padStart(4, '0')}`;
  let n = count + 1;
  // countDocuments can collide after deletions; walk forward until free.
  while (await SalonProduct.exists({ sku: candidate })) {
    n += 1;
    candidate = `SAL-${slug}-${String(n).padStart(4, '0')}`;
  }
  return candidate;
};

// ---------------------------------------------------------------- products

// @desc    List salon retail products
// @route   GET /api/salon/products
// @access  Private (Staff/Admin)
const getProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const query = { isDeleted: { $ne: true } };

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;

    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      query.$or = [{ name: rx }, { sku: rx }, { barcode: rx }, { category: rx }, { variant: rx }, { brand: rx }];
    }

    const products = await SalonProduct.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching products' });
  }
};

// @desc    Look a product up by its barcode (the scanner path)
// @route   GET /api/salon/products/barcode/:code
// @access  Private (Staff/Admin)
const getProductByBarcode = async (req, res) => {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) {
      return res.status(400).json({ success: false, message: 'Barcode is required' });
    }

    // A scanner may be pointed at either the printed shelf label (sku) or the
    // manufacturer's barcode, so accept both.
    const product = await SalonProduct.findOne({
      isDeleted: { $ne: true },
      $or: [{ barcode: code }, { sku: code }]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: `No product found for code ${code}` });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error looking up barcode' });
  }
};

// @desc    Add a product
// @route   POST /api/salon/products
// @access  Private (Staff/Admin)
const createProduct = async (req, res) => {
  try {
    const { name, mrp, sellPrice } = req.body;

    if (!name || mrp === undefined || sellPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name, MRP and selling price are required'
      });
    }
    if (Number(sellPrice) > Number(mrp)) {
      return res.status(400).json({
        success: false,
        message: 'Selling price cannot be higher than MRP'
      });
    }

    const barcode = String(req.body.barcode || '').trim();
    if (barcode) {
      const clash = await SalonProduct.findOne({ barcode, isDeleted: { $ne: true } });
      if (clash) {
        return res.status(409).json({
          success: false,
          message: `Barcode ${barcode} is already on "${clash.name}"`
        });
      }
    }

    const product = await SalonProduct.create({
      sku: String(req.body.sku || '').trim() || (await buildSku(name)),
      barcode,
      name: String(name).trim(),
      category: String(req.body.category || 'General').trim(),
      variant: String(req.body.variant || '').trim(),
      brand: String(req.body.brand || '').trim(),
      unit: String(req.body.unit || 'pc').trim(),
      mrp: Number(mrp),
      sellPrice: Number(sellPrice),
      stock: Number(req.body.stock) || 0,
      lowStockThreshold: req.body.lowStockThreshold !== undefined ? Number(req.body.lowStockThreshold) : 5,
      hsnCode: String(req.body.hsnCode || '').trim(),
      taxRate: req.body.taxRate !== undefined ? Number(req.body.taxRate) : 18,
      status: req.body.status === 'inactive' ? 'inactive' : 'active',
      notes: String(req.body.notes || '')
    });

    res.status(201).json({ success: true, message: 'Product added', product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'That SKU or barcode already exists' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error creating product' });
  }
};

// @desc    Update a product
// @route   PUT /api/salon/products/:id
// @access  Private (Staff/Admin)
const updateProduct = async (req, res) => {
  try {
    const product = await SalonProduct.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const nextMrp = req.body.mrp !== undefined ? Number(req.body.mrp) : product.mrp;
    const nextSell = req.body.sellPrice !== undefined ? Number(req.body.sellPrice) : product.sellPrice;
    if (nextSell > nextMrp) {
      return res.status(400).json({ success: false, message: 'Selling price cannot be higher than MRP' });
    }

    if (req.body.barcode !== undefined) {
      const barcode = String(req.body.barcode || '').trim();
      if (barcode) {
        const clash = await SalonProduct.findOne({
          barcode,
          _id: { $ne: product._id },
          isDeleted: { $ne: true }
        });
        if (clash) {
          return res.status(409).json({
            success: false,
            message: `Barcode ${barcode} is already on "${clash.name}"`
          });
        }
      }
      product.barcode = barcode;
    }

    const fields = ['name', 'category', 'variant', 'brand', 'unit', 'hsnCode', 'notes', 'status'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });

    product.mrp = nextMrp;
    product.sellPrice = nextSell;
    if (req.body.stock !== undefined) product.stock = Math.max(0, Number(req.body.stock));
    if (req.body.lowStockThreshold !== undefined) product.lowStockThreshold = Number(req.body.lowStockThreshold);
    if (req.body.taxRate !== undefined) product.taxRate = Number(req.body.taxRate);

    await product.save();
    res.status(200).json({ success: true, message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error updating product' });
  }
};

// @desc    Adjust stock by a delta (restock / shrinkage), keeping an audit note
// @route   PATCH /api/salon/products/:id/stock
// @access  Private (Staff/Admin)
const adjustStock = async (req, res) => {
  try {
    const delta = Number(req.body.delta);
    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ success: false, message: 'A non-zero numeric delta is required' });
    }

    // Guarded update: the filter refuses to match when it would go negative,
    // so two simultaneous adjustments cannot race the stock below zero.
    const product = await SalonProduct.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: { $ne: true },
        ...(delta < 0 ? { stock: { $gte: Math.abs(delta) } } : {})
      },
      { $inc: { stock: delta } },
      { new: true }
    );

    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Product not found, or the adjustment would take stock below zero'
      });
    }

    res.status(200).json({ success: true, message: 'Stock updated', product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error adjusting stock' });
  }
};

// @desc    Remove a product (soft)
// @route   DELETE /api/salon/products/:id
// @access  Private (Staff/Admin)
const deleteProduct = async (req, res) => {
  try {
    // Soft delete: past bills reference this product, and hard-deleting it would
    // leave those bills pointing at nothing.
    const product = await SalonProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, status: 'inactive' } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error deleting product' });
  }
};

// ------------------------------------------------------------------- sales

// @desc    List product bills
// @route   GET /api/salon/product-sales
// @access  Private (Staff/Admin)
const getProductSales = async (req, res) => {
  try {
    const sales = await SalonProductSale.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 200);

    res.status(200).json({ success: true, count: sales.length, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching sales' });
  }
};

// @desc    Ring up a counter sale and take the stock down
// @route   POST /api/salon/product-sales
// @access  Private (Staff/Admin)
const createProductSale = async (req, res) => {
  const decremented = [];

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'The bill has no items' });
    }

    const lines = [];
    let grossAmount = 0;
    let itemDiscountTotal = 0;
    let subtotal = 0;

    for (const raw of items) {
      const quantity = Math.max(1, Math.floor(Number(raw.quantity) || 1));
      const product = await SalonProduct.findOne({ _id: raw.productId, isDeleted: { $ne: true } });

      if (!product) {
        throw Object.assign(new Error(`Product ${raw.productId} no longer exists`), { status: 404 });
      }

      // Take the stock first and only count the line once it succeeds. The
      // filter does the checking, so two cashiers scanning the last bottle at
      // the same time cannot both sell it.
      const taken = await SalonProduct.findOneAndUpdate(
        { _id: product._id, stock: { $gte: quantity }, isDeleted: { $ne: true } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!taken) {
        throw Object.assign(
          new Error(`Not enough stock for "${product.name}" — ${product.stock} left, ${quantity} requested`),
          { status: 409 }
        );
      }
      decremented.push({ id: product._id, quantity });

      // Prices come from the database, never from the browser, so a tampered
      // payload cannot set its own price.
      const mrp = Number(product.mrp) || 0;
      const sellPrice = Number(product.sellPrice) || 0;
      const lineTotal = round2(sellPrice * quantity);

      grossAmount = round2(grossAmount + mrp * quantity);
      itemDiscountTotal = round2(itemDiscountTotal + Math.max(0, mrp - sellPrice) * quantity);
      subtotal = round2(subtotal + lineTotal);

      lines.push({
        product: product._id,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        variant: product.variant,
        category: product.category,
        quantity,
        mrp,
        sellPrice,
        discountPerUnit: round2(Math.max(0, mrp - sellPrice)),
        lineTotal
      });
    }

    const billDiscount = Math.min(round2(Math.max(0, Number(req.body.billDiscount) || 0)), subtotal);
    const taxable = round2(subtotal - billDiscount);
    const includeGst = req.body.includeGst !== false;
    const gstRate = req.body.gstRate !== undefined ? Number(req.body.gstRate) : 18;
    const gstAmount = includeGst ? round2((taxable * gstRate) / 100) : 0;
    const total = round2(taxable + gstAmount);

    const billNo = await nextSequentialId(SalonProductSale, {
      field: 'billNo',
      prefix: 'SAL-BILL-',
      pad: 4
    });

    const sale = await SalonProductSale.create({
      billNo,
      items: lines,
      customerName: String(req.body.customerName || '').trim() || 'Walk-in Customer',
      customerPhone: String(req.body.customerPhone || '').trim(),
      customerEmail: String(req.body.customerEmail || '').trim().toLowerCase(),
      grossAmount,
      itemDiscountTotal,
      billDiscount,
      subtotal,
      includeGst,
      gstRate,
      gstAmount,
      total,
      paymentMode: req.body.paymentMode || 'Cash',
      soldBy: req.body.soldBy || (req.user && req.user.fullName) || '',
      soldById: (req.user && req.user._id) || null,
      notes: String(req.body.notes || '')
    });

    res.status(201).json({ success: true, message: 'Bill created', sale });
  } catch (error) {
    // The stock was taken item by item, so anything already decremented has to
    // go back before we report the failure.
    for (const d of decremented) {
      try {
        await SalonProduct.updateOne({ _id: d.id }, { $inc: { stock: d.quantity } });
      } catch (rollbackErr) {
        console.error('Could not restore stock for', String(d.id), rollbackErr.message);
      }
    }

    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server error creating bill'
    });
  }
};

// @desc    Void a bill and put the stock back
// @route   DELETE /api/salon/product-sales/:id
// @access  Private (Staff/Admin)
const deleteProductSale = async (req, res) => {
  try {
    const sale = await SalonProductSale.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    for (const item of sale.items) {
      if (!item.product) continue;
      await SalonProduct.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }

    sale.isDeleted = true;
    await sale.save();

    res.status(200).json({ success: true, message: 'Bill voided and stock restored' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error voiding bill' });
  }
};

// ---------------------------------------------- category / unit dropdowns

const DEFAULT_OPTIONS = {
  category: ['Hair Care', 'Skin Care', 'Beard & Shave', 'Styling', 'Tools', 'Combo Pack', 'General'],
  unit: ['pc', 'ml', 'gm', 'pack', 'box']
};

// @desc    List the category and unit choices for the product form
// @route   GET /api/salon/product-options
// @access  Private (Staff/Admin)
const getProductOptions = async (req, res) => {
  try {
    // First call on a fresh database writes the shipped defaults, so the form
    // is never left with empty dropdowns.
    for (const kind of Object.keys(DEFAULT_OPTIONS)) {
      const existing = await SalonProductOption.countDocuments({ kind });
      if (existing === 0) {
        await SalonProductOption.insertMany(
          DEFAULT_OPTIONS[kind].map((value) => ({ kind, value, isSystem: true }))
        );
      }
    }

    const rows = await SalonProductOption.find({ isDeleted: { $ne: true } }).sort({ createdAt: 1 });

    const grouped = { category: [], unit: [] };
    rows.forEach((r) => {
      if (grouped[r.kind]) grouped[r.kind].push({ _id: r._id, value: r.value, isSystem: r.isSystem });
    });

    res.status(200).json({ success: true, options: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching options' });
  }
};

// @desc    Add a category or unit
// @route   POST /api/salon/product-options
// @access  Private (Staff/Admin)
const createProductOption = async (req, res) => {
  try {
    const kind = String(req.body.kind || '').trim();
    const value = String(req.body.value || '').trim();

    if (!['category', 'unit'].includes(kind)) {
      return res.status(400).json({ success: false, message: 'kind must be "category" or "unit"' });
    }
    if (!value) {
      return res.status(400).json({ success: false, message: 'A value is required' });
    }

    // Reviving a previously removed entry rather than failing on the unique
    // index, which is what the user means by adding it back.
    const existing = await SalonProductOption.findOne({ kind, value }).collation({ locale: 'en', strength: 2 });
    if (existing) {
      if (existing.isDeleted) {
        existing.isDeleted = false;
        await existing.save();
        return res.status(200).json({ success: true, message: 'Restored', option: existing });
      }
      return res.status(409).json({ success: false, message: `"${value}" is already in the list` });
    }

    const option = await SalonProductOption.create({ kind, value });
    res.status(201).json({ success: true, message: 'Added', option });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'That value already exists' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error adding option' });
  }
};

// @desc    Remove a category or unit
// @route   DELETE /api/salon/product-options/:id
// @access  Private (Staff/Admin)
const deleteProductOption = async (req, res) => {
  try {
    const option = await SalonProductOption.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!option) {
      return res.status(404).json({ success: false, message: 'Option not found' });
    }

    // Removing a value that products still carry would leave those products
    // showing a category the dropdown no longer offers, and the next edit would
    // silently reassign them. Block it and say how many are affected.
    const field = option.kind === 'category' ? 'category' : 'unit';
    const inUse = await SalonProduct.countDocuments({
      [field]: option.value,
      isDeleted: { $ne: true }
    });

    if (inUse > 0) {
      return res.status(409).json({
        success: false,
        message: `"${option.value}" is used by ${inUse} product${inUse === 1 ? '' : 's'}. Change those first.`
      });
    }

    option.isDeleted = true;
    await option.save();

    res.status(200).json({ success: true, message: `"${option.value}" removed` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error removing option' });
  }
};

module.exports = {
  getProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
  getProductOptions,
  createProductOption,
  deleteProductOption,
  getProductSales,
  createProductSale,
  deleteProductSale
};
