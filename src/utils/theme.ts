export const getInitialTheme = (): boolean => {
  const saved = localStorage.getItem('theme');
  return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const setThemeClass = (isDark: boolean) => {
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', isDark);
};