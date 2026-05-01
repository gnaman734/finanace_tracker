import { asyncHandler } from '../utils/helpers.js';
import {
  deleteNotificationById,
  listUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from '../services/notificationService.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const data = await listUnreadNotifications(req.user.id);
  return res.json({ success: true, data });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const updated = await markNotificationAsRead(req.params.id, req.user.id);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Notification not found', requestId: req.id });
  }

  return res.json({ success: true, updated });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const updated = await markAllNotificationsAsRead(req.user.id);
  return res.json({ success: true, updated });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const deleted = await deleteNotificationById(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Notification not found', requestId: req.id });
  }

  return res.json({ success: true, deleted });
});
