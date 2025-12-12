import { useState } from "react";
import { Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

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

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((c) => c !== concern)
        : prev.length < 3
        ? [...prev, concern]
        : prev
    );
  };

  const progress = (step / 3) * 100;

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
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
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
                <h3 className="text-xl font-semibold text-card-foreground">
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
                  <h3 className="text-xl font-semibold text-card-foreground">
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

            {/* Step 3: Results */}
            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    Your Custom Formula is Ready!
                  </h3>
                  <p className="text-muted-foreground">
                    Based on your {skinType} skin type and concerns with{" "}
                    {selectedConcerns.join(", ").toLowerCase()}, we've created
                    a personalized skincare routine.
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-6 text-left space-y-4">
                  <h4 className="font-medium text-card-foreground">Recommended Routine:</h4>
                  <div className="space-y-3">
                    {["Gentle Cleansing Foam", "Hydrating Essence", "Targeted Treatment Serum", "Moisturizing Barrier Cream"].map((item, i) => (
                      <div key={item} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-card-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button size="lg" className="gap-2">
                  Shop Your Routine
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Navigation */}
            {step < 3 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 1}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !skinType) ||
                    (step === 2 && selectedConcerns.length === 0)
                  }
                  className="gap-2"
                >
                  {step === 2 ? "Get My Formula" : "Continue"}
                  <ChevronRight className="h-4 w-4" />
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
