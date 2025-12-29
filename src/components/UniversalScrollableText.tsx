// UNIVERSAL FIX FOR ALL CHAT + INSIGHTS
// This prevents cutting text & adds horizontal + vertical scrollbars

import React from "react";

export default function UniversalScrollableText({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "auto",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "inline-block",
          minWidth: "max-content",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>
    </div>
  );
}
