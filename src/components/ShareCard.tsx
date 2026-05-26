import { Button } from "@/components/ui/button";
import { Copy, Check, MessageSquare } from "lucide-react";
import { useState } from "react";

interface ShareCardProps {
  /** The message to share */
  message: string;
  /** Optional label above the card */
  label?: string;
  /** Show WhatsApp share button */
  whatsapp?: boolean;
  /** Additional className */
  className?: string;
}

const ShareCard = ({
  message,
  label = "Share your moment",
  whatsapp = true,
  className = "",
}: ShareCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {label}
      </p>
      <div className="bg-muted/50 border border-border rounded-xl p-4">
        <p className="text-sm text-foreground leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
        {whatsapp && (
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            onClick={handleWhatsApp}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
};

export default ShareCard;
