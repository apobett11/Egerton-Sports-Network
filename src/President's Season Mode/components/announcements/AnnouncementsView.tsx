import React, { useState, useEffect, useCallback } from 'react';
import { BroadcastView } from '../../../components/Dashboards/President/components/Megaphone/BroadcastView';
import { ApiService } from '../../../services/api';
import type { AnnouncementItem } from '../../../components/Dashboards/President/types';

interface AnnouncementsViewProps {
  isDark: boolean;
  showToast?: (msg: string) => void;
  onAnnouncementCreated?: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  isDark,
  showToast,
  onAnnouncementCreated,
}) => {
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [recipientGroup, setRecipientGroup] = useState('all');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isSending, setIsSending] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await ApiService.getAnnouncements();
      if (res.success && res.data) {
        setAnnouncements(res.data as any);
      }
    } catch (e) {
      console.error('Failed to load announcements:', e);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      showToast?.('⚠️ Title and Message Body are required.');
      return;
    }

    setIsSending(true);
    try {
      const res = await ApiService.createAnnouncement({
        title: announcementTitle.trim(),
        content: announcementBody.trim(),
        target_role: recipientGroup,
        recipients: recipientGroup,
      });

      if (res.success && res.data) {
        await ApiService.logAuditAction('BROADCAST_ANNOUNCEMENT', 'announcements', res.data.id || 'new', {
          title: announcementTitle,
          target_role: recipientGroup,
          recipients: recipientGroup,
        });
        setAnnouncementTitle('');
        setAnnouncementBody('');
        setRecipientGroup('all');
        await fetchAnnouncements();
        showToast?.('📢 Announcement published to database successfully!');
        onAnnouncementCreated?.();
      } else {
        showToast?.(`⚠️ ${res.message || 'Failed to publish announcement'}`);
      }
    } catch (err: any) {
      showToast?.(`⚠️ Error broadcasting announcement: ${err?.message || 'Server error'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      <BroadcastView
        isDark={isDark}
        announcementTitle={announcementTitle}
        setAnnouncementTitle={setAnnouncementTitle}
        announcementBody={announcementBody}
        setAnnouncementBody={setAnnouncementBody}
        recipientGroup={recipientGroup}
        setRecipientGroup={setRecipientGroup}
        recentAnnouncements={announcements}
        handleBroadcastAnnouncement={handleBroadcastAnnouncement}
        isSending={isSending}
      />
    </div>
  );
};

export default AnnouncementsView;
