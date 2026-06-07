"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const x = useSpring(rawX, { stiffness: 700, damping: 40 });
  const y = useSpring(rawY, { stiffness: 700, damping: 40 });
  const [label, setLabel] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    const over = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const el = t.closest<HTMLElement>("[data-cursor]");
      if (el) {
        setLabel(el.dataset.cursor ?? "");
        setExpanded(true);
      }
    };
    const out = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (!t.closest("[data-cursor]")) {
        setExpanded(false);
        setLabel("");
      }
    };
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
    };
  }, [rawX, rawY]);

  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 99999,
        pointerEvents: "none",
      }}
    >
      <motion.div
        animate={{
          width: expanded ? 72 : 10,
          height: expanded ? 72 : 10,
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          marginTop: expanded ? -36 : -5,
          marginLeft: expanded ? -36 : -5,
          borderRadius: "50%",
          border: "1px solid var(--mk-gold)",
          background: expanded ? "rgba(200,137,26,0.1)" : "var(--mk-gold)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transition: "margin 0.18s ease",
        }}
      >
        <motion.span
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.1 }}
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--mk-gold)",
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {label}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
