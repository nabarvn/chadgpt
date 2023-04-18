"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

const ThemeSwitcher = () => {
  const { systemTheme, theme, setTheme } = useTheme();

  const currentTheme = theme === "system" ? systemTheme : theme;

  return currentTheme === "dark" ? (
    <div className='adminRow' onClick={() => setTheme("light")}>
      <SunIcon className='h-4 w-4 text-gray-500' />
      <p>Light mode</p>
    </div>
  ) : (
    <div className='adminRow' onClick={() => setTheme("dark")}>
      <MoonIcon className='h-4 w-4 text-gray-500' />
      <p>Dark mode</p>
    </div>
  );
};

export default ThemeSwitcher;
