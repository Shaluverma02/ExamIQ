export const getDashboardPath = (role) => ({
  student: '/student/dashboard',
  faculty: '/faculty/dashboard',
  admin: '/admin/dashboard',
  college_admin: '/college-admin/dashboard',
  recruiter: '/recruiter/dashboard',
}[String(role || '').toLowerCase()] || '/login');

export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (new TextEncoder().encode(password).length > 72) {
    return 'Password is too long. Use at most 72 bytes (fewer characters when using emoji or accented letters).';
  }
  return '';
};
