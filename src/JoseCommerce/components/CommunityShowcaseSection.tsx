import React, { useState } from 'react';
import { Camera, CheckCircle2, MapPin, Plus, Trophy, X, UploadCloud, MessageSquare } from 'lucide-react';
import { CommunityShowcaseItem } from '../types';

interface CommunityShowcaseSectionProps {
  items: CommunityShowcaseItem[];
  onAddNewShowcaseItem: (item: CommunityShowcaseItem) => void;
}

export const CommunityShowcaseSection: React.FC<CommunityShowcaseSectionProps> = ({
  items,
  onAddNewShowcaseItem,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CommunityShowcaseItem | null>(null);

  // Form state
  const [teamName, setTeamName] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [kitDetails, setKitDetails] = useState('');
  const [quote, setQuote] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !title) return;

    const newItem: CommunityShowcaseItem = {
      id: `showcase-${Date.now()}`,
      title,
      teamName,
      location: location || 'Grassroots Stadium',
      image: imageUrl || 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80',
      badge: 'COMMUNITY OUTREACH',
      date: 'Just Now',
      kitDetails: kitDetails || 'Custom Team Match Kits Delivered',
      quote: quote || 'Great experience getting our complete tournament squad outfitted through Egerscore Store!',
      verifiedOrder: true,
    };

    onAddNewShowcaseItem(newItem);
    setIsModalOpen(false);
    // Reset
    setTeamName('');
    setTitle('');
    setLocation('');
    setKitDetails('');
    setQuote('');
    setImageUrl('');
  };

  return (
    <section id="community-showcase" className="w-full bg-white py-6 sm:py-8 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-start gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0b1522] text-[#00b04f] shadow-2xs mt-0.5">
              <Camera className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0b1522]">
                  Community Kits & MCA Outfitting
                </h2>
                <span className="px-1.5 py-0.2 rounded-xs bg-[#00b04f]/10 text-[#00b04f] text-[9px] font-black uppercase tracking-wider">
                  Delivered Works
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Photo showcase of grassroots teams, ward leagues and youth squads outfitted in official gear
              </p>
            </div>
          </div>

          {/* Action button to post / upload kit photo */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0b1522] hover:bg-[#152a40] text-white text-[11px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#00b04f]" />
            <span>Post Squad Kit Photo</span>
          </button>
        </div>

        {/* Gallery Grid (Engineered to be sleek, balanced, responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group flex flex-col bg-slate-50 rounded-xl border border-slate-200/90 overflow-hidden hover:border-slate-300 transition-all hover:shadow-sm cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-200">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
                />
                
                {/* Badge Tag */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-xs bg-[#0b1522]/90 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                    {item.badge}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[#00b04f] text-[10px] font-bold shadow-2xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Delivered</span>
                  </span>
                </div>
              </div>

              {/* Details Body */}
              <div className="p-3 flex flex-col flex-grow justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 mb-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Trophy className="w-3 h-3 text-[#ff9800]" />
                      <span className="truncate max-w-[140px]">{item.teamName}</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-slate-400">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{item.location}</span>
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#ff0046] transition-colors line-clamp-1 mb-1">
                    {item.title}
                  </h3>

                  <p className="text-[10px] text-slate-500 bg-white p-1.5 rounded-md border border-slate-200/60 font-medium italic line-clamp-2 mb-2">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[180px] font-medium text-slate-600">
                    {item.kitDetails}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold">{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Modal: Post / Upload Picture */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-spring-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#0b1522] text-[#00b04f] rounded-lg">
                  <Camera className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase text-[#0b1522]">
                    Share Delivered Kit Photo
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Post pictures of your squad in action with their new kits
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Team / Club Name *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Eldoret Strikers FC"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Title / Event *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ward Cup Final Match Kits Handover"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Location / Pitch
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Huruma Grounds"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Kit Delivered
                  </label>
                  <input
                    type="text"
                    value={kitDetails}
                    onChange={(e) => setKitDetails(e.target.value)}
                    placeholder="e.g. 16 Match Kits + Breakers"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Picture Image URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... (or leave empty for default sport photo)"
                    className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                  />
                  <UploadCloud className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Message / Quote
                </label>
                <textarea
                  rows={2}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Tell us how the squad feels about the new kits..."
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#0b1522] hover:bg-[#152a40] text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Post Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lightbox Zoom Preview */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#0b1522] text-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl cursor-default"
          >
            <div className="relative aspect-16/10 w-full bg-black">
              <img
                src={selectedImage.image}
                alt={selectedImage.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#0b1522]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#00b04f]">
                  {selectedImage.teamName}
                </span>
                <span className="text-[10px] text-slate-400">{selectedImage.location}</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">
                {selectedImage.title}
              </h4>
              <p className="text-xs text-slate-300 italic mb-2">
                &ldquo;{selectedImage.quote}&rdquo;
              </p>
              <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>{selectedImage.kitDetails}</span>
                <span>{selectedImage.date}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
