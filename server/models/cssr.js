/* jshint indent: 2 */
const getAddressAPI = require('../utils/getAddressAPI');
const get = require('lodash/get');
const { Op } = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const CSSR = sequelize.define(
    'cssr',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        field: '"CssrID"',
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: '"CssR"',
      },
      localAuthority: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: '"LocalAuthority"',
      },
      localCustodianCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: '"LocalCustodianCode"',
      },
      region: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: '"Region"',
      },
      regionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: '"RegionID"',
      },
      nmdsIdLetter: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: '"NmdsIDLetter"',
      },
    },
    {
      tableName: '"Cssr"',
      schema: 'cqc',
      createdAt: false,
      updatedAt: false,
    },
  );

  CSSR.getIdFromDistrict = async function (postcode) {
    console.log({ getIdFromDistrict: postcode });
    const postcodeData = await getAddressAPI.getPostcodeData(postcode);
    console.log({ getPostcodeData: postcodeData });
    if (!get(postcodeData, 'addresses[0].district')) {
      return false;
    }

    const district = postcodeData.addresses[0].district;
    console.log({ district: district });
    const cssr = await this.findOne({
      attributes: ['id', 'name'],
      where: {
        LocalAuthority: { [Op.like]: `%${district}%` },
      },
      logging: true,
    });

    if (cssr && cssr.id) {
      return { id: cssr.id, name: cssr.name };
    } else {
      return false;
    }
  };

  CSSR.getCSSR = async (establishmentId) => {
    const postcode = await sequelize.models.establishment.findOne({
      attributes: ['postcode', 'id'],
      where: { id: establishmentId },
    });

    if (!postcode) {
      return false;
    }
    let cssr = await sequelize.models.pcodedata.findOne({
      attributes: ['uprn', 'postcode'],
      include: [
        {
          model: sequelize.models.cssr,
          attributes: ['id', 'name'],
          as: 'theAuthority',
        },
      ],
      where: {
        postcode: postcode.postcode,
      },
    });

    if (cssr && cssr.theAuthority) {
      cssr = cssr.theAuthority;
    } else {
      cssr = await CSSR.getIdFromDistrict(postcode.postcode);
      if (!cssr) {
        return false;
      }
    }
    return cssr;
  };
  return CSSR;
};
