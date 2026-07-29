const serviceService = require('../services/serviceService');
const { validateServiceInput } = require('../validators/serviceValidator');

// @desc    Create new service
// @route   POST /api/services
// @access  Admin
const createService = async (req, res) => {
  try {
    const { isValid, errors } = validateServiceInput(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const service = await serviceService.createService(req.body, req.user?._id);
    res.status(201).json({ success: true, message: 'Service created successfully', service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get home active services
// @route   GET /api/services/home
// @access  Public
const getHomeServices = async (req, res) => {
  try {
    const services = await serviceService.getHomeServices();
    res.status(200).json({ success: true, count: services.length, services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all services (Admin / Public list with search, filter, pagination)
// @route   GET /api/services
// @access  Public / Admin
const getAllServices = async (req, res) => {
  try {
    const data = await serviceService.getAllServices(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get service by slug
// @route   GET /api/services/:slug
// @access  Public
const getServiceBySlug = async (req, res) => {
  try {
    const service = await serviceService.getServiceBySlug(req.params.slug);
    res.status(200).json({ success: true, service });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// @desc    Get service by ID (Admin)
// @route   GET /api/services/admin/:id
// @access  Admin
const getServiceById = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    res.status(200).json({ success: true, service });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Admin
const updateService = async (req, res) => {
  try {
    const { isValid, errors } = validateServiceInput(req.body, true);
    if (!isValid) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const service = await serviceService.updateService(req.params.id, req.body, req.user?._id);
    res.status(200).json({ success: true, message: 'Service updated successfully', service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Toggle service active status
// @route   PATCH /api/services/:id/status
// @access  Admin
const toggleServiceStatus = async (req, res) => {
  try {
    const service = await serviceService.toggleServiceStatus(req.params.id, req.user?._id);
    res.status(200).json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      service
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete service
// @route   DELETE /api/services/:id
// @access  Admin
const deleteService = async (req, res) => {
  try {
    await serviceService.deleteService(req.params.id, req.user?._id);
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reorder services
// @route   PATCH /api/services/reorder
// @access  Admin
const reorderServices = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' });
    }
    await serviceService.reorderServices(orderedIds);
    res.status(200).json({ success: true, message: 'Services reordered successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── SUB-RESOURCE CONTROLLERS ─────────────────────────────────

const addMembership = async (req, res) => {
  try {
    const service = await serviceService.addMembership(req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Membership added', service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteMembership = async (req, res) => {
  try {
    const service = await serviceService.deleteMembership(req.params.id, req.params.memId);
    res.status(200).json({ success: true, message: 'Membership removed', service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addPlan = async (req, res) => {
  try {
    const service = await serviceService.addPlan(req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Plan added', service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    const service = await serviceService.deletePlan(req.params.id, req.params.planId);
    res.status(200).json({ success: true, message: 'Plan removed', service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createService,
  getHomeServices,
  getAllServices,
  getServiceBySlug,
  getServiceById,
  updateService,
  toggleServiceStatus,
  deleteService,
  reorderServices,
  addMembership,
  deleteMembership,
  addPlan,
  deletePlan
};
