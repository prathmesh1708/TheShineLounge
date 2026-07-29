const validateServiceInput = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.serviceName !== undefined) {
    if (!data.serviceName || typeof data.serviceName !== 'string' || !data.serviceName.trim()) {
      errors.push('Service name is required');
    }
  }

  if (!isUpdate || data.slug !== undefined) {
    if (!data.slug || typeof data.slug !== 'string' || !data.slug.trim()) {
      errors.push('Service slug is required');
    } else if (!/^[a-z0-9-]+$/.test(data.slug.trim())) {
      errors.push('Service slug must contain only lowercase letters, numbers, and hyphens');
    }
  }

  if (!isUpdate || data.shortDescription !== undefined) {
    if (!data.shortDescription || typeof data.shortDescription !== 'string' || !data.shortDescription.trim()) {
      errors.push('Short description is required');
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
      errors.push('Category is required');
    }
  }

  if (data.pricing && Array.isArray(data.pricing)) {
    data.pricing.forEach((p, idx) => {
      if (!p.title) errors.push(`Pricing item #${idx + 1} requires a title`);
      if (p.price === undefined || isNaN(p.price) || p.price < 0) {
        errors.push(`Pricing item #${idx + 1} requires a valid positive price`);
      }
    });
  }

  if (data.memberships && Array.isArray(data.memberships)) {
    data.memberships.forEach((m, idx) => {
      if (!m.name) errors.push(`Membership #${idx + 1} requires a name`);
      if (m.price === undefined || isNaN(m.price) || m.price < 0) {
        errors.push(`Membership #${idx + 1} requires a valid positive price`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validateServiceInput };
