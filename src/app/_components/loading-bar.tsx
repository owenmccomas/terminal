import React from "react";

type ASCIILoadingBarProps = {
  progress: number; 
};

const ASCIILoadingBar: React.FC<ASCIILoadingBarProps> = ({ progress }) => {
  const totalBlocks = 50; 
  const filledBlocks = Math.round((progress / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const amberColor = "#ffffff"; 

  return (
    <div
      className="flex w-screen items-center justify-center bg-neutral-950 crt crt-scanlines"
      style={{
        fontSize: "16px",
        textAlign: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {Array.from({ length: filledBlocks }, () => (
        <span
          style={{
            color: amberColor,
            textShadow: `0 0 5px ${amberColor}, 0 0 8px ${amberColor}`,
          }}
        >
          █
        </span>
      ))}
      {Array.from({ length: emptyBlocks }, () => "░").join("")}
    </div>
  );
};

export default ASCIILoadingBar;
