// Local storage utilities for user data and history
export interface UploadedFile {
  id: string;
  name: string;
  data: any[][];
  columns: string[];
  uploadedAt: Date;
}

export interface UserHistory {
  userId: string;
  files: UploadedFile[];
}

const STORAGE_KEY = 'excel_analytics_history';

export const getUserHistory = (userId: string): UploadedFile[] => {
  const allHistory: UserHistory[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const userHistory = allHistory.find(h => h.userId === userId);
  return userHistory?.files || [];
};

export const saveFileToHistory = (userId: string, file: UploadedFile): void => {
  const allHistory: UserHistory[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const userHistoryIndex = allHistory.findIndex(h => h.userId === userId);
  
  if (userHistoryIndex >= 0) {
    allHistory[userHistoryIndex].files.push(file);
  } else {
    allHistory.push({ userId, files: [file] });
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allHistory));
};

export const deleteFileFromHistory = (userId: string, fileId: string): void => {
  const allHistory: UserHistory[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const userHistoryIndex = allHistory.findIndex(h => h.userId === userId);
  
  if (userHistoryIndex >= 0) {
    allHistory[userHistoryIndex].files = allHistory[userHistoryIndex].files.filter(f => f.id !== fileId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allHistory));
  }
};

export const clearUserHistory = (userId: string): void => {
  const allHistory: UserHistory[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const filteredHistory = allHistory.filter(h => h.userId !== userId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
};