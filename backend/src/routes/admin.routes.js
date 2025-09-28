import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
//import { deleteTodoById, listAllTodos } from '../controllers/admin.controller.js';
import { 
    deleteUserById, 
    getUserById, 
    listUsers, 
    updateUserById,
    listPickupPartners,
    getPickupPartnerById,
    createPickupPartner,
    updatePickupPartnerById,
    deletePickupPartnerById,
    listRecyclers,
    getRecyclerById,
    createRecycler,
    updateRecyclerById,
    deleteRecyclerById,
    listSchedules,
    getScheduleById,
    updateScheduleById,
    deleteScheduleById,
    listBins,
    getBinById,
    updateBinById,
    deleteBinById,
    getAllWasteOrders,
    getWasteOrderStats,
    approveWasteOrder,
    rejectWasteOrder,
    getCombinedPricingData
} from '../controllers/admin.controller.js';
import { sendBinFullNotificationEmail } from '../controllers/bin.controller.js';


const router = Router();


// Admin only routes
router.use(auth, authorize('admin'));


// Users
router.get('/users', listUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUserById);
router.delete('/users/:userId', deleteUserById);

// Pickup Partners
router.get('/pickup-partners', listPickupPartners);
router.get('/pickup-partners/:partnerId', getPickupPartnerById);
router.post('/pickup-partners', createPickupPartner);
router.put('/pickup-partners/:partnerId', updatePickupPartnerById);
router.delete('/pickup-partners/:partnerId', deletePickupPartnerById);

// Recyclers
router.get('/recyclers', listRecyclers);
router.get('/recyclers/:recyclerId', getRecyclerById);
router.post('/recyclers', createRecycler);
router.put('/recyclers/:recyclerId', updateRecyclerById);
router.delete('/recyclers/:recyclerId', deleteRecyclerById);

// Schedules
router.get('/schedules', listSchedules);
router.get('/schedules/:scheduleId', getScheduleById);
router.put('/schedules/:scheduleId', updateScheduleById);
router.delete('/schedules/:scheduleId', deleteScheduleById);

// Bins
router.get('/bins', listBins);
router.get('/bins/:binId', getBinById);
router.put('/bins/:binId', updateBinById);
router.delete('/bins/:binId', deleteBinById);
router.post('/bins/:id/notify', sendBinFullNotificationEmail);

// Waste Orders
router.get('/waste-orders', getAllWasteOrders);
router.get('/waste-orders/stats', getWasteOrderStats);
router.put('/waste-orders/:orderId/approve', approveWasteOrder);
router.put('/waste-orders/:orderId/reject', rejectWasteOrder);

// Combined Pricing Data for AI Forecasting
router.get('/pricing-data', getCombinedPricingData);

// Todos
//router.get('/todos', listAllTodos);
//router.delete('/todos/:todoId', deleteTodoById);

export default router;