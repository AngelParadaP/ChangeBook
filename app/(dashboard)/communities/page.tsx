import { getCommunities } from "@/server/actions/communities/getCommunities";
import { getRecommendedCommunities } from "@/server/actions/communities/getRecommendedCommunities";
import CommunitiesClient from "./CommunitiesClient";

export default async function CommunitiesPage() {
  const [recommendedResult, myResult] = await Promise.all([
    getRecommendedCommunities({ limit: 30 }),
    getCommunities({ limit: 20, filter: "mine" }),
  ]);

  // Map recommended communities to the Community interface expected by CommunitiesClient
  const discoverCommunities = recommendedResult.success && recommendedResult.communities
    ? recommendedResult.communities.map(c => ({
        ...c,
        imageUrl: (c as any).imageUrl || null,
        isMember: false as boolean,
      }))
    : [];

  const myCommunities = myResult.success && myResult.communities ? myResult.communities : [];

  return (
    <CommunitiesClient
      initialDiscoverCommunities={discoverCommunities}
      initialMyCommunities={myCommunities}
    />
  );
}
