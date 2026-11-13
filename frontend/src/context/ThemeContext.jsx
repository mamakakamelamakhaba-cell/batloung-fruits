import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('bf_theme') || 'light');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('bf_fontsize') || 'normal');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('bf_sidebar') === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bf_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-fontsize', fontSize);
    localStorage.setItem('bf_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded');
    localStorage.setItem('bf_sidebar', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const toggleSidebar = () => setSidebarCollapsed(c => !c);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, fontSize, setFontSize, sidebarCollapsed, toggleSidebar }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
