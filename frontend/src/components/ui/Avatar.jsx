import { useState } from "react";
import clsx from "clsx";

const palette = [
  "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
];

function hashTone(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h + str.charCodeAt(i)) % palette.length;
  return palette[h];
}

export default function Avatar({ src, initials, size = "md", className }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" };
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && src !== failedSrc;
  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
        hashTone(initials || "?"),
        sizes[size],
        className
      )}
    >
      {showImage ? (
        <img src={src} alt={initials} className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        initials
      )}
    </div>
  );
}
