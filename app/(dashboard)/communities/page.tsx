import { getCommunities } from "@/server/actions/communities/getCommunities";
import CommunitiesClient from "./CommunitiesClient";

export default async function CommunitiesPage() {
  const result = await getCommunities({ limit: 20 });
  const initialCommunities = result.success && result.communities ? result.communities : [];

  return <CommunitiesClient initialCommunities={initialCommunities} />;
}
