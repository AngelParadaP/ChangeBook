"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { joinCommunity } from "@/server/actions/communities/actions";
import { createCommunity } from "@/server/actions/communities/createCommunity";
import { getCommunities } from "@/server/actions/communities/getCommunities";
import { toast } from "@/components/ui/GlobalToast";

interface Community {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  memberCount: number;
  isMember: boolean;
}

interface CommunitiesClientProps {
  initialCommunities: Community[];
}

export default function CommunitiesClient({ initialCommunities }: CommunitiesClientProps) {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
        const result = await getCommunities({ query: searchQuery });
        if (result.success && result.communities) {
            setCommunities(result.communities);
        }
    } finally {
        setSearching(false);
    }
  };

  const handleJoin = async (communityId: string) => {
      const result = await joinCommunity(communityId);
      if (result.success) {
          toast("Te has unido a la comunidad!", "success");
          setCommunities(prev => prev.map(c => 
             c.id === communityId ? { ...c, memberCount: c.memberCount + 1, isMember: true } : c 
          ));
      } else {
          toast(result.error || "Error al unirse", "error");
      }
  };

  const handleCreate = async () => {
    if (!newCommunityName.trim()) return;
    setCreating(true);
    const result = await createCommunity({ name: newCommunityName, description: newCommunityDesc });
    setCreating(false);
    
    if (result.success && result.community) {
      toast("Comunidad creada exitosamente", "success");
      setShowCreateModal(false);
      setNewCommunityName("");
      setNewCommunityDesc("");
      // Add to list or refresh
      setCommunities(prev => [{
          id: result.community!.id,
          name: result.community!.name,
          description: result.community!.description,
          imageUrl: result.community!.imageUrl,
          memberCount: 1,
          isMember: true
      }, ...prev]);
    } else {
      toast(result.error || "Error al crear la comunidad", "error");
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 h-full overflow-y-auto custom-scrollbar">
       <div className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Comunidades</h1>
         <button 
           onClick={() => setShowCreateModal(true)}
           className="px-4 py-2 bg-light-purple hover:bg-dark-purple text-white rounded-lg transition-colors font-medium">
           + Crear Comunidad
         </button>
       </div>

       {/* Search */}
       <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="Buscar comunidades..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-light-purple outline-none"
             />
             <button disabled={searching} type="submit" className="px-6 py-2 bg-gray-200 dark:bg-zinc-700 rounded-xl hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors">
                {searching ? "..." : "Buscar"}
             </button>
          </div>
       </form>

       {/* Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((community) => (
             <div key={community.id} className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                    <div className="flex items-start gap-4 mb-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-zinc-800 overflow-hidden relative flex-shrink-0">
                        {community.imageUrl ? (
                            <Image src={community.imageUrl} alt={community.name} fill className="object-cover" />
                        ) : (
                            <span className="flex items-center justify-center h-full text-2xl">👥</span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{community.name}</h3>
                        <p className="text-sm text-gray-500 mb-1">{community.memberCount} miembros</p>
                        {community.isMember && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">Miembro</span>}
                    </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 h-10">
                        {community.description || "Sin descripción"}
                    </p>
                </div>
                <div className="flex gap-2 mt-2">
                   <button 
                     onClick={() => router.push(`/communities/${community.id}`)}
                     className="flex-1 py-2 px-3 bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                   >
                     Ver
                   </button>
                   {!community.isMember && (
                       <button 
                         onClick={() => handleJoin(community.id)}
                         className="flex-1 py-2 px-3 bg-light-purple/10 text-light-purple rounded-lg text-sm font-medium hover:bg-light-purple/20 transition-colors"
                       >
                         Unirse
                       </button>
                   )}
                </div>
             </div>
          ))}
       </div>

       {communities.length === 0 && (
           <div className="text-center py-12 text-gray-500">
               No se encontraron comunidades.
           </div>
       )}

       {/* Create Modal (Simple inline absolute for now or real modal) */}
       {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
             <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 shadow-xl">
                 <h2 className="text-xl font-bold mb-4">Crear Nueva Comunidad</h2>
                 <input 
                   className="w-full mb-3 px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" 
                   placeholder="Nombre de la comunidad"
                   value={newCommunityName}
                   onChange={e => setNewCommunityName(e.target.value)}
                 />
                 <textarea 
                   className="w-full mb-4 px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" 
                   placeholder="Descripción"
                   rows={3}
                   value={newCommunityDesc}
                   onChange={e => setNewCommunityDesc(e.target.value)}
                 />
                 <div className="flex justify-end gap-3">
                     <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancelar</button>
                     <button 
                        onClick={handleCreate} 
                        disabled={creating || !newCommunityName}
                        className="px-4 py-2 bg-light-purple text-white rounded-lg disabled:opacity-50"
                     >
                        {creating ? "Creando..." : "Crear"}
                     </button>
                 </div>
             </div>
          </div>
       )}
    </div>
  );
}
