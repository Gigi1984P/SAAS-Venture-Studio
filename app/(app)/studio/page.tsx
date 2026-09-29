import PageContainer from "@/components/page-container";
import VentureEntitiesWidget from "@/components/venture-entities-widget";
import SharedServicesWidget from "@/components/shared-services-widget";
import BurnRunwayWidget from "@/components/burn-runway-widget";
import FounderMarketplaceWidget from "@/components/founder-marketplace-widget";
import InvestorCRMWidget from "@/components/investor-crm-widget";

export default function StudioPage() {
  return (
    <PageContainer title="Venture Studio OS" actions={
      <span className="text-sm text-muted-foreground">Das Betriebssystem für dein Venture Studio</span>
    }>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VentureEntitiesWidget />
          <SharedServicesWidget />
        </div>

        <BurnRunwayWidget />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FounderMarketplaceWidget />
          <InvestorCRMWidget />
        </div>
      </div>
    </PageContainer>
  );
}
