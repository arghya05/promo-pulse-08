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
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
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
