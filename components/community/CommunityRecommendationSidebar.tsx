"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getRecommendedCommunities } from "@/server/actions/communities/getRecommendedCommunities";
import { joinCommunity } from "@/server/actions/communities/actions";
import { toast } from "@/components/ui/GlobalToast";
import { Sparkles, Users, ChevronRight, UserPlus } from "lucide-react";

interface RecommendedCommunity {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  genres: string[];
  ownerUsername: string;
  memberCount: number;
}

export default function CommunityRecommendationSidebar() {
  const router = useRouter();
  const [communities, setCommunities] = useState<RecommendedCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getRecommendedCommunities({ limit: 5 });
        if (result.success && result.communities) {
          setCommunities(result.communities as RecommendedCommunity[]);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleJoin = async (communityId: string) => {
    setJoiningId(communityId);
    const result = await joinCommunity(communityId);
    if (result.success) {
      toast("¡Te has unido a la comunidad!", "success");
      setCommunities(prev => prev.filter(c => c.id !== communityId));
    } else {
      toast(result.error || "Error al unirse", "error");
    }
    setJoiningId(null);
  };

  if (loading) {
    return (
      <div className="bg-soft/50 rounded-2xl border border-card-border/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-heading">Comunidades para ti</h3>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-dim" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-dim rounded-full w-3/4" />
                <div className="h-2.5 bg-dim rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (communities.length === 0) return null;

  return (
    <div className="bg-soft/50 rounded-2xl border border-card-border/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-heading">Comunidades para ti</h3>
        </div>
        <button
          onClick={() => router.push("/communities")}
          className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-0.5 transition-colors"
        >
          Ver más <ChevronRight size={12} />
        </button>
      </div>

      <div className="space-y-2">
        {communities.map((community) => (
          <div
            key={community.id}
            className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-card transition-all cursor-pointer"
            onClick={() => router.push(`/communities/${community.id}`)}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-lg bg-dim overflow-hidden relative flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/30 transition-all">
              {community.imageUrl ? (
                <Image src={community.imageUrl} alt={community.name} fill className="object-cover" />
              ) : (
                <span className="flex items-center justify-center h-full">
                  <Users size={16} className="text-hint" />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-heading text-sm truncate group-hover:text-primary transition-colors">
                {community.name}
              </p>
              <p className="text-[11px] text-hint truncate">
                {community.memberCount} miembros
                {community.genres.length > 0 && ` · ${community.genres.slice(0, 2).join(", ")}`}
              </p>
            </div>

            {/* Join button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleJoin(community.id);
              }}
              disabled={joiningId === community.id}
              className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Unirse"
            >
              {joiningId === community.id ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <UserPlus size={14} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
