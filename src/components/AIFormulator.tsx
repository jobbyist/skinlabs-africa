import { useState } from "react";
import { Sparkles, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  "Dark Spots",
  "Uneven Texture",
  "Redness",
  "Dullness",
  "Large Pores",
  "Dehydration",
];

const AIFormulator = () => {
  const [step, setStep] = useState(1);
  const [skinType, setSkinType] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((c) => c !== concern)
        : prev.length < 3
        ? [...prev, concern]
        : prev
    );
  };

  const getAIRecommendation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("skincare-ai", {
        body: { skinType, concerns: selectedConcerns },
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
      setStep(3);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      getAIRecommendation();
    } else {
      setStep(step + 1);
    }
  };

  const resetFormulator = () => {
    setStep(1);
    setSkinType("");
    setSelectedConcerns([]);
    setRecommendation(null);
  };

  const progress = (step / 3) * 100;

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
                <span className="text-muted-foreground">Step {step} of 3</span>
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
                    Select up to 3 concerns
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

            {/* Step 3: AI Results */}
            {step === 3 && recommendation && (
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
            {step < 3 && !isLoading && (
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
                    (step === 2 && selectedConcerns.length === 0)
                  }
                  className="gap-2"
                >
                  {step === 2 ? (
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
