import React, { useState, useEffect } from "react";

const BootSequence: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const color = "#ffffff";

  useEffect(() => {
    const bootMessages = [
      "System Check... OK",
      "Loading Kernel... OK",
      "Loading Drivers... OK",
      "Loading Services... OK",
      "Booting... OK",
      "----------------------------------------",
      "Allocating Memory Resources... 512MB OK",
      "Loading Extension Modules... 6 Loaded",
      "Calibrating Display Settings... Set",
      "Checking Disk Space... 120GB Free",
      "Updating Local Data Cache... 245 Items Updated",
      "Testing Audio Output... Stereo OK",
      "Scanning for External Devices... 2 Connected",
      "Compiling User Scripts... 15 Scripts Compiled",
      "Performing Security Scan... No Threats Found",
      "Syncing with Cloud Storage... 1.2GB Synced",
      "Initializing Custom Workflows... 4 Workflows Ready",
      "Refreshing User Session... Session Restored",
      "Applying System Patches... Patch 1.4.2 Applied",
      "Generating Performance Report... 99% Efficiency",
      "Finalizing User Interface... Custom Theme Applied",
      "Activating Voice Commands... Voice Recognition Active",
      "Running Diagnostic Tests... All Systems Functional",
      "----------------------------------------",
      "Making up more random messages... OK",
      "Initializing Core Modules... OK",
      "Establishing Data Connections... OK",
      "Drinking Caffeine... OK",
      "Setting Up User Interface... OK",
      "Verifying Security Protocols... OK",
      "Synchronizing Time and Date... OK",
      "Activating Plugin Support... OK",
      "Loading Resource Libraries... OK",
      "Preparing Workspace Environment... OK",
      "Optimizing Performance Settings... OK",
      "Starting Background Services... OK",
      "Verifying License and Subscriptions... OK",
      "Loading User Preferences... OK",
      "Checking for Updates... OK",
      "Finalizing Setup... OK",
    ];

    const interval = setInterval(() => {
      setLines((prevLines) => {
        const nextLine = bootMessages[prevLines.length];
        if (nextLine === undefined) {
          clearInterval(interval);
          return prevLines;
        }
        return [...prevLines, nextLine];
      });
    }, 30); // Adjusted interval for longer duration
  
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="crt crt-scanlines flex w-screen flex-col bg-neutral-950 p-8"
      style={{
        fontSize: "16px",
        textAlign: "left",
        width: "100%",
        height: "100%",
      }}
    >
      {lines.map((line, index) => (
        <span
          key={index}
          style={{
            color: color,
            textShadow: `0 0 5px ${color}, 0 0 8px ${color}`,
          }}
        >
          {line}
        </span>
      ))}
    </div>
  );
};

export default BootSequence;
