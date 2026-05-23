import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, Upload, X } from "lucide-react";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; message: string }> = {
  unverified: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    color: "border-amber-500/30 bg-amber-500/5",
    message: "Your account is not yet verified. You can upload products but they won't go live until you are verified. Submit your documents to get verified.",
  },
  pending_verification: {
    icon: <Clock className="h-5 w-5 text-blue-500 shrink-0" />,
    color: "border-blue-500/30 bg-blue-500/5",
    message: "Your verification is under review. We'll notify you once it's processed.",
  },
  verified: {
    icon: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
    color: "border-emerald-500/30 bg-emerald-500/5",
    message: "Your account is verified. Your approved products are live on the shop.",
  },
  suspended: {
    icon: <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />,
    color: "border-destructive/30 bg-destructive/5",
    message: "Your account has been suspended. Please contact support for more information.",
  },
};

const VendorVerificationBanner = ({ vendorStatus, verificationNote }: { vendorStatus: string; verificationNote: string | null }) => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const config = statusConfig[vendorStatus] ?? statusConfig.unverified;
  const showUploadForm = vendorStatus === "unverified";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!user || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/verification/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }

      // 1. Update status to pending
      const { error: userError } = await supabase
        .from("users")
        .update({ status: "pending" })
        .eq("id", user.id);
      if (userError) throw userError;

      // 2. Upsert vendor_profile
      const { error: profileError } = await supabase
        .from("vendor_profiles")
        .upsert({
          user_id: user.id,
          business_name: profile?.full_name || "My Business",
          id_document_url: urls[0] || null,
        });
      if (profileError) throw profileError;

      toast({ title: "Documents submitted", description: "Your verification is now under review." });
      setFiles([]);
      await refreshProfile();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`rounded-lg border p-4 mb-6 ${config.color}`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <p className="text-sm text-foreground">{config.message}</p>
          {verificationNote && vendorStatus === "suspended" && (
            <p className="text-xs text-muted-foreground mt-1">Note: {verificationNote}</p>
          )}

          {showUploadForm && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">Upload photo of your National ID or Business Registration (max 5 files).</p>
              <Input type="file" accept="image/*" multiple onChange={handleFileChange} />
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {f.name.slice(0, 20)}
                      <button onClick={() => removeFile(i)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
              <Button size="sm" disabled={files.length === 0 || uploading} onClick={handleSubmit}>
                <Upload className="h-4 w-4 mr-1" /> {uploading ? "Uploading..." : "Submit for Verification"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorVerificationBanner;
