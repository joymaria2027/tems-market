import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { checkFields } from "@/lib/profanityFilter";
import {
  Store,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Building2,
  Phone,
  Package,
  HeartHandshake,
  FileText,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import Confetti from "@/components/Confetti";
import ShareCard from "@/components/ShareCard";

const BUSINESS_TYPES = [
  { value: "fashion_thrift", label: "Fashion & Thrift" },
  { value: "electronics", label: "Electronics & Gadgets" },
  { value: "food_snacks", label: "Food & Snacks" },
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "home_living", label: "Home & Living" },
  { value: "arts_crafts", label: "Arts & Crafts" },
  { value: "baby_kids", label: "Baby & Kids" },
  { value: "books_media", label: "Books & Media" },
  { value: "health_wellness", label: "Health & Wellness" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
] as const;

const HEAR_ABOUT = [
  { value: "social_media", label: "Social Media" },
  { value: "from_vendor", label: "From a Vendor" },
  { value: "friend_family", label: "Friend or Family" },
  { value: "radio", label: "Radio" },
  { value: "online_search", label: "Online Search" },
  { value: "flyer", label: "Saw a Flyer" },
  { value: "other", label: "Other" },
] as const;

const SOURCING_OPTIONS = [
  { value: "self_made", label: "I make/produce them myself" },
  { value: "local_suppliers", label: "Local suppliers" },
  { value: "import", label: "Import from abroad" },
  { value: "dropshipping", label: "Drop shipping" },
  { value: "handcrafted", label: "Handcrafted" },
  { value: "other", label: "Other" },
] as const;

const PRODUCT_COUNTS = [
  { value: "1-5", label: "1–5" },
  { value: "6-20", label: "6–20" },
  { value: "21-50", label: "21–50" },
  { value: "50+", label: "50+" },
] as const;

const DELIVERY_OPTIONS = [
  { value: "self_delivery", label: "I deliver myself" },
  { value: "delivery_service", label: "I'll use a delivery service" },
  { value: "customer_pickup", label: "Customer picks up" },
  { value: "undecided", label: "Not decided yet" },
] as const;

const DELIVERY_AREAS = [
  { value: "banjul", label: "Banjul" },
  { value: "serekunda", label: "Serekunda" },
  { value: "brikama", label: "Brikama" },
  { value: "bakau", label: "Bakau" },
  { value: "farafenni", label: "Farafenni" },
  { value: "other_areas", label: "Other areas in Gambia" },
  { value: "nationwide", label: "Nationwide" },
] as const;

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "mandinka", label: "Mandinka" },
  { value: "wolof", label: "Wolof" },
  { value: "fula", label: "Fula" },
  { value: "other", label: "Other" },
] as const;

const PHYSICAL_STORE = [
  { value: "yes", label: "Yes, I have a shop" },
  { value: "online_only", label: "No, I sell online only" },
  { value: "planning", label: "Planning to open one" },
] as const;

const INVENTORY_READINESS = [
  { value: "ready", label: "Yes, I have inventory ready" },
  { value: "partial", label: "Partially, still preparing" },
  { value: "starting_from_scratch", label: "No, starting from scratch" },
] as const;

const AFFILIATE_OPTIONS = [
  { value: "yes", label: "Yes, I want more exposure" },
  { value: "maybe_later", label: "No, not yet" },
  { value: "not_interested", label: "Maybe later" },
] as const;

const SPONSORED_OPTIONS = [
  { value: "yes", label: "Yes, interested" },
  { value: "no", label: "No, not at this time" },
  { value: "need_info", label: "Need more information" },
] as const;

const PHOTO_READINESS = [
  { value: "high_quality", label: "Yes, high-quality photos" },
  { value: "phone_photos", label: "Phone photos" },
  { value: "not_yet", label: "Not yet" },
] as const;

interface FormData {
  // Step 1 — Business
  businessName: string;
  businessCategory: string;
  businessCategoryOther: string;
  businessDescription: string;
  specificItems: string;
  location: string;
  registrationNumber: string;
  // Step 2 — Contact
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  physicalStore: string;
  hearAbout: string;
  // Step 3 — Inventory
  inventoryReady: string;
  sourcing: string;
  productCount: string;
  deliveryMethod: string;
  deliveryAreas: string[];
  monthlyTarget: string;
  // Step 4 — Preferences
  affiliateOptIn: string;
  sponsoredInterest: string;
  photoReadiness: string;
  language: string;
  // Step 5 — Terms
  agreeAccurate: boolean;
  agreeApproval: boolean;
  agreeTerms: boolean;
  agreeAge: boolean;
  additionalNotes: string;
}

const STEPS = [
  { number: 1, title: "Business Info", icon: Building2 },
  { number: 2, title: "Contact Details", icon: Phone },
  { number: 3, title: "Inventory & Delivery", icon: Package },
  { number: 4, title: "Preferences", icon: HeartHandshake },
  { number: 5, title: "Confirmation", icon: FileText },
];

const INITIAL_FORM: FormData = {
  businessName: "",
  businessCategory: "",
  businessCategoryOther: "",
  businessDescription: "",
  specificItems: "",
  location: "",
  registrationNumber: "",
  fullName: "",
  phone: "",
  whatsapp: "",
  email: "",
  physicalStore: "",
  hearAbout: "",
  inventoryReady: "",
  sourcing: "",
  productCount: "",
  deliveryMethod: "",
  deliveryAreas: [],
  monthlyTarget: "",
  affiliateOptIn: "",
  sponsoredInterest: "",
  photoReadiness: "",
  language: "",
  agreeAccurate: false,
  agreeApproval: false,
  agreeTerms: false,
  agreeAge: false,
  additionalNotes: "",
};

const ApplyAsVendor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successEntered, setSuccessEntered] = useState(false);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleDeliveryArea = (area: string) => {
    setForm((prev) => ({
      ...prev,
      deliveryAreas: prev.deliveryAreas.includes(area)
        ? prev.deliveryAreas.filter((a) => a !== area)
        : [...prev.deliveryAreas, area],
    }));
  };

  // --- Step validation ---
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.businessName.trim()) errs.businessName = "Business name is required";
      if (!form.businessCategory) errs.businessCategory = "Select a business category";
      if (form.businessCategory === "other" && !form.businessCategoryOther.trim()) errs.businessCategoryOther = "Please specify your business type";
      if (!form.businessDescription.trim()) errs.businessDescription = "Tell us about your business";
      if (!form.specificItems.trim()) errs.specificItems = "Describe what you'll sell";
      if (!form.location.trim()) errs.location = "Location is required";
    } else if (s === 2) {
      if (!form.fullName.trim()) errs.fullName = "Full name is required";
      if (!form.phone.trim()) errs.phone = "Phone number is required";
      if (!form.whatsapp.trim()) errs.whatsapp = "WhatsApp number is required";
      if (!form.email.trim()) errs.email = "Email address is required";
      if (!form.physicalStore) errs.physicalStore = "Select an option";
      if (!form.hearAbout) errs.hearAbout = "Select how you heard about us";
    } else if (s === 3) {
      if (!form.inventoryReady) errs.inventoryReady = "Select an option";
      if (!form.sourcing) errs.sourcing = "Select how you source products";
      if (!form.productCount) errs.productCount = "Select estimated product count";
      if (!form.deliveryMethod) errs.deliveryMethod = "Select how you'll handle delivery";
      if (form.deliveryAreas.length === 0) errs.deliveryAreas = "Select at least one delivery area";
    } else if (s === 4) {
      if (!form.affiliateOptIn) errs.affiliateOptIn = "Select an option";
      if (!form.sponsoredInterest) errs.sponsoredInterest = "Select an option";
      if (!form.photoReadiness) errs.photoReadiness = "Select an option";
      if (!form.language) errs.language = "Select preferred language";
    } else if (s === 5) {
      if (!form.agreeAccurate) errs.agreeAccurate = "You must confirm this";
      if (!form.agreeApproval) errs.agreeApproval = "You must confirm this";
      if (!form.agreeTerms) errs.agreeTerms = "You must agree to the terms";
      if (!form.agreeAge) errs.agreeAge = "You must confirm you are 18+";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 5));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // --- Submit ---
  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setSubmitting(true);

    // ── Profanity check ───────────────────────────────────
    const flagged = await checkFields({
      businessName: form.businessName,
      businessDescription: form.businessDescription,
      specificItems: form.specificItems,
      additionalNotes: form.additionalNotes,
    });
    if (flagged) {
      const labels: Record<string, string> = {
        businessName: "Business name",
        businessDescription: "Business description",
        specificItems: "Items you'll sell",
        additionalNotes: "Additional notes",
      };
      toast({
        title: "Inappropriate content",
        description: `Please remove inappropriate language from the ${labels[flagged.field] || flagged.field}.`,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("vendor_applications").insert({
        business_name: form.businessName.trim(),          category: form.businessCategory,
        phone: form.phone.trim(),
        description: form.businessDescription.trim(),
        location: form.location.trim(),
        extra_data: {
          specificItems: form.specificItems.trim(),
          registrationNumber: form.registrationNumber.trim(),
          fullName: form.fullName.trim(),
          whatsapp: form.whatsapp.trim(),
          email: form.email.trim(),
          physicalStore: form.physicalStore,
          hearAbout: form.hearAbout,
          inventoryReady: form.inventoryReady,
          sourcing: form.sourcing,
          productCount: form.productCount,
          deliveryMethod: form.deliveryMethod,
          deliveryAreas: form.deliveryAreas,
          monthlyTarget: form.monthlyTarget,
          affiliateOptIn: form.affiliateOptIn,
          sponsoredInterest: form.sponsoredInterest,
          photoReadiness: form.photoReadiness,
          language: form.language,
          customCategory: form.businessCategory === "other" ? form.businessCategoryOther.trim() : null,
          additionalNotes: form.additionalNotes.trim(),
        },
      });

      if (error) throw error;

      // ── Fire-and-forget: notify admins ────────────────
      supabase.functions.invoke("notify-new-application", {
        body: {
          businessName: form.businessName.trim(),
          category: form.businessCategory,
          phone: form.phone.trim(),
          description: form.businessDescription.trim(),
        },
      }).catch((err) => {
        console.error("Failed to notify admins:", err);
      });

      setSubmitted(true);
      // Trigger ceremony entrance after state settles
      setTimeout(() => setSuccessEntered(true), 100);
      toast({
        title: "Application submitted!",
        description: "We'll review your application and be in touch within 48 hours.",
      });
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Success screen (GIFT, not receipt) ---
  if (submitted) {
    const shareMsg = `I just applied to sell on Tems Market! 🏪 My business "${form.businessName}" is under review. Check it out → ${window.location.origin}/become-a-vendor`;

    return (
      <Layout>
        {/* Stage 2: Confetti ceremony */}
        <Confetti active={successEntered} count={90} duration={3500} />

        <div className="container py-16 md:py-24 max-w-lg mx-auto text-center space-y-6">
          {/* Stage 2: Bouncing store icon */}
          <div
            className={`mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-700 ${successEntered ? "opacity-100" : "opacity-0 scale-50"}`}
            style={{
              animation: successEntered ? "vendorStoreBounce 0.7s ease-out 0.3s both" : "none",
            }}
          >
            <Store className="h-10 w-10 text-primary" />
          </div>

          {/* Stage 2: Title with business name highlight */}
          <div className={`space-y-3 transition-all duration-700 delay-200 ${successEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Application Submitted! 🎉
            </h1>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary text-sm">{form.businessName}</span>
              <span className="text-muted-foreground text-sm">is under review!</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Our team will review your application and you'll receive a WhatsApp message within <strong>48 hours</strong>.
            </p>
          </div>

          {/* Stage 3: Staggered next-steps (afterglow) */}
          <div className={`bg-secondary/30 rounded-xl border border-border p-5 text-left space-y-3 text-sm transition-all duration-700 delay-500 ${successEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="font-medium text-foreground">What happens next?</p>
            {["An admin reviews your application", "If approved, you'll receive an invite link via WhatsApp", "Tap the link, set your password, and start listing products"].map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3"
                style={{ animation: successEntered ? `fadeSlideIn 0.4s ease-out ${0.8 + i * 0.15}s both` : "none" }}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>

          {/* Stage 3: Share afterglow */}
          <div className={`transition-all duration-700 delay-700 ${successEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <ShareCard
              message={shareMsg}
              label="Tell your friends!"
              whatsapp
            />
          </div>

          <div className={`flex flex-col sm:flex-row gap-3 justify-center pt-2 transition-all duration-500 delay-1000 ${successEntered ? "opacity-100" : "opacity-0"}`}>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/shop">Browse Marketplace</Link>
            </Button>
          </div>
        </div>

        <style>{`
          @keyframes vendorStoreBounce {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.15); opacity: 1; }
            70% { transform: scale(0.95); }
            100% { transform: scale(1); }
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/become-a-vendor")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vendor info
        </button>

        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1 mb-3">
            <Sparkles className="h-3 w-3 mr-1 text-primary" />
            Vendor Application
          </Badge>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Apply to Sell on Tems Market
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Step {step} of 5 — {STEPS[step - 1].title}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 md:mb-10">
          {STEPS.map((s, i) => {
            const isActive = s.number === step;
            const isComplete = s.number < step;
            return (
              <div key={s.number} className="flex-1 flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 transition-all duration-300 ${
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : s.number}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors duration-300 ${
                      isComplete ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {(() => {
                const Icon = STEPS[step - 1].icon;
                return <Icon className="h-5 w-5 text-primary" />;
              })()}
              {STEPS[step - 1].title}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about your business and what you plan to sell."}
              {step === 2 && "How we'll reach you and where you're based."}
              {step === 3 && "Your current inventory, sourcing, and delivery setup."}
              {step === 4 && "Feature preferences and communication settings."}
              {step === 5 && "Review and submit your application."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* === STEP 1: Business Info === */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="e.g. Fatou's Fashion House"
                    value={form.businessName}
                    onChange={(e) => updateField("businessName", e.target.value)}
                    className={errors.businessName ? "border-destructive" : ""}
                  />
                  {errors.businessName && (
                    <p className="text-xs text-destructive">{errors.businessName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCategory">
                    Business Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.businessCategory}
                    onValueChange={(v) => updateField("businessCategory", v)}
                  >
                    <SelectTrigger id="businessCategory" className={errors.businessCategory ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessCategory && (
                    <p className="text-xs text-destructive">{errors.businessCategory}</p>
                  )}
                </div>

                {form.businessCategory === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="businessCategoryOther">
                      Please specify your business type <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessCategoryOther"
                      placeholder="e.g. Photography, Event Planning, Farming"
                      value={form.businessCategoryOther}
                      onChange={(e) => updateField("businessCategoryOther", e.target.value)}
                      className={errors.businessCategoryOther ? "border-destructive" : ""}
                    />
                    {errors.businessCategoryOther && (
                      <p className="text-xs text-destructive">{errors.businessCategoryOther}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">
                    Tell us about your business <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="businessDescription"
                    placeholder="What do you sell? What makes your brand unique? What's your story?"
                    rows={3}
                    value={form.businessDescription}
                    onChange={(e) => updateField("businessDescription", e.target.value)}
                    className={errors.businessDescription ? "border-destructive" : ""}
                  />
                  {errors.businessDescription && (
                    <p className="text-xs text-destructive">{errors.businessDescription}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specificItems">
                    What specific items/services will you list? <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="specificItems"
                    placeholder="Be specific — e.g., 'Second-hand clothing, accessories, and custom jewelry'"
                    rows={2}
                    value={form.specificItems}
                    onChange={(e) => updateField("specificItems", e.target.value)}
                    className={errors.specificItems ? "border-destructive" : ""}
                  />
                  {errors.specificItems && (
                    <p className="text-xs text-destructive">{errors.specificItems}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    Location in The Gambia <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g. Serekunda, Banjul"
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className={errors.location ? "border-destructive" : ""}
                  />
                  {errors.location && (
                    <p className="text-xs text-destructive">{errors.location}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Business Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    placeholder="Optional — for registered businesses"
                    value={form.registrationNumber}
                    onChange={(e) => updateField("registrationNumber", e.target.value)}
                  />
                </div>
              </>
            )}

            {/* === STEP 2: Contact === */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name (Owner/Proprietor) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+220 123 4567"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">
                    WhatsApp Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="whatsapp"
                    placeholder="+220 123 4567"
                    value={form.whatsapp}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                    className={errors.whatsapp ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be our primary way to contact you about your application.
                  </p>
                  {errors.whatsapp && (
                    <p className="text-xs text-destructive">{errors.whatsapp}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your invite link will be sent to this address.
                  </p>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>
                    Do you have a physical store? <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={form.physicalStore}
                    onValueChange={(v) => updateField("physicalStore", v)}
                  >
                    {PHYSICAL_STORE.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.value} id={`store-${opt.value}`} />
                        <Label htmlFor={`store-${opt.value}`} className="font-normal cursor-pointer">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.physicalStore && (
                    <p className="text-xs text-destructive">{errors.physicalStore}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hearAbout">
                    How did you hear about Tems Market? <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.hearAbout}
                    onValueChange={(v) => updateField("hearAbout", v)}
                  >
                    <SelectTrigger id="hearAbout" className={errors.hearAbout ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEAR_ABOUT.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.hearAbout && (
                    <p className="text-xs text-destructive">{errors.hearAbout}</p>
                  )}
                </div>
              </>
            )}

            {/* === STEP 3: Inventory & Delivery === */}
            {step === 3 && (
              <>
                <div className="space-y-3">
                  <Label>
                    Do you have products ready to list? <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={form.inventoryReady}
                    onValueChange={(v) => updateField("inventoryReady", v)}
                  >
                    {INVENTORY_READINESS.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.value} id={`inv-${opt.value}`} />
                        <Label htmlFor={`inv-${opt.value}`} className="font-normal cursor-pointer">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.inventoryReady && (
                    <p className="text-xs text-destructive">{errors.inventoryReady}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourcing">
                    How do you source your products? <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.sourcing}
                    onValueChange={(v) => updateField("sourcing", v)}
                  >
                    <SelectTrigger id="sourcing" className={errors.sourcing ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sourcing && (
                    <p className="text-xs text-destructive">{errors.sourcing}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productCount">
                    How many products will you list initially? <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.productCount}
                    onValueChange={(v) => updateField("productCount", v)}
                  >
                    <SelectTrigger id="productCount" className={errors.productCount ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_COUNTS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.productCount && (
                    <p className="text-xs text-destructive">{errors.productCount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryMethod">
                    How will you handle delivery? <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.deliveryMethod}
                    onValueChange={(v) => updateField("deliveryMethod", v)}
                  >
                    <SelectTrigger id="deliveryMethod" className={errors.deliveryMethod ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.deliveryMethod && (
                    <p className="text-xs text-destructive">{errors.deliveryMethod}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>
                    Where can you deliver? <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DELIVERY_AREAS.map((area) => (
                      <div key={area.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`area-${area.value}`}
                          checked={form.deliveryAreas.includes(area.value)}
                          onCheckedChange={() => toggleDeliveryArea(area.value)}
                        />
                        <Label htmlFor={`area-${area.value}`} className="font-normal cursor-pointer text-sm">
                          {area.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.deliveryAreas && (
                    <p className="text-xs text-destructive">{errors.deliveryAreas}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyTarget">Estimated monthly sales target (GMD)</Label>
                  <Input
                    id="monthlyTarget"
                    type="number"
                    placeholder="Optional — e.g. 50000"
                    value={form.monthlyTarget}
                    onChange={(e) => updateField("monthlyTarget", e.target.value)}
                  />
                </div>
              </>
            )}

            {/* === STEP 4: Preferences === */}
            {step === 4 && (
              <>
                <div className="space-y-3">
                  <Label>
                    Would you like affiliates to promote your products?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Affiliates share your product links and earn commissions on sales they bring.
                  </p>
                  <RadioGroup
                    value={form.affiliateOptIn}
                    onValueChange={(v) => updateField("affiliateOptIn", v)}
                  >
                    {AFFILIATE_OPTIONS.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.value} id={`aff-${opt.value}`} />
                        <Label htmlFor={`aff-${opt.value}`} className="font-normal cursor-pointer">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.affiliateOptIn && (
                    <p className="text-xs text-destructive">{errors.affiliateOptIn}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>
                    Are you interested in sponsored/featured listings?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Featured listings appear at the top of the marketplace for extra visibility.
                  </p>
                  <RadioGroup
                    value={form.sponsoredInterest}
                    onValueChange={(v) => updateField("sponsoredInterest", v)}
                  >
                    {SPONSORED_OPTIONS.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.value} id={`spon-${opt.value}`} />
                        <Label htmlFor={`spon-${opt.value}`} className="font-normal cursor-pointer">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.sponsoredInterest && (
                    <p className="text-xs text-destructive">{errors.sponsoredInterest}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>
                    Do you have product photos ready? <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={form.photoReadiness}
                    onValueChange={(v) => updateField("photoReadiness", v)}
                  >
                    {PHOTO_READINESS.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.value} id={`photo-${opt.value}`} />
                        <Label htmlFor={`photo-${opt.value}`} className="font-normal cursor-pointer">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.photoReadiness && (
                    <p className="text-xs text-destructive">{errors.photoReadiness}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">
                    Preferred communication language{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.language}
                    onValueChange={(v) => updateField("language", v)}
                  >
                    <SelectTrigger id="language" className={errors.language ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.language && (
                    <p className="text-xs text-destructive">{errors.language}</p>
                  )}
                </div>
              </>
            )}

            {/* === STEP 5: Confirmation === */}
            {step === 5 && (
              <>
                {/* Summary */}
                <div className="bg-secondary/20 rounded-lg border border-border p-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Business:</span>
                    <span className="font-medium text-foreground">{form.businessName}</span>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium text-foreground">
                      {BUSINESS_TYPES.find((t) => t.value === form.businessCategory)?.label}
                    </span>
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium text-foreground">{form.location}</span>
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium text-foreground">{form.phone}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {([
                    { key: "agreeAccurate" as const, label: "I confirm all information provided is accurate and complete" },
                    { key: "agreeApproval" as const, label: "I understand products require admin approval before going live" },
                    { key: "agreeTerms" as const, label: "I agree to Tems Market's vendor terms and conditions" },
                    { key: "agreeAge" as const, label: "I am 18 years or older and authorized to operate this business" },
                  ] as const).map((item) => (
                    <div key={item.key} className="flex items-start gap-2">
                      <Checkbox
                        id={item.key}
                        checked={form[item.key]}
                        onCheckedChange={(v) => updateField(item.key, v === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={item.key} className="font-normal cursor-pointer text-sm leading-5">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                  {errors.agreeAccurate && (
                    <p className="text-xs text-destructive">{errors.agreeAccurate}</p>
                  )}
                  {errors.agreeApproval && (
                    <p className="text-xs text-destructive">{errors.agreeApproval}</p>
                  )}
                  {errors.agreeTerms && (
                    <p className="text-xs text-destructive">{errors.agreeTerms}</p>
                  )}
                  {errors.agreeAge && (
                    <p className="text-xs text-destructive">{errors.agreeAge}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional notes or questions</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Anything you'd like the Tems Market team to know?"
                    rows={3}
                    value={form.additionalNotes}
                    onChange={(e) => updateField("additionalNotes", e.target.value)}
                  />
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border pt-5">
            <div>
              {step > 1 ? (
                <Button variant="outline" onClick={prevStep} disabled={submitting}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/become-a-vendor">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Cancel
                  </Link>
                </Button>
              )}
            </div>
            <div>
              {step < 5 ? (
                <Button onClick={nextStep}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      Submit Application <Check className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Trust indicator */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Your information is kept confidential and will only be used for your vendor application review.
        </p>
      </div>
    </Layout>
  );
};

export default ApplyAsVendor;
