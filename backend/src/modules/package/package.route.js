const express = require('express');
const router = express.Router();
const PackageController = require('./package.controller');
const upload = require('../../configs/upload.config');
const { checkRoleMDW, optionalAuth } = require('../../middleware/auJWT.middleware');

router.get('/', optionalAuth, PackageController.getAllTopupPackages);
router.get('/game/:game_code', optionalAuth, PackageController.getTopupPackagesByGameSlug);
router.get('/getLog', optionalAuth, PackageController.getLogTopupPackages);
router.get('/search', optionalAuth, PackageController.searchTopupPackages);
router.get('/:id', optionalAuth, PackageController.getPackageById);

router.post('/', checkRoleMDW, upload.secureUpload("thumbnail"), PackageController.createTopupPackage);
router.put('/', checkRoleMDW, upload.secureUpload("thumbnail"), PackageController.updateTopupPackage);
router.delete('/:id', checkRoleMDW, PackageController.deleteTopupPackage);
router.patch('/update-status', checkRoleMDW, PackageController.updateStatus);
router.patch('/update-sale', checkRoleMDW, PackageController.updateSale);
router.patch('/reorder', checkRoleMDW, PackageController.reorderPackages);

module.exports = router;