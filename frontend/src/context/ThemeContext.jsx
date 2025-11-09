// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemPrefersDark = useMemo(
    () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
    []
  );
  const [theme, setTheme] = useState(systemPrefersDark ? "dark" : "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
