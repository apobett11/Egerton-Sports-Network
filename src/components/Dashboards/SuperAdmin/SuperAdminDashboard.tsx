import { useAuth } from '../../../contexts/AuthContext';
import { useAdminOperationsData } from './hooks/useAdminOperationsData';
import { AdminSidebar } from './components/Navigation/AdminSidebar';
import { AdminBottomNav } from './components/Navigation/AdminBottomNav';
import { AdminModals } from './components/Modals/AdminModals';
import { AdminOverviewView } from './components/Views/AdminOverviewView';
import { AdminAgent0View } from './components/Views/AdminAgent0View';
import { AdminDashboardOverviewsView } from './components/Views/AdminDashboardOverviewsView';
import { AdminPlatformInsightsView } from './components/Views/AdminPlatformInsightsView';
import { AdminUserDirectoryView } from './components/Views/AdminUserDirectoryView';
import { AdminRoleManagementView } from './components/Views/AdminRoleManagementView';
import { AdminAuditLogsView } from './components/Views/AdminAuditLogsView';
import { AdminPerformanceView } from './components/Views/AdminPerformanceView';
import { AdminSettingsAnnouncementsView } from './components/Views/AdminSettingsAnnouncementsView';
import { AdminProfileView } from './components/Views/AdminProfileView';
import { RefreshCw, Zap, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { logout } = useAuth();
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
    refreshData,
  } = useAdminOperationsData();

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

  if (isLoading && platformHealth.totalUsers === 0) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center gap-4 text-emerald-400 font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <span className="text-sm font-semibold tracking-wide text-gray-400">
          Connecting to Supabase Platform Operations...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 font-sans antialiased flex flex-col md:flex-row pb-16 md:pb-0">
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
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop & Mobile Header Bar */}
        <header className="bg-[#161616] border-b border-[#2A2A2A] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
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
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                  {activeTab.replace('_', ' ')}
                </h1>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Live Supabase connection • Synced at {systemHealth.lastChecked}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
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
                onClick={refreshData}
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

          {activeTab === 'agent0' && (
            <AdminAgent0View
              showToast={showToast}
            />
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

          {activeTab === 'roles' && (
            <AdminRoleManagementView
              platformHealth={platformHealth}
              userDirectory={userDirectory}
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

          {activeTab === 'performance' && (
            <AdminPerformanceView
              metrics={performanceMetrics}
              systemHealth={systemHealth}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsAnnouncementsView
              onPostAnnouncement={handlePostAnnouncement}
              showToast={showToast}
            />
          )}

          {activeTab === 'profile' && (
            <AdminProfileView
              onLogout={handleLogout}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <AdminBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        insightsCount={platformInsights.filter((i) => i.severity === 'critical' || i.severity === 'warning').length}
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
