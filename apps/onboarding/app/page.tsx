import { IntroScreen } from "@/components/portfolio/intro-screen";
import { PortfolioShell } from "@/components/portfolio/shell";

export default function HomePage() {
  return (
    <PortfolioShell>
      <IntroScreen />
    </PortfolioShell>
  );
}
