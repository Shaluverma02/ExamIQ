const getAssignmentStatus = ({
  now = new Date(),
  startDate,
  endDate,
  attemptStatus,
  attemptsRemaining,
}) => {
  const isUpcoming = Boolean(startDate && new Date(startDate) > now);
  const isExpired = Boolean(endDate && new Date(endDate) < now);
  const hasCompletedAttempt = ['submitted', 'auto-submitted', 'evaluated'].includes(attemptStatus);
  const isCompleted = attemptsRemaining <= 0;
  const isInProgress = attemptStatus === 'started' && !isExpired;

  let computedStatus = 'available';
  if (isCompleted) computedStatus = 'completed';
  else if (isInProgress) computedStatus = 'in_progress';
  else if (isExpired) computedStatus = 'expired';
  else if (isUpcoming) computedStatus = 'upcoming';

  return { computedStatus, isUpcoming, isExpired, isCompleted, isInProgress, canRetake: hasCompletedAttempt && !isCompleted && !isUpcoming && !isExpired };
};

module.exports = getAssignmentStatus;
