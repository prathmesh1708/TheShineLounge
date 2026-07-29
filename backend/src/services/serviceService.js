const Service = require('../models/Service');

class ServiceService {
  // Create a new service
  async createService(serviceData, userId) {
    const existingSlug = await Service.findOne({ slug: serviceData.slug.toLowerCase(), isDeleted: false });
    if (existingSlug) {
      throw new Error(`A service with slug "${serviceData.slug}" already exists`);
    }

    const existingName = await Service.findOne({ serviceName: serviceData.serviceName, isDeleted: false });
    if (existingName) {
      throw new Error(`A service with name "${serviceData.serviceName}" already exists`);
    }

    const service = await Service.create({
      ...serviceData,
      createdBy: userId,
      updatedBy: userId
    });

    return service;
  }

  // Get all active services for home page
  async getHomeServices() {
    return await Service.find({
      showOnHome: true,
      isActive: true,
      isDeleted: false
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
  }

  // Get all services (Admin listing with filters, pagination, search)
  async getAllServices(query = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      status = '',
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = query;

    const filter = { isDeleted: false };

    if (search) {
      filter.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [services, total] = await Promise.all([
      Service.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Service.countDocuments(filter)
    ]);

    return {
      services,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Get single public service by slug
  async getServiceBySlug(slug) {
    const service = await Service.findOne({ slug: slug.toLowerCase(), isDeleted: false, isActive: true }).lean();
    if (!service) {
      throw new Error('Service not found or inactive');
    }
    return service;
  }

  // Get single service by ID (Admin)
  async getServiceById(id) {
    const service = await Service.findOne({ _id: id, isDeleted: false }).lean();
    if (!service) {
      throw new Error('Service not found');
    }
    return service;
  }

  // Update service (Admin)
  async updateService(id, updateData, userId) {
    const service = await Service.findOne({ _id: id, isDeleted: false });
    if (!service) {
      throw new Error('Service not found');
    }

    if (updateData.slug && updateData.slug.toLowerCase() !== service.slug) {
      const duplicateSlug = await Service.findOne({
        _id: { $ne: id },
        slug: updateData.slug.toLowerCase(),
        isDeleted: false
      });
      if (duplicateSlug) {
        throw new Error(`A service with slug "${updateData.slug}" already exists`);
      }
    }

    Object.assign(service, updateData, { updatedBy: userId });
    await service.save();
    return service;
  }

  // Toggle service active status
  async toggleServiceStatus(id, userId) {
    const service = await Service.findOne({ _id: id, isDeleted: false });
    if (!service) {
      throw new Error('Service not found');
    }
    service.isActive = !service.isActive;
    service.updatedBy = userId;
    await service.save();
    return service;
  }

  // Soft delete service
  async deleteService(id, userId) {
    const service = await Service.findOne({ _id: id, isDeleted: false });
    if (!service) {
      throw new Error('Service not found');
    }
    service.isDeleted = true;
    service.isActive = false;
    service.updatedBy = userId;
    await service.save();
    return service;
  }

  // Reorder services
  async reorderServices(orderedIds) {
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder: index } }
      }
    }));
    await Service.bulkWrite(bulkOps);
    return true;
  }

  // Sub-resource helpers: Add Membership
  async addMembership(serviceId, membershipData) {
    const service = await Service.findOne({ _id: serviceId, isDeleted: false });
    if (!service) throw new Error('Service not found');

    service.memberships.push(membershipData);
    await service.save();
    return service;
  }

  // Update Membership
  async updateMembership(serviceId, membershipId, membershipData) {
    const service = await Service.findOne({ _id: serviceId, isDeleted: false });
    if (!service) throw new Error('Service not found');

    const mem = service.memberships.id(membershipId);
    if (!mem) throw new Error('Membership not found');

    Object.assign(mem, membershipData);
    await service.save();
    return service;
  }

  // Delete Membership
  async deleteMembership(serviceId, membershipId) {
    const service = await Service.findOne({ _id: serviceId, isDeleted: false });
    if (!service) throw new Error('Service not found');

    service.memberships.pull({ _id: membershipId });
    await service.save();
    return service;
  }

  // Add Plan
  async addPlan(serviceId, planData) {
    const service = await Service.findOne({ _id: serviceId, isDeleted: false });
    if (!service) throw new Error('Service not found');

    service.plans.push(planData);
    await service.save();
    return service;
  }

  // Delete Plan
  async deletePlan(serviceId, planId) {
    const service = await Service.findOne({ _id: serviceId, isDeleted: false });
    if (!service) throw new Error('Service not found');

    service.plans.pull({ _id: planId });
    await service.save();
    return service;
  }
}

module.exports = new ServiceService();
