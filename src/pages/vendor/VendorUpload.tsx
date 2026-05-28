import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { checkProfanity } from "@/lib/profanityFilter";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, X, ImagePlus, Loader2, Ticket, Calendar, MapPin, ShieldBan } from "lucide-react";
import { useVendorTicketPermission } from "@/hooks/useVendorTicketPermission";

const TICKET_CATEGORY_SLUGS = new Set([
  "food-ticket",
  "drinks-ticket",
  "games-ticket",
  "gate-entry-ticket",
  "parking-ticket",
]);

const VendorUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canCreateTickets } = useVendorTicketPermission();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Ticket-specific fields
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [ticketTerms, setTicketTerms] = useState("");
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug").order("name");
      return data ?? [];
    },
  });

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isTicketCategory = selectedCategory ? TICKET_CATEGORY_SLUGS.has(selectedCategory.slug) : false;

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const allowed = incoming.slice(0, 5 - images.length);
    if (allowed.length === 0) return;
    setImages((prev) => [...prev, ...allowed]);
    allowed.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }, [images.length]);

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title || !price || images.length === 0) {
      toast({ title: "Missing fields", description: "Please fill title, price, and add at least one image.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // ── Profanity check ───────────────────────────────────
    const titleCheck = await checkProfanity(title);
    if (titleCheck.ok && !titleCheck.clean) {
      toast({ title: "Inappropriate title", description: "Please remove inappropriate language from the product title.", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    if (description) {
      const descCheck = await checkProfanity(description);
      if (descCheck.ok && !descCheck.clean) {
        toast({ title: "Inappropriate description", description: "Please remove inappropriate language from the description.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
    }

    try {
      // Upload images
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

      const ticketMeta = isTicketCategory
        ? {
            event_date: eventDate || null,
            venue: venue || null,
            valid_from: validFrom || null,
            valid_to: validTo || null,
            terms: ticketTerms || null,
          }
        : null;

      const { error: insertError } = await supabase.from("products").insert({
        vendor_id: user.id,
        title,
        slug,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        category_id: categoryId || null,
        product_type: isTicketCategory ? "ticket" : "physical",
        ticket_meta: ticketMeta,
        sponsored: false,
        images: uploadedUrls,
        status: "pending",
      });

      if (insertError) throw insertError;

      toast({ title: "Product submitted!", description: "Your product is under review." });
      navigate("/vendor/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-10">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Upload Product</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Product Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Handmade Leather Wallet" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product..." rows={4} />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (GMD) *</Label>
              <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input id="stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setEventDate(""); setVenue(""); setValidFrom(""); setValidTo(""); setTicketTerms(""); }}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => canCreateTickets || !TICKET_CATEGORY_SLUGS.has(c.slug))
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {!canCreateTickets && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ShieldBan className="h-3 w-3" />
                Ticket categories require superadmin permission
              </p>
            )}
          </div>

          {/* Ticket-specific fields */}
          {isTicketCategory && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Ticket className="h-4 w-4" />
                Ticket Details
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Event Date
                  </Label>
                  <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue" className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Venue / Location
                  </Label>
                  <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Banjul Stadium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input id="validFrom" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validTo">Valid Until</Label>
                  <Input id="validTo" type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketTerms">Terms & Conditions</Label>
                <Textarea id="ticketTerms" value={ticketTerms} onChange={(e) => setTicketTerms(e.target.value)} placeholder="e.g. One entry per ticket, no re-entry..." rows={2} />
              </div>
            </div>
          )}

          {/* Images */}
          <div className="space-y-2">
            <Label>Images * (up to 5)</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop images here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">{images.length}/5 images</p>
              <input id="file-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
            </div>
            {previews.length > 0 && (
              <div className="flex gap-3 flex-wrap mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? <><Loader2 className="animate-spin mr-2" /> Uploading...</> : <><Upload className="mr-2" /> Submit Product</>}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default VendorUpload;
