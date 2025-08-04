import express from 'express';
import { PassController } from '../controllers/pass.controller.js';
import { validatePassRequest } from '../middleware/pass.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
const passController = new PassController();

// Protect all pass routes
router.use(protect);

// Pass Routes
// Create pass for a specific visitor
router.post('/visitor/:visitorId', 
    validatePassRequest, 
    passController.createPass);



// for admin and can also by visitor id
router.get('/', passController.getAllPasses); // Get all passes with filters has to toggle for admin to see all passes or only their own

// Get details of a specific pass (admin can view any, host can only view their visitors' passes)
router.get('/:passId', passController.getPassById);        // for admin only.

// Get pass by visitor ID in get all passes
// router.get('/:visitorId', passController.getPassByVisitorId); // This route can be used to get passes by visitor ID if needed



export default router;
