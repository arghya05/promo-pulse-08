import React from "react";

export default function UniversalScrollableText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        maxHeight: "260px",
        overflowX: "auto",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "inline-block",
          minWidth: "100%",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {children}
      </div>
    </div>
  );
}
