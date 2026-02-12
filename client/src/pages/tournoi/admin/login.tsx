import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Admin - Tournoi Ramadan';
    if (user) setLocation('/tournoi/admin');
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Erreur de connexion', description: error.message, variant: 'destructive' });
    } else {
      setLocation('/tournoi/admin');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-jetblack via-gray-900 to-jetblack flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-rayoblue/10 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rayoblue/10 border border-rayoblue/20 mb-3">
              <Lock className="w-5 h-5 text-rayoblue" />
            </div>
            <h1 className="text-lg font-bold text-white">Admin Tournoi</h1>
            <p className="text-xs text-gray-500 mt-1">Connectez-vous pour gérer le tournoi</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rayoblue/50 focus:ring-1 focus:ring-rayoblue/20 transition-all"
                  placeholder="admin@rayosport.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rayoblue/50 focus:ring-1 focus:ring-rayoblue/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-rayoblue hover:bg-blue-600 text-white font-semibold text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rayoblue/20 hover:shadow-rayoblue/30"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
