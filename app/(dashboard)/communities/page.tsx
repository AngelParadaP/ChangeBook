import { getCommunities } from "@/server/actions/communities/getCommunities";
import CommunitiesClient from "./CommunitiesClient";

export default async function CommunitiesPage() {
  const [discoverResult, myResult] = await Promise.all([
    getCommunities({ limit: 20, filter: "discover" }),
    getCommunities({ limit: 20, filter: "mine" }),
  ]);

  const discoverCommunities = discoverResult.success && discoverResult.communities ? discoverResult.communities : [];
  const myCommunities = myResult.success && myResult.communities ? myResult.communities : [];

  return (
    <CommunitiesClient
      initialDiscoverCommunities={discoverCommunities}
      initialMyCommunities={myCommunities}
    />
  );
}
