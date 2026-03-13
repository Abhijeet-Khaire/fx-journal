import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

export const AVAILABLE_FONTS = [
  { name: "Roboto", family: "'Roboto', sans-serif" },
  { name: "Open Sans", family: "'Open Sans', sans-serif" },
  { name: "Poppins", family: "'Poppins', sans-serif" },
  { name: "Montserrat", family: "'Montserrat', sans-serif" },
  { name: "Lato", family: "'Lato', sans-serif" },
  { name: "Raleway", family: "'Raleway', sans-serif" },
  { name: "Inter", family: "'Inter', sans-serif" },
  { name: "Georgia", family: "Georgia, serif" },
  { name: "Playfair Display", family: "'Playfair Display', serif" },
  { name: "Nunito", family: "'Nunito', sans-serif" },
];

interface ThemeSettingsContextType {
  theme: Theme;
  fontFamily: string;
  setTheme: (theme: Theme) => void;
  setFontFamily: (font: string) => void;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextType | undefined>(undefined);

export const ThemeSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "dark";
  });

  const [fontFamily, setFontFamilyState] = useState(() => {
    return localStorage.getItem("fontFamily") || AVAILABLE_FONTS[0].family;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.setProperty("--font-family-dynamic", fontFamily);
    localStorage.setItem("fontFamily", fontFamily);
  }, [fontFamily]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const setFontFamily = (newFont: string) => setFontFamilyState(newFont);

  return (
    <ThemeSettingsContext.Provider value={{ theme, fontFamily, setTheme, setFontFamily }}>
      {children}
    </ThemeSettingsContext.Provider>
  );
};

export const useThemeSettings = () => {
  const context = useContext(ThemeSettingsContext);
  if (context === undefined) {
    throw new Error("useThemeSettings must be used within a ThemeSettingsProvider");
  }
  return context;
};
