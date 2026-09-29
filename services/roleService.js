const { Role, Permission, Screen, RolePermission, sequelize } = require('../models');

/**
 * Helper to match screen identifiers (ID, slug, or name) to existing Screen records
 */
const resolveScreens = async (screenInputs) => {
  if (!screenInputs || !Array.isArray(screenInputs) || screenInputs.length === 0) {
    return [];
  }

  const allScreens = await Screen.findAll();
  const resolvedScreenIds = new Set();

  for (const item of screenInputs) {
    if (item === null || item === undefined) continue;

    let matched = null;

    // Check by numeric ID
    const numericId = Number(item);
    if (!isNaN(numericId) && numericId > 0) {
      matched = allScreens.find(s => Number(s.id) === numericId);
    }

    // Check by slug or name if not matched by ID
    if (!matched && typeof item === 'string') {
      const normalized = item.trim().toLowerCase();
      matched = allScreens.find(s => {
        const sSlug = s.slug.toLowerCase();
        const sName = s.name.toLowerCase();
        return (
          sSlug === normalized ||
          sName === normalized ||
          sSlug === `${normalized}s` ||
          `${sSlug}s` === normalized ||
          sName === `${normalized}s` ||
          `${sName}s` === normalized ||
          (normalized === 'customer orders' && (sSlug === 'orders' || sName.includes('order'))) ||
          (normalized === 'employee details' && (sSlug === 'staff' || sName.includes('staff'))) ||
          (normalized === 'expense' && sSlug === 'expenses') ||
          (normalized === 'expenses' && sSlug === 'expenses') ||
          (normalized === 'inspection' && (sSlug === 'inspection' || sName.includes('inspection'))) ||
          (normalized === 'quality inspection' && sSlug === 'inspection') ||
          (normalized === 'return & replacement' && sSlug === 'returns') ||
          (normalized === 'returns' && sSlug === 'returns') ||
          (normalized === 'manufacturing area' && sSlug === 'manufacturing') ||
          (normalized === 'manufacturing' && sSlug === 'manufacturing') ||
          (normalized === 'delivery' && sSlug === 'deliveries') ||
          (normalized === 'deliveries' && sSlug === 'deliveries')
        );
      });
    }

    if (!matched) {
      const error = new Error(`Invalid screen: "${item}". Screen does not exist.`);
      error.statusCode = 400;
      throw error;
    }

    resolvedScreenIds.add(Number(matched.id));
  }

  return Array.from(resolvedScreenIds);
};

/**
 * Get all roles with their assigned permissions and screen details
 */
const getAllRoles = async () => {
  return await Role.findAll({
    include: [
      {
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'name', 'slug', 'screen_id'],
        include: [
          {
            model: Screen,
            as: 'screen',
            attributes: ['id', 'name', 'slug', 'route']
          }
        ],
        through: { attributes: [] }
      }
    ],
    order: [['id', 'ASC']]
  });
};

/**
 * Get role by ID with permissions and screen details
 */
const getRoleById = async (id) => {
  const role = await Role.findByPk(id, {
    include: [
      {
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'name', 'slug', 'screen_id'],
        include: [
          {
            model: Screen,
            as: 'screen',
            attributes: ['id', 'name', 'slug', 'route']
          }
        ],
        through: { attributes: [] }
      }
    ]
  });

  if (!role) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }

  return role;
};

/**
 * Create a new role with assigned screens/permissions (Admin only)
 */
const createRole = async ({ name, slug, description, screens, screen_ids, permissions, permission_ids }) => {
  // 1. Validate required fields
  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Role name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    const error = new Error('Role slug is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, '_');

  // 2. Validate slug uniqueness
  const existingRole = await Role.findOne({ where: { slug: normalizedSlug } });
  if (existingRole) {
    const error = new Error('A role with this slug already exists');
    error.statusCode = 409;
    throw error;
  }

  // 3. Resolve screens and map to permission IDs
  const rawScreens = [];
  if (Array.isArray(screens)) rawScreens.push(...screens);
  if (Array.isArray(screen_ids)) rawScreens.push(...screen_ids);

  const resolvedScreenIds = await resolveScreens(rawScreens);

  const targetPermissionIds = new Set();

  if (resolvedScreenIds.length > 0) {
    const screenPerms = await Permission.findAll({
      where: { screen_id: resolvedScreenIds }
    });
    screenPerms.forEach(p => targetPermissionIds.add(Number(p.id)));
  }

  // Direct permission inputs if provided
  const rawPerms = [];
  if (Array.isArray(permissions)) rawPerms.push(...permissions);
  if (Array.isArray(permission_ids)) rawPerms.push(...permission_ids);

  if (rawPerms.length > 0) {
    const existingPerms = await Permission.findAll({
      where: { id: rawPerms }
    });
    if (existingPerms.length !== rawPerms.length) {
      const error = new Error('One or more permission IDs are invalid');
      error.statusCode = 400;
      throw error;
    }
    existingPerms.forEach(p => targetPermissionIds.add(Number(p.id)));
  }

  // 4. Create Role and Role-Permission relationships in a transaction
  const transaction = await sequelize.transaction();
  try {
    const newRole = await Role.create({
      name: name.trim(),
      slug: normalizedSlug,
      description: description ? description.trim() : null
    }, { transaction });

    if (targetPermissionIds.size > 0) {
      const rolePermRecords = Array.from(targetPermissionIds).map(permId => ({
        role_id: newRole.id,
        permission_id: permId,
        assigned_at: new Date()
      }));
      await RolePermission.bulkCreate(rolePermRecords, { transaction });
    }

    await transaction.commit();
    return await getRoleById(newRole.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole
};
