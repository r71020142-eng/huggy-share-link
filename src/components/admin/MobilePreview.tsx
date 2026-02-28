import { RefreshCw, ExternalLink, LayoutGrid } from "lucide-react";
import { useState, useCallback } from "react";

interface MobilePreviewProps {
  slug: string;
  onRefresh?: () => void;
}

export function MobilePreview({ slug, onRefresh }: MobilePreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1);
    onRefresh?.();
  }, [onRefresh]);

  // Native mobile viewport: 375x812 (iPhone X/11/12/13/14)
  const DEVICE_WIDTH = 375;
  const DEVICE_HEIGHT = 812;
  // Container width inside the phone frame
  const CONTAINER_WIDTH = 320;
  const scale = CONTAINER_WIDTH / DEVICE_WIDTH;

  return (
    <div className="hidden w-[380px] flex-col border-l bg-muted/30 lg:flex">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <LayoutGrid className="h-4 w-4" />
          PREVIEW MOBILE
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> Recarregar
          </button>
          <a
            href={`/m/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Phone Frame */}
      <div className="flex flex-1 items-start justify-center overflow-hidden p-4">
        <div
          className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-foreground/20 bg-background shadow-xl"
          style={{ width: CONTAINER_WIDTH + 12, height: DEVICE_HEIGHT * scale + 30 }}
        >
          {/* Notch / Dynamic Island */}
          <div className="relative z-10 flex items-center justify-center bg-foreground/5 py-2">
            <div className="h-[5px] w-[80px] rounded-full bg-foreground/20" />
          </div>

          {/* Iframe rendered at native resolution, scaled down */}
          <div
            className="origin-top-left overflow-hidden"
            style={{
              width: DEVICE_WIDTH,
              height: DEVICE_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <iframe
              key={iframeKey}
              src={`/m/${slug}?preview=1`}
              title="Preview Mobile"
              className="border-0"
              style={{
                width: DEVICE_WIDTH,
                height: DEVICE_HEIGHT,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
        Preview ao vivo — salve para publicar
      </div>
    </div>
  );
}
