import { partnershipModels, type PartnershipModel } from "@/data/partnerPrograms";
import PartnershipModelCard from "./PartnershipModelCard";

interface PartnershipModelsProps {
  onSelectModel: (modelId: PartnershipModel["id"]) => void;
}

const PartnershipModels = ({ onSelectModel }: PartnershipModelsProps) => {
  return (
    <section id="partnership-models" className="scroll-mt-20 bg-secondary/10 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">
            Three Ways to Partner With SkinLabs®
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Choose the partnership model that best matches your objectives. Partnerships can also evolve over
            time as your relationship with SkinLabs® develops.
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          {partnershipModels.map((model, index) => (
            <PartnershipModelCard key={model.id} model={model} index={index} onSelect={onSelectModel} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnershipModels;
