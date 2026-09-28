const { Screen, Permission } = require('../models');

/**
 * Get all screens with their associated permissions
 */
const getAllScreens = async () => {
  return await Screen.findAll({
    include: [
      {
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'name', 'slug']
      }
    ],
    order: [['id', 'ASC']]
  });
};

module.exports = {
  getAllScreens
};
