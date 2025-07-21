// Authentication utilities
export interface User {
  id: string;
  username: string;
}

export const VALID_USERS = [
  { id: '1', username: 'testuser1', password: 'testpassword' },
  { id: '2', username: 'testuser2', password: 'testpassword' },
  { id: '3', username: 'testuser3', password: 'testpassword' },
  { id: '4', username: 'testuser4', password: 'testpassword' },
  { id: '5', username: 'testuser5', password: 'testpassword' },
];

export const authenticateUser = (username: string, password: string): User | null => {
  const user = VALID_USERS.find(u => u.username === username && u.password === password);
  return user ? { id: user.id, username: user.username } : null;
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem('excel_analytics_user');
  return userJson ? JSON.parse(userJson) : null;
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem('excel_analytics_user', JSON.stringify(user));
};

export const logout = (): void => {
  localStorage.removeItem('excel_analytics_user');
};