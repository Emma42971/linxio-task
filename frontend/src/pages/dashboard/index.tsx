import { Suspense } from "react";
import { OrganizationAnalytics } from "@/components/organizations/OrganizationAnalytics";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { TokenManager } from "@/lib/api";

export default function DashboarPage() {
  const orgId = TokenManager.getCurrentOrgId();
  return (
    <div className="dashboard-container">
      <Suspense fallback={<DashboardSkeleton />}>
        <OrganizationAnalytics organizationId={orgId} />
      </Suspense>
    </div>
  );
}
