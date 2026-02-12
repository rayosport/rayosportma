import { useState, useEffect } from 'react';
import { useLeagues, useCreateLeague, useUpdateLeague, useDeleteLeague } from '@/hooks/use-tournoi';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/tournoi/AdminLayout';
import { Plus, Trophy, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/tournoi/ConfirmDialog';

const AdminLeague = () => {
  const { toast } = useToast();
  const { data: leagues, isLoading } = useLeagues();
  const createLeague = useCreateLeague();
  const updateLeague = useUpdateLeague();
  const deleteLeague = useDeleteLeague();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [season, setSeason] = useState('Ramadan 2026');
  const [city, setCity] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [completeTarget, setCompleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    document.title = 'Gérer League - Admin Tournoi';
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLeague.mutateAsync({ name, season, city: city || undefined });
      toast({ title: 'League créée avec succès' });
      setShowForm(false);
      setName('');
      setCity('');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const activeLeagues = leagues?.filter(l => l.status === 'active') || [];
      for (const l of activeLeagues) {
        await updateLeague.mutateAsync({ id: l.id, status: 'completed' });
      }
      await updateLeague.mutateAsync({ id, status: 'active' });
      toast({ title: 'League activée' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleComplete = async () => {
    if (!completeTarget) return;
    try {
      await updateLeague.mutateAsync({ id: completeTarget.id, status: 'completed' });
      toast({ title: 'League terminée' });
      setCompleteTarget(null);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLeague.mutateAsync(deleteTarget.id);
      toast({ title: 'League supprimée' });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/15 text-green-400 border-green-500/20';
      case 'completed': return 'bg-gray-500/15 text-gray-400 border-gray-500/20';
      default: return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
    }
  };

  const actionBtn = (
    !showForm && (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-rayoblue text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-all"
      >
        <Plus className="w-3.5 h-3.5" /> Nouvelle league
      </button>
    )
  );

  return (
    <AdminLayout title="Leagues" subtitle="Créer et gérer les éditions du tournoi" actions={actionBtn}>
      <div className="space-y-4 max-w-2xl">
        {/* Create form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Nouvelle league</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom</label>
                <input
                  value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Rayo League"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rayoblue/50 focus:ring-1 focus:ring-rayoblue/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Saison</label>
                  <input
                    value={season} onChange={e => setSeason(e.target.value)} required
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-rayoblue/50 focus:ring-1 focus:ring-rayoblue/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ville</label>
                  <input
                    value={city} onChange={e => setCity(e.target.value)} placeholder="Casablanca"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rayoblue/50 focus:ring-1 focus:ring-rayoblue/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={createLeague.isPending} className="px-4 py-2 bg-rayoblue text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50">
                  {createLeague.isPending ? 'Création...' : 'Créer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-700 transition-all">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Leagues list */}
        {isLoading ? (
          <p className="text-sm text-gray-500 text-center py-8">Chargement...</p>
        ) : leagues && leagues.length > 0 ? (
          <div className="space-y-3">
            {leagues.map(l => (
              <div key={l.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${l.status === 'active' ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-800 border border-gray-700'}`}>
                      <Trophy className={`w-5 h-5 ${l.status === 'active' ? 'text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{l.name}</p>
                      <p className="text-[10px] text-gray-500">{l.season}{l.city ? ` · ${l.city}` : ''}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusBadge(l.status)}`}>
                    {l.status === 'active' ? 'Active' : l.status === 'completed' ? 'Terminée' : 'Brouillon'}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  {l.status === 'draft' && (
                    <>
                      <button onClick={() => handleActivate(l.id)} className="px-3 py-1.5 text-xs font-semibold bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20">
                        Activer
                      </button>
                      <button onClick={() => setDeleteTarget({ id: l.id, name: l.name })} className="px-3 py-1.5 text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </button>
                    </>
                  )}
                  {l.status === 'active' && (
                    <button onClick={() => setCompleteTarget({ id: l.id, name: l.name })} className="px-3 py-1.5 text-xs font-semibold bg-gray-800 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">
                      Terminer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune league créée</p>
            <p className="text-xs text-gray-600 mt-1">Créez votre première league pour démarrer le tournoi</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer cette league ?"
        description={`La league "${deleteTarget?.name}" et toutes ses données seront définitivement supprimées.`}
        loading={deleteLeague.isPending}
      />

      <ConfirmDialog
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleComplete}
        title="Terminer cette league ?"
        description={`La league "${completeTarget?.name}" sera marquée comme terminée. Cette action met fin à la compétition en cours.`}
        confirmLabel="Terminer"
        loadingLabel="En cours..."
        loading={updateLeague.isPending}
        variant="warning"
      />
    </AdminLayout>
  );
};

export default AdminLeague;
