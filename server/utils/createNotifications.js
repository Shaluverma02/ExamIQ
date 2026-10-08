const Notification = require('../models/Notification');

const createNotifications = async ({ userIds, title, message, type = 'info', link = '' }) => {
  const uniqueUserIds = [...new Set((userIds || []).map((id) => String(id)).filter(Boolean))];
  if (!uniqueUserIds.length) return;

  await Notification.insertMany(uniqueUserIds.map((userId) => ({
    userId,
    title,
    message,
    type,
    link,
  })));
};

module.exports = createNotifications;
