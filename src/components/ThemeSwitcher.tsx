"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

const ThemeSwitcher = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { systemTheme, theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="adminRow h-[44px]">
        <div className="h-4 w-4 animate-pulse rounded-full bg-gray-700" />
        <div className="h-4 w-20 animate-pulse rounded-full bg-gray-700" />
      </div>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  return currentTheme === "dark" ? (
    <div className="adminRow" onClick={() => setTheme("light")}>
      <SunIcon className="h-4 w-4 text-gray-500" />
      <p>Light mode</p>
    </div>
  ) : (
    <div className="adminRow" onClick={() => setTheme("dark")}>
      <MoonIcon className="h-4 w-4 text-gray-500" />
      <p>Dark mode</p>
    </div>
  );
};

export default ThemeSwitcher;
