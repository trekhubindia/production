// Main OAuth handler for login/logout/session

export function loginWithGoogle() {
  window.location.href = '/api/auth/google';
}

export async function logout() {
  await fetch('/api/auth/signout', { method: 'POST' });
  window.location.href = '/';
}

export async function getSession() {
  const res = await fetch('/api/auth/session');
  if (!res.ok) return null;
  return res.json();
} 