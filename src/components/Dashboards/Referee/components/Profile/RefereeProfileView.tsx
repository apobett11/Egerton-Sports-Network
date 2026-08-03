import React, { useState } from 'react';
import { Card, Badge, Button, Input } from '../../../../common/UIComponents';
import { User, Award, Phone, Mail, ShieldCheck, MapPin, Calendar, Check } from 'lucide-react';
import type { RefereeProfileData } from '../../types';

interface RefereeProfileViewProps {
  profileData: RefereeProfileData;
  onUpdateProfile: (updated: Partial<RefereeProfileData>) => Promise<void>;
}

export const RefereeProfileView: React.FC<RefereeProfileViewProps> = ({
  profileData,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profileData.phone);
  const [email, setEmail] = useState(profileData.email);
  const [association, setAssociation] = useState(profileData.association);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({ phone, email, association });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Profile Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-[#2A2A2A] p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Photo */}
          <div className="w-24 h-24 rounded-2xl bg-[#111111] border-2 border-emerald-500/50 p-1 shadow-lg flex-shrink-0 relative">
            <img
              src={
                profileData.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
              }
              alt={profileData.name}
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-md shadow">
              <ShieldCheck className="w-4 h-4 text-black" />
            </div>
          </div>

          {/* Core Info */}
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30">
                {profileData.role}
              </span>
              <span className="text-xs text-gray-400 font-mono">FKF Registered Official</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{profileData.name}</h1>
            <p className="text-xs text-gray-400 flex items-center justify-center md:justify-start gap-3">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {profileData.association}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> {profileData.yearsActive} Years Active</span>
            </p>
          </div>

          <Button
            variant={isEditing ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Personal Info'}
          </Button>
        </div>
      </div>

      {/* Editable Contact Info vs Read-Only Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Contact & Personal Info */}
        <div className="lg:col-span-6 space-y-6">
          <Card title="Contact & Personal Information" subtitle="Editable personal contact information">
            {isEditing ? (
              <div className="space-y-4">
                <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input label="Association / Region" value={association} onChange={(e) => setAssociation(e.target.value)} />

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} icon={<Check className="w-4 h-4" />}>
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" /> Phone Contact:
                  </span>
                  <span className="font-bold text-white font-mono">{profileData.phone}</span>
                </div>

                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-400" /> Email Address:
                  </span>
                  <span className="font-bold text-white font-mono">{profileData.email}</span>
                </div>

                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" /> Association:
                  </span>
                  <span className="font-bold text-white">{profileData.association}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Non-Editable Statistics & History */}
        <div className="lg:col-span-6 space-y-6">
          <Card title="Official Officiating Statistics" subtitle="Read-only official career records">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#111111] border border-[#2A2A2A] rounded-xl space-y-1">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Matches Officiated</div>
                <div className="text-2xl font-bold text-emerald-400">{profileData.statistics.matchesRefereed}</div>
              </div>

              <div className="p-4 bg-[#111111] border border-[#2A2A2A] rounded-xl space-y-1">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Assigned Fixtures</div>
                <div className="text-2xl font-bold text-white">{profileData.assignedMatchesCount}</div>
              </div>

              <div className="p-4 bg-[#111111] border border-[#2A2A2A] rounded-xl space-y-1">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Yellow Cards Issued</div>
                <div className="text-2xl font-bold text-amber-400">{profileData.statistics.yellowCards}</div>
              </div>

              <div className="p-4 bg-[#111111] border border-[#2A2A2A] rounded-xl space-y-1">
                <div className="text-[10px] text-gray-400 font-bold uppercase">Red Cards Issued</div>
                <div className="text-2xl font-bold text-rose-500">{profileData.statistics.redCards}</div>
              </div>
            </div>

            <div className="p-4 bg-[#111111] rounded-xl border border-[#2A2A2A] text-xs text-gray-400 mt-4 flex items-center justify-between">
              <span>Official Status & Role:</span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30">
                READ-ONLY AUTHORIZED
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
