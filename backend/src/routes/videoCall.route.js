import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { initiateCall, acceptCall, endCall } from "../controllers/videoCall.controller.js";

const router = express.Router();

router.post("/initiate/:id", protectRoute, initiateCall);
router.post("/accept/:id", protectRoute, acceptCall);
router.post("/end/:id", protectRoute, endCall);

export default router;