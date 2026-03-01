import { useState, useEffect } from 'react';
import {
  useActiveLeague, useTeamsWithPlayers, useCreateTeam, useDeleteTeam,
  useSearchPlayers, useCreatePlayer, useAddPlayerToTeam, useRemovePlayerFromTeam,
  useSyncPlayers, usePlayerConflicts, useResolveConflict, useUpdateJerseyNumber, useUpdateTeam,
} from '@/hooks/use-tournoi';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/tournoi/AdminLayout';
import type { Player } from '@/lib/tournoi-types';
import { Plus, Trash2, Search, UserPlus, X, RefreshCw, AlertTriangle, Check, Ban, Users, Pencil } from 'lucide-react';
import ConfirmDialog from '@/components/tournoi/ConfirmDialog';

const AdminTeams = () => {
  const { toast } = useToast();
  const { data: league } = useActiveLeague();
  const { data: teams, isLoading } = useTeamsWithPlayers(league?.id);
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const createPlayer = useCreatePlayer();
  const addPlayer = useAddPlayerToTeam();
  const removePlayer = useRemovePlayerFromTeam();
  const syncPlayers = useSyncPlayers();
  const { data: conflicts } = usePlayerConflicts();
  const resolveConflict = useResolveConflict();
  const updateJersey = useUpdateJerseyNumber();
  const updateTeam = useUpdateTeam();

  const [editingJersey, setEditingJersey] = useState<{ tpId: string; teamId: string; value: string } | null>(null);
  const [editingColor, setEditingColor] = useState<{ teamId: string; value: string } | null>(null);

  const isJerseyTaken = (teamId: string, num: number, excludeTpId?: string) => {
    const team = teams?.find(t => t.id === teamId);
    if (!team) return false;
    return team.team_players.some(tp => tp.jersey_number === num && tp.id !== excludeTpId);
  };

  const handleSaveJersey = async () => {
    if (!editingJersey) return;
    const num = editingJersey.value ? parseInt(editingJersey.value) : null;
    if (num != null && isJerseyTaken(editingJersey.teamId, num, editingJersey.tpId)) {
      toast({ title: 'Erreur', description: `Le numéro ${num} est déjà pris dans cette équipe`, variant: 'destructive' });
      return;
    }
    try {
      await updateJersey.mutateAsync({ id: editingJersey.tpId, jersey_number: num });
      toast({ title: 'Numéro mis à jour' });
      setEditingJersey(null);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveColor = async () => {
    if (!editingColor) return;
    try {
      await updateTeam.mutateAsync({ id: editingColor.teamId, color: editingColor.value });
      toast({ title: 'Couleur mise à jour' });
      setEditingColor(null);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncPlayers.mutateAsync();
      const parts = [`${result.imported} importés`, `${result.skipped} déjà existants`];
      if (result.conflicts > 0) parts.push(`${result.conflicts} conflits`);
      toast({ title: 'Sync terminée', description: parts.join(', ') });
    } catch (err: any) {
      toast({ title: 'Erreur sync', description: err.message, variant: 'destructive' });
    }
  };

  const handleResolveConflict = async (conflictId: string, action: 'resolved' | 'ignored', playerId?: string) => {
    try {
      await resolveConflict.mutateAsync({ conflictId, action, playerId });
      toast({ title: action === 'resolved' ? 'Joueur mis à jour' : 'Conflit ignoré' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#007BFF');
  const [addingToTeam, setAddingToTeam] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerUsername, setNewPlayerUsername] = useState('');
  const [jersey, setJersey] = useState('');
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<{ id: string; name: string } | null>(null);
  const [removePlayerTarget, setRemovePlayerTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: searchResults, isLoading: searchLoading } = useSearchPlayers(playerSearch);

  useEffect(() => { document.title = 'Gérer Équipes - Admin Tournoi'; }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!league) return;
    try {
      await createTeam.mutateAsync({ league_id: league.id, name: teamName, color: teamColor });
      toast({ title: 'Équipe créée' });
      setShowTeamForm(false);
      setTeamName('');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamTarget) return;
    try {
      await deleteTeam.mutateAsync(deleteTeamTarget.id);
      toast({ title: 'Équipe supprimée' });
      setDeleteTeamTarget(null);
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const handleAddExistingPlayer = async (player: Player) => {
    if (!addingToTeam) return;
    if (jersey && isJerseyTaken(addingToTeam, parseInt(jersey))) {
      toast({ title: 'Erreur', description: `Le numéro ${jersey} est déjà pris dans cette équipe`, variant: 'destructive' });
      return;
    }
    try {
      await addPlayer.mutateAsync({ team_id: addingToTeam, player_id: player.id, jersey_number: jersey ? parseInt(jersey) : undefined });
      toast({ title: `${player.full_name} ajouté` });
      setPlayerSearch('');
      setJersey('');
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const handleCreateAndAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingToTeam) return;
    if (jersey && isJerseyTaken(addingToTeam, parseInt(jersey))) {
      toast({ title: 'Erreur', description: `Le numéro ${jersey} est déjà pris dans cette équipe`, variant: 'destructive' });
      return;
    }
    try {
      const player = await createPlayer.mutateAsync({ username: newPlayerUsername, full_name: newPlayerName });
      await addPlayer.mutateAsync({ team_id: addingToTeam, player_id: player.id, jersey_number: jersey ? parseInt(jersey) : undefined });
      toast({ title: `${newPlayerName} créé et ajouté` });
      setShowNewPlayer(false); setNewPlayerName(''); setNewPlayerUsername(''); setJersey('');
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const handleRemovePlayer = async () => {
    if (!removePlayerTarget) return;
    try {
      await removePlayer.mutateAsync(removePlayerTarget.id);
      toast({ title: 'Joueur retiré' });
      setRemovePlayerTarget(null);
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  const actionBtns = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={syncPlayers.isPending}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 border border-gray-700"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${syncPlayers.isPending ? 'animate-spin' : ''}`} />
        {syncPlayers.isPending ? 'Sync...' : 'Sync joueurs'}
      </button>
      {!showTeamForm && (
        <button
          onClick={() => setShowTeamForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-rayoblue text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Nouvelle équipe
        </button>
      )}
    </div>
  );

  if (!league) {
    return (
      <AdminLayout title="Équipes" subtitle="Aucune league active">
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune league active. Créez-en une d'abord.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Équipes" subtitle={league.name} actions={actionBtns}>
      <div className="space-y-4">
        {/* Player conflicts */}
        {conflicts && conflicts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-300">{conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} à traiter</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {conflicts.map(c => (
                <div key={c.id} className="bg-gray-900/50 rounded-xl border border-amber-500/10 p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-200 truncate">
                      {c.full_name} <span className="text-gray-500">@{c.username}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {c.phone && <span>{c.phone} · </span>}
                      {c.city && <span>{c.city} · </span>}
                      {c.existing_player && <span>Existant: <strong className="text-gray-400">{c.existing_player.full_name}</strong></span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleResolveConflict(c.id, 'resolved', c.existing_player_id || undefined)} disabled={resolveConflict.isPending} title="Remplacer" className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleResolveConflict(c.id, 'ignored')} disabled={resolveConflict.isPending} title="Ignorer" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-800 transition-colors disabled:opacity-50">
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create team form */}
        {showTeamForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Nouvelle équipe</h3>
            <form onSubmit={handleCreateTeam} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom</label>
                  <input value={teamName} onChange={e => setTeamName(e.target.value)} required placeholder="Ex: Les Lions"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rayoblue/50 focus:ring-1 focus:ring-rayoblue/20 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Couleur</label>
                  <input type="color" value={teamColor} onChange={e => setTeamColor(e.target.value)}
                    className="w-full h-[42px] bg-gray-800 border border-gray-700 rounded-xl cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={createTeam.isPending} className="px-4 py-2 bg-rayoblue text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50">Créer</button>
                <button type="button" onClick={() => setShowTeamForm(false)} className="px-4 py-2 bg-gray-800 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-700 transition-all">Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* Teams list */}
        {isLoading ? (
          <p className="text-sm text-gray-500 text-center py-8">Chargement...</p>
        ) : teams && teams.length > 0 ? (
          <div className="space-y-3">
            {teams.map(team => (
              <div key={team.id} className="bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all" style={{ overflow: addingToTeam === team.id ? 'visible' : 'hidden' }}>
                {/* Team header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-7 h-7 object-contain" />
                    ) : editingColor?.teamId === team.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={editingColor.value}
                          onChange={e => setEditingColor({ ...editingColor, value: e.target.value })}
                          className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <button onClick={handleSaveColor} disabled={updateTeam.isPending} className="p-0.5 text-green-400 hover:bg-green-500/10 rounded">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setEditingColor(null)} className="p-0.5 text-gray-500 hover:bg-gray-700 rounded">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingColor({ teamId: team.id, value: team.color })}
                        className="w-5 h-5 rounded-full ring-2 ring-gray-800 hover:ring-gray-600 shadow-sm transition-all"
                        style={{ backgroundColor: team.color }}
                        title="Modifier la couleur"
                      />
                    )}
                    <span className="text-sm font-bold text-white">{team.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                      {team.team_players.length} joueurs
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setAddingToTeam(addingToTeam === team.id ? null : team.id); setPlayerSearch(''); setShowNewPlayer(false); }}
                      className={`p-2 rounded-lg text-xs transition-all ${addingToTeam === team.id ? 'bg-rayoblue text-white' : 'text-gray-500 hover:text-rayoblue hover:bg-blue-500/10'}`}
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTeamTarget({ id: team.id, name: team.name })} className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Players list */}
                {team.team_players.length > 0 && (
                  <div className="px-4 pb-3 border-t border-gray-800/50">
                    {team.team_players.map(tp => (
                      <div key={tp.id} className="flex items-center justify-between py-2 text-xs border-b border-gray-800/30 last:border-0">
                        <div className="flex items-center gap-2">
                          {editingJersey?.tpId === tp.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editingJersey.value}
                                onChange={e => setEditingJersey({ ...editingJersey, value: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveJersey(); if (e.key === 'Escape') setEditingJersey(null); }}
                                autoFocus
                                className="w-10 h-6 px-1 bg-gray-800 border border-rayoblue/50 rounded text-[10px] text-white text-center focus:outline-none"
                              />
                              <button onClick={handleSaveJersey} className="p-0.5 text-green-400 hover:bg-green-500/10 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={() => setEditingJersey(null)} className="p-0.5 text-gray-500 hover:bg-gray-700 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingJersey({ tpId: tp.id, teamId: team.id, value: tp.jersey_number != null ? String(tp.jersey_number) : '' })}
                              className="w-6 h-6 rounded-lg bg-gray-800 text-gray-400 flex items-center justify-center text-[10px] font-bold border border-gray-700 hover:border-rayoblue/50 hover:text-rayoblue transition-all group relative"
                              title="Modifier le numéro"
                            >
                              {tp.jersey_number != null ? tp.jersey_number : <Pencil className="w-2.5 h-2.5 text-gray-600" />}
                            </button>
                          )}
                          <span className="font-medium text-gray-300">{tp.player.full_name}</span>
                          <span className="text-gray-600">@{tp.player.username}</span>
                        </div>
                        <button onClick={() => setRemovePlayerTarget({ id: tp.id, name: tp.player.full_name })} className="text-gray-700 hover:text-red-400 transition-colors p-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add player panel */}
                {addingToTeam === team.id && (
                  <div className="px-4 py-3 bg-blue-500/5 border-t border-blue-500/10 space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                        <input
                          value={playerSearch} onChange={e => setPlayerSearch(e.target.value)}
                          placeholder="Tapez un nom ou username..."
                          autoFocus
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-rayoblue/50 focus:ring-1 focus:ring-rayoblue/20 transition-all"
                        />

                        {/* Autocomplete dropdown */}
                        {playerSearch.length >= 2 && (
                          <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-h-52 overflow-y-auto">
                            {searchLoading ? (
                              <div className="px-3 py-3 text-[10px] text-gray-500 text-center">Recherche...</div>
                            ) : searchResults && searchResults.length > 0 ? (
                              searchResults.map(p => {
                                const assignedTeam = teams?.find(t => t.team_players.some(tp => tp.player.id === p.id));
                                const taken = !!assignedTeam;
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => !taken && handleAddExistingPlayer(p)}
                                    disabled={taken}
                                    className={`w-full text-left px-3 py-2.5 text-xs border-b border-gray-700/50 last:border-0 flex items-center justify-between gap-2 transition-colors ${taken ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-700/50'}`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-gray-200 truncate">{p.full_name}</span>
                                        <span className="text-gray-500 shrink-0">@{p.username}</span>
                                      </div>
                                      {(p.city || p.phone) && (
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                          {p.phone && <span>{p.phone}</span>}
                                          {p.phone && p.city && <span> · </span>}
                                          {p.city && <span>{p.city}</span>}
                                        </div>
                                      )}
                                    </div>
                                    {taken ? (
                                      <span className="text-[9px] text-gray-500 font-medium shrink-0">
                                        {assignedTeam.id === team.id ? 'Déjà ajouté' : assignedTeam.name}
                                      </span>
                                    ) : (
                                      <Plus className="w-3.5 h-3.5 text-rayoblue shrink-0" />
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-3 py-3 text-[10px] text-gray-500 text-center">
                                Aucun joueur trouvé pour "{playerSearch}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        value={jersey} onChange={e => setJersey(e.target.value)}
                        placeholder="N°" type="number"
                        className="w-14 px-2 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white text-center focus:outline-none focus:border-rayoblue/50"
                      />
                    </div>

                    {!showNewPlayer ? (
                      <button onClick={() => setShowNewPlayer(true)} className="text-[10px] text-rayoblue font-semibold hover:underline">
                        + Créer un nouveau joueur
                      </button>
                    ) : (
                      <form onSubmit={handleCreateAndAddPlayer} className="bg-gray-800 rounded-xl border border-gray-700 p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={newPlayerUsername} onChange={e => setNewPlayerUsername(e.target.value)} required placeholder="Username"
                            className="px-2.5 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-rayoblue/50" />
                          <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} required placeholder="Nom complet"
                            className="px-2.5 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-rayoblue/50" />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={createPlayer.isPending} className="px-3 py-1.5 bg-rayoblue text-white text-[10px] font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50">
                            Créer & ajouter
                          </button>
                          <button type="button" onClick={() => setShowNewPlayer(false)} className="px-3 py-1.5 bg-gray-700 text-gray-400 text-[10px] font-semibold rounded-lg hover:bg-gray-600">
                            Annuler
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune équipe créée</p>
            <p className="text-xs text-gray-600 mt-1">Commencez par synchroniser les joueurs puis créez vos équipes</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTeamTarget}
        onClose={() => setDeleteTeamTarget(null)}
        onConfirm={handleDeleteTeam}
        title="Supprimer cette équipe ?"
        description={`L'équipe "${deleteTeamTarget?.name}" et tous ses joueurs associés seront retirés.`}
        loading={deleteTeam.isPending}
      />

      <ConfirmDialog
        open={!!removePlayerTarget}
        onClose={() => setRemovePlayerTarget(null)}
        onConfirm={handleRemovePlayer}
        title="Retirer ce joueur ?"
        description={`${removePlayerTarget?.name} sera retiré de l'équipe.`}
        confirmLabel="Retirer"
        loading={removePlayer.isPending}
      />
    </AdminLayout>
  );
};

export default AdminTeams;
