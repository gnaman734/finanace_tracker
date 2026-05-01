import { Notification } from '../models/index.js';

export const listUnreadNotifications = (userId) =>
  Notification.findAll({
    where: { user_id: userId, is_read: false },
    order: [['createdAt', 'DESC']],
    limit: 50
  });

export const markNotificationAsRead = async (id, userId) => {
  const [updated] = await Notification.update(
    { is_read: true },
    {
      where: {
        id,
        user_id: userId
      }
    }
  );

  return updated;
};

export const markAllNotificationsAsRead = async (userId) => {
  const [updated] = await Notification.update(
    { is_read: true },
    {
      where: {
        user_id: userId,
        is_read: false
      }
    }
  );

  return updated;
};

export const deleteNotificationById = async (id, userId) =>
  Notification.destroy({
    where: {
      id,
      user_id: userId
    }
  });
