import { useEffect, useRef } from "react";

/**
 * 160x300 banner ad (Adsterra "highperformanceformat" network).
 * The ad network's invoke.js script writes its markup via `document.currentScript`,
 * so both the `atOptions` config script and the `invoke.js` loader must be
 * injected as real <script> elements inside this component's own container —
 * not rendered as JSX — for the ad to land in the right place.
 */
export function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset in case of StrictMode double-invoke / route re-mount
    container.innerHTML = "";

    const configScript = document.createElement("script");
    configScript.type = "text/javascript";
    configScript.text = `
      atOptions = {
        'key' : '8550b721f8992c34a1b4334a029889ce',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = "https://www.highperformanceformat.com/8550b721f8992c34a1b4334a029889ce/invoke.js";
    invokeScript.async = true;

    container.appendChild(configScript);
    container.appendChild(invokeScript);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="flex justify-center items-center py-2" aria-label="advertisement">
      <div ref={containerRef} style={{ width: 160, height: 300 }} />
    </div>
  );
}
