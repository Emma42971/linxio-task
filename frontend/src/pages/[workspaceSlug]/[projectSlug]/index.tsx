// In your project page

import { Suspense } from "react";
import { ProjectAnalytics } from "@/components/projects/ProjectAnalytics";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useRouter } from "next/router";

export default function ProjectPage() {
  const router = useRouter();
  const { projectSlug } = router.query;

  return (
    <div className="dashboard-container">
      <Suspense fallback={<DashboardSkeleton />}>
        <ProjectAnalytics projectSlug={projectSlug as string} />
      </Suspense>
    </div>
  );
}
