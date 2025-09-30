"use client";

import { useTheme } from "next-themes";
import { isMobileOnly } from "react-device-detect";
import { Toaster, type ToastPosition } from "react-hot-toast";

const CustomToaster = () => {
  const { theme } = useTheme();
  const position: ToastPosition = isMobileOnly ? "top-center" : "top-right";

  return (
    <Toaster
      position={position}
      toastOptions={{
        style: {
          background: theme === "dark" ? "#202123" : "#fff",
          color: theme === "dark" ? "#fff" : "#000",
        },
      }}
    />
  );
};

export default CustomToaster;
