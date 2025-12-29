
import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const buttonSize = 56;
const badgeSize = 22;

const WhatsAppButton = ({ phone = "916301818034", message = "Hello! I have a query." }) => {
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end"
      }}
    >
      {/* Tooltip */}
      <span
        style={{
          opacity: 0,
          pointerEvents: "none",
          background: "#222",
          color: "#fff",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 14,
          marginBottom: 8,
          transition: "opacity 0.2s",
          position: "relative",
          right: 0,
        }}
        className="wa-tooltip"
      >
        Chat with us on WhatsApp
      </span>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        tabIndex={0}
        style={{
          position: "relative",
          width: buttonSize,
          height: buttonSize,
          borderRadius: "50%",
          background: "#25D366",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          outline: "none",
          cursor: "pointer",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => {
          const tooltip = e.currentTarget.parentElement.querySelector('.wa-tooltip');
          if (tooltip) tooltip.style.opacity = 1;
        }}
        onMouseLeave={e => {
          const tooltip = e.currentTarget.parentElement.querySelector('.wa-tooltip');
          if (tooltip) tooltip.style.opacity = 0;
        }}
      >
        {/* Notification badge */}
        <span
          style={{
            position: 'absolute',
            top: -badgeSize/2 + 6,
            right: -badgeSize/2 + 6,
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            width: badgeSize,
            height: badgeSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 'bold',
            zIndex: 2,
            boxShadow: '0 0 0 2px #fff',
            border: '2px solid #fff',
          }}
        >1</span>
        <FaWhatsapp size={32} color="#fff" />
      </a>
      <style>{`
        @media (max-width: 600px) {
          .wa-tooltip { display: none !important; }
        }
        a[aria-label="Chat on WhatsApp"]:hover, a[aria-label="Chat on WhatsApp"]:focus {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(0,0,0,0.22);
        }
      `}</style>
    </div>
  );
};

export default WhatsAppButton;
