const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const c = require('./controller');

const router = express.Router();

// Express 4 does not catch a rejected async handler; route it to the error handler.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(authMiddleware, adminOnly);

router.get('/status', wrap(c.getStatus));

router.get('/contacts', wrap(c.getContacts));
router.post('/contacts/bulk', wrap(c.bulkUpdateContacts));
router.patch('/contacts/:phone', wrap(c.updateContact));

router.get('/templates', wrap(c.listTemplates));
router.post('/templates', wrap(c.createTemplate));
router.post('/templates/sync', wrap(c.syncTemplates));
router.put('/templates/:id', wrap(c.updateTemplate));
router.post('/templates/:id/submit', wrap(c.submitTemplate));
router.delete('/templates/:id', wrap(c.deleteTemplate));

router.get('/campaigns', wrap(c.listCampaigns));
router.post('/campaigns', wrap(c.createCampaign));
router.get('/campaigns/:id', wrap(c.getCampaign));
router.post('/campaigns/:id/cancel', wrap(c.cancelCampaign));
router.post('/campaigns/:id/retry', wrap(c.retryCampaign));
router.delete('/campaigns/:id', wrap(c.deleteCampaign));

router.post('/send-test', wrap(c.sendTest));

module.exports = router;
