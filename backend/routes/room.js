const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  createRoom,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  getRoomParticipants,
  getUserRooms,
  updateRoomStatus,
} = require("../controllers/roomController");

const { authenticate, authorize } = require("../middleware/authMiddleware");

const validateCreateRoom = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Room name must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("max_participants")
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage("Max participants must be between 2 and 100"),
];

const validateUpdateRoomStatus = [
  body("is_active").isBoolean().withMessage("is_active must be a boolean"),
];

router.post(
  "/",
  authenticate,
  authorize("teacher"),
  validateCreateRoom,
  createRoom
);
router.get("/code/:room_code", getRoomByCode);
router.post("/join/:room_code", authenticate, joinRoom);
router.post("/leave/:room_id", authenticate, leaveRoom);
router.get("/:room_id/participants", authenticate, getRoomParticipants);
router.get("/my-rooms", authenticate, getUserRooms);
router.put(
  "/:room_id/status",
  authenticate,
  authorize("teacher"),
  validateUpdateRoomStatus,
  updateRoomStatus
);

module.exports = router;
