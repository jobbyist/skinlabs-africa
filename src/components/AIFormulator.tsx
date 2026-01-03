import { useState, useRef } from "react";
import { Sparkles, ChevronRight, CheckCircle2, Loader2, Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import AuthDialog from "@/components/AuthDialog";

const skinTypes = [
  { value: "dry", label: "Dry", description: "Tight, flaky, lacks moisture" },
  { value: "oily", label: "Oily", description: "Shiny, prone to breakouts" },
  { value: "combination", label: "Combination", description: "Oily T-zone, dry cheeks" },
  { value: "sensitive", label: "Sensitive", description: "Easily irritated, reactive" },
  { value: "normal", label: "Normal", description: "Balanced, few imperfections" },
];

const concerns = [
  "Acne & Breakouts",
  "Fine Lines & Wrinkles",
  "Dark Spots & Hyperpigmentation",
  "Uneven Texture",
  "Redness & Irritation",
  "Dullness",
  "Large Pores",
  "Dehydration",
  "Sun Damage",
  "Scars",
];

const ageRanges = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55+", label: "55+" },
];

const lifestyles = [
  { value: "active", label: "Very Active", description: "Regular exercise, outdoor activities" },
  { value: "moderate", label: "Moderately Active", description: "Some exercise, mixed indoor/outdoor" },
  { value: "sedentary", label: "Sedentary", description: "Mostly indoors, limited exercise" },
];

const environments = [
  { value: "humid", label: "Humid", description: "Hot and humid climate" },
  { value: "dry", label: "Dry", description: "Dry, arid climate" },
  { value: "cold", label: "Cold", description: "Cold weather conditions" },
  { value: "urban", label: "Urban", description: "City environment, pollution" },
  { value: "balanced", label: "Balanced", description: "Moderate climate" },
];

const AIFormulator = () => {
  const { user, loading: authLoading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [step, setStep] = useState(1);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const reader = new FileReader();
      reader.onloadend = () => {
        setSkinImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setSkinImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
          skinImage: skinImage ? "provided" : null // Send flag, not the full image for now
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
      setStep(7);
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

  const resetFormulator = () => {
    setStep(1);
    setSkinType("");
    setSelectedConcerns([]);
    setAge("");
    setLifestyle("");
    setEnvironment("");
    setCurrentProducts("");
    setAllergies("");
    setSkinImage(null);
    setRecommendation(null);
  };

  const totalSteps = 7;
  const progress = (step / totalSteps) * 100;

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
              {/* Header */}
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

  // Parse recommendation into sections for better display
  const formatRecommendation = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('##') || line.startsWith('**')) {
        return (
          <h4 key={index} className="font-semibold text-card-foreground mt-4 mb-2">
            {line.replace(/[#*]/g, '').trim()}
          </h4>
        );
      }
      if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
        return (
          <p key={index} className="text-muted-foreground ml-4 mb-1">
            {line.trim()}
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
    <section id="ai-formulator" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              AI-Powered
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Custom Skincare Formulator
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Answer a few questions about your skin and let our AI create a 
              personalized skincare routine just for you.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-lg">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
                <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step 1: Skin Type */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-heading font-semibold text-card-foreground">
                  What's your skin type?
                </h3>
                <RadioGroup
                  value={skinType}
                  onValueChange={setSkinType}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  {skinTypes.map((type) => (
                    <div key={type.value}>
                      <RadioGroupItem
                        value={type.value}
                        id={type.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={type.value}
                        className="flex flex-col p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all"
                      >
                        <span className="font-medium text-card-foreground">{type.label}</span>
                        <span className="text-sm text-muted-foreground">{type.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 2: Concerns */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading font-semibold text-card-foreground">
                    What are your main skin concerns?
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select up to 4 concerns
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {concerns.map((concern) => {
                    const isSelected = selectedConcerns.includes(concern);
                    return (
                      <button
                        key={concern}
                        onClick={() => toggleConcern(concern)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-primary bg-accent"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className={isSelected ? "text-card-foreground font-medium" : "text-muted-foreground"}>
                          {concern}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
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
                <h3 className="text-xl font-heading font-semibold text-card-foreground">
                  What's your age range?
                </h3>
                <RadioGroup
                  value={age}
                  onValueChange={setAge}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  {ageRanges.map((range) => (
                    <div key={range.value}>
                      <RadioGroupItem
                        value={range.value}
                        id={range.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={range.value}
                        className="flex items-center justify-center p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all"
                      >
                        <span className="font-medium text-card-foreground">{range.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 4: Lifestyle */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-heading font-semibold text-card-foreground">
                  What's your lifestyle like?
                </h3>
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
                        className="flex flex-col p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all"
                      >
                        <span className="font-medium text-card-foreground">{style.label}</span>
                        <span className="text-sm text-muted-foreground">{style.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 5: Environment */}
            {step === 5 && (
              <div className="space-y-6">
                <h3 className="text-xl font-heading font-semibold text-card-foreground">
                  What's your environment like?
                </h3>
                <RadioGroup
                  value={environment}
                  onValueChange={setEnvironment}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  {environments.map((env) => (
                    <div key={env.value}>
                      <RadioGroupItem
                        value={env.value}
                        id={env.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={env.value}
                        className="flex flex-col p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all"
                      >
                        <span className="font-medium text-card-foreground">{env.label}</span>
                        <span className="text-sm text-muted-foreground">{env.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 6: Products & Allergies + Image Upload */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading font-semibold text-card-foreground mb-2">
                    Additional Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Help us create the best routine for you
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-products">
                      Current Products (Optional)
                    </Label>
                    <Textarea
                      id="current-products"
                      placeholder="e.g., Cleanser, Vitamin C serum, retinol cream..."
                      value={currentProducts}
                      onChange={(e) => setCurrentProducts(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">
                      Known Allergies or Sensitivities (Optional)
                    </Label>
                    <Textarea
                      id="allergies"
                      placeholder="e.g., Fragrance, retinol, certain oils..."
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Skin Photo (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload a clear photo of your skin for more accurate analysis
                    </p>
                    
                    {!skinImage ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCameraCapture}
                          className="h-32 flex flex-col gap-2"
                        >
                          <Camera className="h-8 w-8" />
                          <span>Take Photo</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-32 flex flex-col gap-2"
                        >
                          <Upload className="h-8 w-8" />
                          <span>Upload Image</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={skinImage}
                          alt="Skin preview"
                          className="w-full h-48 object-cover rounded-xl border-2 border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={removeImage}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: AI Results */}
            {step === 7 && recommendation && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-card-foreground mb-2">
                    Your Personalized Skincare Routine
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Based on your {skinType} skin and concerns with {selectedConcerns.join(", ").toLowerCase()}
                  </p>
                </div>
                
                <div className="bg-secondary/30 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                  {formatRecommendation(recommendation)}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button size="lg" className="gap-2">
                    Shop Recommended Products
                    <ChevronRight className="h-4 w-4" />
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
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-heading font-semibold text-card-foreground mb-2">
                  Analyzing Your Skin Profile...
                </h3>
                <p className="text-muted-foreground">
                  Our AI is creating your personalized routine
                </p>
              </div>
            )}

            {/* Navigation */}
            {step < 7 && !isLoading && (
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 1}
                >
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
                  className="gap-2"
                >
                  {step === 6 ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get AI Recommendation
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
  );
};

export default AIFormulator;
