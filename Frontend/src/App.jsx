import { useState } from "react";
import SnookerTable from "./SnookerTable";
import Header from "./Header";
import TechStackModal from "./TechStackModal";

export default function App() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#04080c] select-none font-sans">
      {/* Top Header with title and Info button */}
      <Header onOpenInfo={() => setIsInfoOpen(true)} />

      {/* Physics Canvas Simulation */}
      <SnookerTable />

      {/* Tech Stack & Libraries Modal in paragraph form */}
      <TechStackModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
