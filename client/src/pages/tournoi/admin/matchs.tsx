import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useActiveLeague, useTeams, useMatches, useCreateMatch, useDeleteMatch } from '@/hooks/use-tournoi';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/tournoi/AdminLayout';
import { Plus, Trash2, Edit, Calendar } from 'lucide-react';
import ConfirmDialog from '@/components/tournoi/ConfirmDialog';

const AdminMatchs = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: league } = useActiveLeague();
  const { data: teams } = useTeams(league?.id);
  const { data: matches, isLoading } = useMatches(league?.id);
  const createMatch = useCreateMatch();
  const deleteMatch = useDeleteMatch();

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [matchday, setMatchday] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location_, setLocation_] = useState('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');

  useEffect(() => { document.title = 'Gérer Matchs - Admin Tournoi'; }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!league) return;
    if (homeTeamId === awayTeamId) {
      toast({ title: 'Erreur', description: 'Les deux équipes doivent être différentes', variant: 'destructive' });
      return;
    }
    try {
      await createMatch.mutateAsync({ league_id: league.id, matchday, date: date || undefined, time: time || undefined, location: location_ || undefined, home_team_id: homeTeamId, away_team_id: awayTeamId });
      toast({ title: 'Match créé' });
      setShowForm(false); setHomeTeamId(''); setAwayTeamId('');
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMatch.mutateAsync(deleteTarget.id);
      toast({ title: 'Match supprimé' });
      setDeleteTarget(null);
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const matchdays = new Map<number, typeof matches>();
  matches?.forEach(m => {
    const arr = matchdays.get(m.matchday) || [];
    arr.push(m);
    matchdays.set(m.matchday, arr);
  });
  const sortedMatchdays = Array.from(matchdays.entries()).sort((a, b) => a[0] - b[0]);

  const actionBtn = (
    !showForm && (
      <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-rayoblue text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-all">
        <Plus className="w-3.5 h-3.5" /> Nouveau match
      </button>
    )
  );

  if (!league) {
    return (
      <AdminLayout title="Matchs" subtitle="Aucune league active">
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune league active.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Matchs" subtitle={league.name} actions={actionBtn}>
      <div className="space-y-4 max-w-3xl">
        {/* Create match form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Nouveau match</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Journée</label>
                  <input type="number" value={matchday} onChange={e => setMatchday(parseInt(e.target.value) || 1)} min={1}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-rayoblue/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-rayoblue/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Heure</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-rayoblue/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lieu</label>
                  <input value={location_} onChange={e => setLocation_(e.target.value)} placeholder="Terrain"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rayoblue/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Domicile</label>
                  <select value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)} required
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-rayoblue/50">
                    <option value="">Sélectionner</option>
                    {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Extérieur</label>
                  <select value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)} required
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-rayoblue/50">
                    <option value="">Sélectionner</option>
                    {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={createMatch.isPending} className="px-4 py-2 bg-rayoblue text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50">Créer</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-700 transition-all">Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* Matches list */}
        {isLoading ? (
          <p className="text-sm text-gray-500 text-center py-8">Chargement...</p>
        ) : sortedMatchdays.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun match créé</p>
            <p className="text-xs text-gray-600 mt-1">Créez des équipes d'abord puis planifiez vos matchs</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedMatchdays.map(([md, dayMatches]) => (
              <div key={md}>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Journée {md}
                </h3>
                <div className="space-y-2">
                  {dayMatches!.map(match => (
                    <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: match.home_team.color }} />
                            <span className="text-xs font-semibold text-gray-200 truncate">{match.home_team.name}</span>
                          </div>
                          <div className="px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 shrink-0">
                            <span className="text-sm font-black text-white">
                              {match.status !== 'scheduled' ? `${match.home_score} - ${match.away_score}` : 'vs'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="text-xs font-semibold text-gray-200 truncate">{match.away_team.name}</span>
                            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: match.away_team.color }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-4 shrink-0">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${
                            match.status === 'completed' ? 'bg-gray-800 text-gray-400 border border-gray-700' :
                            match.status === 'live' ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                            'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                          }`}>
                            {match.status === 'completed' ? 'TERMINÉ' : match.status === 'live' ? 'EN DIRECT' : 'PLANIFIÉ'}
                          </span>
                          <button onClick={() => setLocation(`/tournoi/admin/match/${match.id}`)} className="p-2 rounded-lg text-gray-500 hover:text-rayoblue hover:bg-blue-500/10 transition-all">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {match.status === 'scheduled' && (
                            <button onClick={() => setDeleteTarget({ id: match.id, label: `${match.home_team.name} vs ${match.away_team.name}` })} className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      {match.date && (
                        <p className="text-[10px] text-gray-500 mt-2">
                          {new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {match.time && ` · ${match.time.slice(0, 5)}`}
                          {match.location && ` · ${match.location}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer ce match ?"
        description={`Le match "${deleteTarget?.label}" sera définitivement supprimé.`}
        loading={deleteMatch.isPending}
      />
    </AdminLayout>
  );
};

export default AdminMatchs;
