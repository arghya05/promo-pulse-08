import React from "react";

export default function UniversalScrollableText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="scrollbar-visible"
      style={{
        maxHeight: "300px",
        overflowX: "auto",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div
        style={{
          minWidth: "100%",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {children}
      </div>
    </div>
  );
}
