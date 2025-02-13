import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { initiateCall, acceptCall, endCall } from "../controllers/videoCall.controller.js";

const router = express.Router();

router.post("/initiate", protectRoute, initiateCall);
router.post("/accept", protectRoute, acceptCall);
router.post("/end", protectRoute, endCall);

export default router;