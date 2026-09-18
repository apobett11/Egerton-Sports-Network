import React, { useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAdminOperationsData } from './hooks/useAdminOperationsData';
import { AdminSidebar } from './components/Navigation/AdminSidebar';
import { AdminBottomNav } from './components/Navigation/AdminBottomNav';
import { AdminModals } from './components/Modals/AdminModals';
import { AdminOverviewView } from './components/Views/AdminOverviewView';
import { AdminHealthDiagnosticsView } from './components/Views/AdminHealthDiagnosticsView';
import { Admin2DashboardView } from './components/Views/Admin2DashboardView';
import { AdminAgent0View } from './components/Views/AdminAgent0View';
import { AdminDashboardOverviewsView } from './components/Views/AdminDashboardOverviewsView';
import { AdminPlatformInsightsView } from './components/Views/AdminPlatformInsightsView';
import { AdminUserDirectoryView } from './components/Views/AdminUserDirectoryView';
import { AdminRoleManagementView } from './components/Views/AdminRoleManagementView';
import { AdminAuditLogsView } from './components/Views/AdminAuditLogsView';
import { AdminSettingsAnnouncementsView } from './components/Views/AdminSettingsAnnouncementsView';
import { AdminProfileView } from './components/Views/AdminProfileView';
import { AdminPlayerApprovalsView } from './components/Views/AdminPlayerApprovalsView';
import { AdminPotwAuditView } from './components/Views/AdminPotwAuditView';
import { AdminTwoFactorModal } from './components/Security/AdminTwoFactorModal';
import { Admin2PasswordGateModal } from './components/Security/Admin2PasswordGateModal';
import { RefreshCw, Zap, ShieldAlert, Loader2, ArrowLeft, Lock, Activity, Shield } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const {
    activeTab,
    setActiveTab,
    isLoading,
    errorMsg,
    toastMessage,
    showToast,
    platformHealth,
    systemHealth,
    activityFeed,
    platformErrors,
    userDirectory,
    filteredUsers,
    userSearchTerm,
    setUserSearchTerm,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    auditLogs,
    filteredAuditLogs,
    auditSearchTerm,
    setAuditSearchTerm,
    auditRoleFilter,
    setAuditRoleFilter,
    auditActionFilter,
    setAuditActionFilter,
    journalistOverview,
    teamOverview,
    refereeOverview,
    presidentOverview,
    performanceMetrics,
    platformInsights,
    activeModal,
    setActiveModal,
    selectedItemForModal,
    setSelectedItemForModal,
    handleSuspendUser,
    handleActivateUser,
    handleChangeUserRole,
    handleResetPassword,
    handlePostAnnouncement,
    handleExportAuditLogsCSV,
    playersList,
    handleApprovePlayer,
    handleRejectPlayer,
    refreshData,
    failedCalls,
    slowQueries,
    hourlyTraffic,
    pageVisitAnalytics,
    isAdmin2Unlocked,
    unlockAdmin2,
    relockAdmin2,
    isAdmin2FaVerified,
    verify2FaClearance,
    runLiveDiagnostic,
    isProbeRunning,
    toggleProbe,
    probeCount,
    verifyAdmin2Password,
    updateAdmin2Password,
    applyIndexOptimization,
    clearFailedCalls,
  } = useAdminOperationsData();

  // Check if hash routes directly to Admin 2 on initial render
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#admin2' || hash === '#admin-2' || hash === '#/admin2') {
      setActiveTab('admin_2');
    }
  }, [setActiveTab]);

  const handleLogout = async () => {
    await logout();
    window.location.hash = '/home';
  };

  const handleOpenModal = (type: any, item?: any) => {
    setSelectedItemForModal(item || null);
    setActiveModal(type);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedItemForModal(null);
  };

  if (!isAdmin2FaVerified) {
    return (
      <AdminTwoFactorModal
        isOpen={true}
        onVerified={verify2FaClearance}
        adminEmail={user?.email || 'apobett11@gmail.com'}
        onCancel={handleLogout}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 animate-pulse">
          <Activity className="w-6 h-6 text-emerald-400" />
        </div>
        <span className="text-sm font-bold text-white tracking-wide">
          Connecting to Supabase Platform Operations...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 font-sans antialiased flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Admin 2 Password Protection Gate */}
      {activeTab === 'admin_2' && !isAdmin2Unlocked && (
        <Admin2PasswordGateModal
          isOpen={true}
          onUnlocked={unlockAdmin2}
          onCancel={() => setActiveTab('overview')}
          verifyPassword={verifyAdmin2Password}
        />
      )}

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/30 flex items-center gap-2.5 animate-bounce text-xs md:text-sm font-bold">
          <Zap className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={refreshData}
        onLogout={handleLogout}
        insightsCount={platformInsights.filter((i) => i.severity === 'critical' || i.severity === 'warning').length}
        pendingPlayersCount={playersList.filter((p) => !p.isApproved).length}
        isAdmin2Unlocked={isAdmin2Unlocked}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="bg-[#161616] border-b border-[#262626] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="md:hidden p-2 bg-[#222222] text-gray-400 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              title="Return Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeTab === 'admin_2' ? 'bg-amber-400' : 'bg-emerald-400'
                  } animate-pulse`}
                />
                <h1 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>{activeTab === 'admin_2' ? 'ADMIN 2 • DEEP TELEMETRY' : activeTab.replace('_', ' ')}</span>
                  {activeTab === 'admin_2' && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                </h1>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Live Supabase Connection • Synced at {systemHealth.lastChecked}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal('team')}
              className="px-3.5 py-1.5 bg-[#202020] hover:bg-[#2A2A2A] text-emerald-400 hover:text-emerald-300 rounded-xl border border-[#333333] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[38px]"
              title="View Teams Readiness & Squad Checklist"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Teams</span>
            </button>
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-[#202020] hover:bg-[#2A2A2A] text-emerald-400 hover:text-emerald-300 rounded-xl border border-[#333333] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[38px]"
              title="Re-query all Supabase database tables"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-center justify-between text-xs text-rose-300">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => refreshData()}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px] uppercase cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* View Router */}
          {activeTab === 'overview' && (
            <AdminOverviewView
              platformHealth={platformHealth}
              systemHealth={systemHealth}
              activityFeed={activityFeed}
              platformErrors={platformErrors}
              setActiveTab={setActiveTab}
              onOpenModal={handleOpenModal}
            />
          )}

          {activeTab === 'health' && (
            <AdminHealthDiagnosticsView
              systemHealth={systemHealth}
              failedCalls={failedCalls}
              onRunDiagnostic={runLiveDiagnostic}
              isLoading={isLoading}
              onClearErrors={clearFailedCalls}
              isProbeRunning={isProbeRunning}
              onToggleProbe={toggleProbe}
              probeCount={probeCount}
            />
          )}

          {activeTab === 'admin_2' && isAdmin2Unlocked && (
            <Admin2DashboardView
              performanceMetrics={performanceMetrics}
              platformHealth={platformHealth}
              hourlyTraffic={hourlyTraffic}
              pageVisitAnalytics={pageVisitAnalytics}
              slowQueries={slowQueries}
              onApplyIndex={applyIndexOptimization}
              onRelock={relockAdmin2}
              onUpdatePassword={updateAdmin2Password}
              showToast={showToast}
            />
          )}

          {activeTab === 'users' && (
            <AdminUserDirectoryView
              users={filteredUsers}
              searchTerm={userSearchTerm}
              setSearchTerm={setUserSearchTerm}
              roleFilter={userRoleFilter}
              setRoleFilter={setUserRoleFilter}
              statusFilter={userStatusFilter}
              setStatusFilter={setUserStatusFilter}
              onOpenUserModal={(user) => handleOpenModal('user_detail', user)}
              onSuspendUser={handleSuspendUser}
              onActivateUser={handleActivateUser}
              onChangeUserRole={handleChangeUserRole}
              onResetPassword={handleResetPassword}
              setActiveTab={setActiveTab}
              setAuditSearchTerm={setAuditSearchTerm}
            />
          )}

          {activeTab === 'players' && (
            <AdminPlayerApprovalsView
              players={playersList}
              onApprovePlayer={handleApprovePlayer}
              onRejectPlayer={handleRejectPlayer}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'roles' && (
            <AdminRoleManagementView
              platformHealth={platformHealth}
              userDirectory={userDirectory}
            />
          )}

          {(activeTab === 'announcements' || activeTab === 'settings') && (
            <AdminSettingsAnnouncementsView
              onPostAnnouncement={handlePostAnnouncement}
              showToast={showToast}
            />
          )}

          {activeTab === 'audit_logs' && (
            <AdminAuditLogsView
              auditLogs={filteredAuditLogs}
              searchTerm={auditSearchTerm}
              setSearchTerm={setAuditSearchTerm}
              roleFilter={auditRoleFilter}
              setRoleFilter={setAuditRoleFilter}
              actionFilter={auditActionFilter}
              setActionFilter={setAuditActionFilter}
              onExportCSV={handleExportAuditLogsCSV}
            />
          )}

          {activeTab === 'potw' && (
            <AdminPotwAuditView showToast={showToast} />
          )}

          {activeTab === 'agent0' && (
            <AdminAgent0View showToast={showToast} />
          )}

          {activeTab === 'overviews' && (
            <AdminDashboardOverviewsView
              journalistOverview={journalistOverview}
              teamOverview={teamOverview}
              refereeOverview={refereeOverview}
              presidentOverview={presidentOverview}
              onOpenModal={handleOpenModal}
            />
          )}

          {activeTab === 'insights' && (
            <AdminPlatformInsightsView
              insights={platformInsights}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'profile' && (
            <AdminProfileView
              onLogout={handleLogout}
              showToast={showToast}
              onUpdateAdmin2Password={updateAdmin2Password}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <AdminBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingPlayersCount={playersList.filter((p) => !p.isApproved).length}
      />

      {/* Detail Popups & Modals */}
      <AdminModals
        activeModal={activeModal}
        onClose={handleCloseModal}
        journalistOverview={journalistOverview}
        teamOverview={teamOverview}
        refereeOverview={refereeOverview}
        presidentOverview={presidentOverview}
        selectedItem={selectedItemForModal}
        onSuspendUser={handleSuspendUser}
        onActivateUser={handleActivateUser}
        onChangeUserRole={handleChangeUserRole}
        onResetPassword={handleResetPassword}
        onPostAnnouncement={handlePostAnnouncement}
        showToast={showToast}
      />
    </div>
  );
};

export default SuperAdminDashboard;
