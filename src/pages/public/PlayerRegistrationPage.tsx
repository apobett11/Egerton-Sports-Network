import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchTeamById, registerPlayerToTeam } from '../../components/Dashboards/Team/lib/supabaseClient';
import { UserPlus, Shield, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Star } from 'lucide-react';

interface PlayerRegistrationPageProps {
  onNavigate?: (path: string) => void;
}

export const PlayerRegistrationPage: React.FC<PlayerRegistrationPageProps> = ({ onNavigate }) => {
  const [teamId, setTeamId] = useState<string>('');
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState<boolean>(true);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [position, setPosition] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [preferredFoot, setPreferredFoot] = useState<'right' | 'left' | 'both'>('right');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [registeredPlayerInfo, setRegisteredPlayerInfo] = useState<any>(null);

  // Extract teamId from URL hash or query params
  useEffect(() => {
    let resolvedId = '';
    const hash = window.location.hash || '';
    const searchPart = hash.includes('?') ? hash.split('?')[1] : window.location.search.substring(1);
    if (searchPart) {
      const params = new URLSearchParams(searchPart);
      resolvedId = params.get('teamId') || params.get('team') || '';
    }

    if (resolvedId) {
      setTeamId(resolvedId);
      loadTeam(resolvedId);
    } else {
      loadAllTeams();
    }
  }, []);

  const loadTeam = async (id: string) => {
    setIsLoadingTeam(true);
    try {
      const t = await fetchTeamById(id);
      if (t) {
        setTeamInfo(t);
      } else {
        // Fallback: query teams directly
        const { data } = await supabase.from('teams').select('*').eq('id', id).single();
        if (data) setTeamInfo(data);
        else loadAllTeams();
      }
    } catch {
      loadAllTeams();
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const loadAllTeams = async () => {
    setIsLoadingTeam(true);
    try {
      const { data } = await supabase.from('teams').select('id, name, short_name, logo_url').order('name');
      if (data && data.length > 0) {
        setAvailableTeams(data);
        if (!teamId) {
          setTeamId(data[0].id);
          setTeamInfo(data[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load teams list:', err);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleTeamChange = (newTeamId: string) => {
    setTeamId(newTeamId);
    const sel = availableTeams.find((t) => t.id === newTeamId);
    if (sel) setTeamInfo(sel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      let createdUserId: string | undefined = undefined;

      // 1. Attempt user signup in Supabase Auth (role='player', id=uid)
      try {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password || 'Egerton@2026',
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              role: 'player',
              team_id: teamId,
            },
          },
        });
        if (!authErr && authData?.user?.id) {
          createdUserId = authData.user.id;
        }
      } catch (authE) {
        console.warn('Auth signup note (proceeding with direct registration):', authE);
      }

      // 2. Register Player atomically in database: profiles + players linked to team
      const res = await registerPlayerToTeam({
        teamId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        studentId: studentId.trim() || undefined,
        jerseyNumber: Number(jerseyNumber) || undefined,
        position,
        preferredFoot,
        userId: createdUserId,
      });

      if (!res.success && res.error) {
        throw new Error(res.error);
      }

      setRegisteredPlayerInfo({
        name: `${firstName} ${lastName}`,
        teamName: teamInfo?.name || 'Selected Team',
        jersey: jerseyNumber,
        position,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#161B22] border border-emerald-500/40 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/50">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Registration Complete!</h2>
            <p className="text-xs text-slate-300">
              Welcome to <strong className="text-emerald-400">{registeredPlayerInfo?.teamName}</strong>!
            </p>
          </div>

          <div className="bg-[#0D1117] border border-[#2A3441] rounded-2xl p-4 text-xs space-y-2 text-left">
            <div className="flex items-center justify-between text-slate-400">
              <span>Player:</span>
              <span className="text-white font-bold">{registeredPlayerInfo?.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Position:</span>
              <span className="text-emerald-400 font-bold">{registeredPlayerInfo?.position}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Jersey:</span>
              <span className="text-white font-mono font-bold">#{registeredPlayerInfo?.jersey}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold uppercase">Added to Squad Roster</span>
            </div>
          </div>

          <p className="text-[11.5px] text-slate-400 leading-relaxed">
            Your player profile has been linked to the team and sent for admin verification. You appear directly in your team's squad list.
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                if (onNavigate) onNavigate('/home');
                else window.location.hash = '/home';
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View League Standings & Matches</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (onNavigate) onNavigate('/login');
                else window.location.hash = '/login';
              }}
              className="w-full py-2.5 bg-[#0D1117] hover:bg-[#1C2331] text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-[#2A3441] transition-all cursor-pointer"
            >
              Sign In to Your Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-lg w-full mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('/home');
              else window.location.hash = '/home';
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to LiveScore</span>
          </button>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest font-black">
            Official Roster Intake
          </span>
        </div>

        {/* Card Header with Team Branding */}
        <div className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-[#2A3441]">
            <div className="w-14 h-14 rounded-2xl bg-[#0D1117] border border-[#2A3441] flex items-center justify-center shrink-0 overflow-hidden shadow-md">
              {teamInfo?.logo_url ? (
                <img src={teamInfo.logo_url} alt={teamInfo.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-7 h-7 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Player Squad Registration
              </span>
              <h1 className="text-xl font-black text-white truncate">
                {teamInfo?.name || 'Egerton FC Squad Registration'}
              </h1>
              <p className="text-xs text-slate-400 truncate">
                Official high-performance roster enrollment • No verification email required
              </p>
            </div>
          </div>

          {/* Team Switcher if no specific teamId from URL */}
          {availableTeams.length > 0 && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Selected Team</label>
              <select
                value={teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.short_name || 'CLUB'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dennis"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Last Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Oliech"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="player@egerton.ac.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Phone / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Student / Reg Number</label>
                <input
                  type="text"
                  placeholder="e.g. S13/18492/21"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Jersey Number</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(Number(e.target.value))}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Position on Field</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="GK">Goalkeeper (GK)</option>
                  <option value="DEF">Defender (DEF)</option>
                  <option value="MID">Midfielder (MID)</option>
                  <option value="FWD">Forward (FWD)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Preferred Foot</label>
                <select
                  value={preferredFoot}
                  onChange={(e) => setPreferredFoot(e.target.value as any)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="right">Right Foot</option>
                  <option value="left">Left Foot</option>
                  <option value="both">Both (Ambidextrous)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#2A3441]/60">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Account Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingTeam}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-2 mt-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Official Registration...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Complete Player Registration</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlayerRegistrationPage;
