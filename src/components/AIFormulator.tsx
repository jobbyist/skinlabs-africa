import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Loader2, 
  Camera, 
  Upload, 
  X, 
  ArrowLeft,
  Droplets,
  Sun,
  Moon,
  Heart,
  Zap,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import AuthDialog from "@/components/AuthDialog";
import SubscriptionPaywallModal from "@/components/SubscriptionPaywallModal";

const skinTypes = [
  { value: "dry", label: "Dry", description: "Tight, flaky, lacks moisture", icon: Droplets },
  { value: "oily", label: "Oily", description: "Shiny, prone to breakouts", icon: Sun },
  { value: "combination", label: "Combination", description: "Oily T-zone, dry cheeks", icon: Moon },
  { value: "sensitive", label: "Sensitive", description: "Easily irritated, reactive", icon: Heart },
  { value: "normal", label: "Normal", description: "Balanced, few imperfections", icon: Zap },
];

const concerns = [
  { value: "Acne & Breakouts", emoji: "🔴" },
  { value: "Fine Lines & Wrinkles", emoji: "📏" },
  { value: "Dark Spots & Hyperpigmentation", emoji: "🔵" },
  { value: "Uneven Texture", emoji: "🌊" },
  { value: "Redness & Irritation", emoji: "🔥" },
  { value: "Dullness", emoji: "💫" },
  { value: "Large Pores", emoji: "⭕" },
  { value: "Dehydration", emoji: "💧" },
  { value: "Sun Damage", emoji: "☀️" },
  { value: "Scars", emoji: "✨" },
];

const ageRanges = [
  { value: "18-24", label: "18-24", description: "Prevention focus" },
  { value: "25-34", label: "25-34", description: "Early intervention" },
  { value: "35-44", label: "35-44", description: "Active treatment" },
  { value: "45-54", label: "45-54", description: "Intensive care" },
  { value: "55+", label: "55+", description: "Restoration focus" },
];

const lifestyles = [
  { value: "active", label: "Very Active", description: "Regular exercise, outdoor activities", emoji: "🏃" },
  { value: "moderate", label: "Moderately Active", description: "Some exercise, mixed indoor/outdoor", emoji: "🚶" },
  { value: "sedentary", label: "Sedentary", description: "Mostly indoors, limited exercise", emoji: "💺" },
];

const environments = [
  { value: "humid", label: "Humid", description: "Hot and humid climate", emoji: "🌴" },
  { value: "dry", label: "Dry", description: "Dry, arid climate", emoji: "🏜️" },
  { value: "cold", label: "Cold", description: "Cold weather conditions", emoji: "❄️" },
  { value: "urban", label: "Urban", description: "City environment, pollution", emoji: "🏙️" },
  { value: "balanced", label: "Balanced", description: "Moderate climate", emoji: "🌤️" },
];

const AIFormulator = () => {
  const { user, loading: authLoading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [step, setStep] = useState(0); // Start at 0 for intro
  const [skinType, setSkinType] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [age, setAge] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [environment, setEnvironment] = useState("");
  const [currentProducts, setCurrentProducts] = useState("");
  const [allergies, setAllergies] = useState("");
  const [skinImage, setSkinImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((c) => c !== concern)
        : prev.length < 4
        ? [...prev, concern]
        : prev
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload a valid image file");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSkinImage(reader.result as string);
        toast.success("Image uploaded successfully!");
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setSkinImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    toast.info("Image removed");
  };

  const getAIRecommendation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("skincare-ai", {
        body: { 
          skinType, 
          concerns: selectedConcerns,
          age,
          lifestyle,
          environment,
          currentProducts,
          allergies,
          skinImage: skinImage ? "provided" : null
        },
      });

      if (error) {
        console.error("Error calling skincare-ai:", error);
        toast.error("Failed to generate recommendation. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setRecommendation(data.recommendation);
      // Show paywall instead of going directly to results
      if (!hasSubscription) {
        setShowPaywall(true);
      } else {
        setStep(7);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 6) {
      getAIRecommendation();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const resetFormulator = () => {
    setStep(0);
    setSkinType("");
    setSelectedConcerns([]);
    setAge("");
    setLifestyle("");
    setEnvironment("");
    setCurrentProducts("");
    setAllergies("");
    setSkinImage(null);
    setRecommendation(null);
    setShowPaywall(false);
  };

  const totalSteps = 7;
  const progress = step === 0 ? 0 : (step / totalSteps) * 100;

  // Check authentication
  if (authLoading) {
    return (
      <section id="ai-formulator" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <>
        <section id="ai-formulator" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-4">
                  <Sparkles className="h-4 w-4" />
                  AI-Powered
                </div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                  Custom Skincare Formulator
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                  Sign in to access your personalized skincare routine powered by AI.
                </p>
                <Button size="lg" onClick={() => setShowAuthDialog(true)} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Sign In to Continue
                </Button>
              </div>
            </div>
          </div>
        </section>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </>
    );
  }

  const formatRecommendation = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('##') || line.startsWith('**')) {
        return (
          <h4 key={index} className="font-semibold text-card-foreground mt-4 mb-2 text-lg">
            {line.replace(/[#*]/g, '').trim()}
          </h4>
        );
      }
      if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
        return (
          <p key={index} className="text-muted-foreground ml-4 mb-1 flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{line.trim().replace(/^[-\d.]+\s*/, '')}</span>
          </p>
        );
      }
      if (line.trim()) {
        return (
          <p key={index} className="text-muted-foreground mb-2">
            {line}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <>
      <section id="ai-formulator" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                AI-Powered Skincare Analysis
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Custom Skincare Formulator
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Get personalized, dermatologist-approved skincare recommendations 
                tailored to your unique skin profile.
              </p>
            </div>

            {/* Form card */}
            <div className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-lg">
              {/* Progress - only show when not on intro */}
              {step > 0 && step < 7 && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Step {step} of 6</span>
                    <span className="text-primary font-medium">{Math.round(progress)}% Complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Step 0: Introduction */}
              {step === 0 && (
                <div className="text-center space-y-8 py-8">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-heading font-bold text-card-foreground">
                      Ready to Transform Your Skin?
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Answer 6 quick questions about your skin, and our AI will create 
                      a personalized skincare routine just for you.
                    </p>
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <p className="text-2xl font-bold text-primary">2 min</p>
                      <p className="text-sm text-muted-foreground">Quick quiz</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <p className="text-2xl font-bold text-primary">100%</p>
                      <p className="text-sm text-muted-foreground">Personalized</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/30">
                      <p className="text-2xl font-bold text-primary">AI</p>
                      <p className="text-sm text-muted-foreground">Powered</p>
                    </div>
                  </div>

                  <Button size="lg" onClick={() => setStep(1)} className="gap-2 px-8">
                    Start My Skin Analysis
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 1: Skin Type */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      What's your skin type?
                    </h3>
                    <p className="text-muted-foreground">
                      Select the option that best describes your skin
                    </p>
                  </div>
                  <RadioGroup
                    value={skinType}
                    onValueChange={setSkinType}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {skinTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <div key={type.value}>
                          <RadioGroupItem
                            value={type.value}
                            id={type.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type.value}
                            className="flex flex-col items-center p-6 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all text-center"
                          >
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                            <span className="font-semibold text-card-foreground text-lg">{type.label}</span>
                            <span className="text-sm text-muted-foreground mt-1">{type.description}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              {/* Step 2: Concerns */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      What are your main skin concerns?
                    </h3>
                    <p className="text-muted-foreground">
                      Select up to 4 concerns (selected: {selectedConcerns.length}/4)
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {concerns.map((concern) => {
                      const isSelected = selectedConcerns.includes(concern.value);
                      return (
                        <button
                          key={concern.value}
                          onClick={() => toggleConcern(concern.value)}
                          disabled={selectedConcerns.length >= 4 && !isSelected}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? "border-primary bg-accent"
                              : selectedConcerns.length >= 4
                              ? "border-border opacity-50 cursor-not-allowed"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <span className="text-2xl">{concern.emoji}</span>
                          <span className={isSelected ? "text-card-foreground font-medium" : "text-muted-foreground"}>
                            {concern.value}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Age Range */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      What's your age range?
                    </h3>
                    <p className="text-muted-foreground">
                      This helps us tailor ingredients to your skin's needs
                    </p>
                  </div>
                  <RadioGroup
                    value={age}
                    onValueChange={setAge}
                    className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4"
                  >
                    {ageRanges.map((range) => (
                      <div key={range.value}>
                        <RadioGroupItem
                          value={range.value}
                          id={`age-${range.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`age-${range.value}`}
                          className="flex flex-col items-center p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all text-center"
                        >
                          <span className="font-bold text-xl text-card-foreground">{range.label}</span>
                          <span className="text-xs text-muted-foreground mt-1">{range.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 4: Lifestyle */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      What's your lifestyle like?
                    </h3>
                    <p className="text-muted-foreground">
                      Activity levels affect your skin's needs
                    </p>
                  </div>
                  <RadioGroup
                    value={lifestyle}
                    onValueChange={setLifestyle}
                    className="grid gap-4"
                  >
                    {lifestyles.map((style) => (
                      <div key={style.value}>
                        <RadioGroupItem
                          value={style.value}
                          id={style.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={style.value}
                          className="flex items-center gap-4 p-5 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all"
                        >
                          <span className="text-3xl">{style.emoji}</span>
                          <div>
                            <span className="font-semibold text-card-foreground text-lg block">{style.label}</span>
                            <span className="text-sm text-muted-foreground">{style.description}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 5: Environment */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      What's your environment like?
                    </h3>
                    <p className="text-muted-foreground">
                      Climate affects your skincare needs
                    </p>
                  </div>
                  <RadioGroup
                    value={environment}
                    onValueChange={setEnvironment}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {environments.map((env) => (
                      <div key={env.value}>
                        <RadioGroupItem
                          value={env.value}
                          id={`env-${env.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`env-${env.value}`}
                          className="flex flex-col items-center p-5 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all text-center"
                        >
                          <span className="text-3xl mb-2">{env.emoji}</span>
                          <span className="font-semibold text-card-foreground">{env.label}</span>
                          <span className="text-xs text-muted-foreground mt-1">{env.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 6: Products & Allergies + Image Upload */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Almost there! Any additional details?
                    </h3>
                    <p className="text-muted-foreground">
                      Optional info for more accurate recommendations
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Image Upload Section - Fixed */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Upload Skin Photo (Optional)</Label>
                      <p className="text-sm text-muted-foreground">
                        A clear, well-lit photo helps us analyze your skin better
                      </p>
                      
                      {!skinImage ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={handleCameraCapture}
                            className="h-36 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                          >
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                              <Camera className="h-7 w-7 text-primary" />
                            </div>
                            <span className="font-medium text-card-foreground">Take Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleFileUpload}
                            className="h-36 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                          >
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                              <Upload className="h-7 w-7 text-primary" />
                            </div>
                            <span className="font-medium text-card-foreground">Upload Image</span>
                          </button>
                        </div>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border-2 border-primary">
                          <img
                            src={skinImage}
                            alt="Skin preview"
                            className="w-full h-52 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">Photo uploaded</span>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={removeImage}
                            className="absolute top-3 right-3"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Hidden file inputs */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="current-products" className="text-base font-medium">
                        Current Products (Optional)
                      </Label>
                      <Textarea
                        id="current-products"
                        placeholder="e.g., Cleanser, Vitamin C serum, retinol cream..."
                        value={currentProducts}
                        onChange={(e) => setCurrentProducts(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="allergies" className="text-base font-medium">
                        Known Allergies or Sensitivities (Optional)
                      </Label>
                      <Textarea
                        id="allergies"
                        placeholder="e.g., Fragrance, retinol, certain oils..."
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: AI Results (only shown for subscribers) */}
              {step === 7 && recommendation && hasSubscription && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Your Personalized Skincare Routine
                    </h3>
                    <p className="text-muted-foreground">
                      Customized for your {skinType} skin addressing {selectedConcerns.join(", ").toLowerCase()}
                    </p>
                  </div>
                  
                  <div className="bg-secondary/30 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                    {formatRecommendation(recommendation)}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button size="lg" className="gap-2" asChild>
                      <Link to="/products">
                        Shop Recommended Products
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" onClick={resetFormulator}>
                      Start Over
                    </Button>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  </div>
                  <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                    Analyzing Your Skin Profile...
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Our AI is creating a personalized routine based on your unique skin profile
                  </p>
                  <div className="flex justify-center gap-2 mt-6">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Navigation */}
              {step > 0 && step < 7 && !isLoading && (
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={
                      (step === 1 && !skinType) ||
                      (step === 2 && selectedConcerns.length === 0) ||
                      (step === 3 && !age) ||
                      (step === 4 && !lifestyle) ||
                      (step === 5 && !environment)
                    }
                    className="gap-2 px-6"
                  >
                    {step === 6 ? (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Get My AI Routine
                      </>
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Paywall Modal */}
      {recommendation && (
        <SubscriptionPaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          previewContent={recommendation}
          skinType={skinType}
          concerns={selectedConcerns}
          age={age}
          lifestyle={lifestyle}
          environment={environment}
          currentProducts={currentProducts}
          allergies={allergies}
          onSubscriptionComplete={() => {
            setHasSubscription(true);
            setStep(7);
          }}
        />
      )}
    </>
  );
};

export default AIFormulator;
