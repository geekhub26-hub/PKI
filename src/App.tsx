import { useEffect, Component, ReactNode } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import TopBar from './components/TopBar';
import AdminDownloadCrlPage from './pages/AdminDownloadCrlPage';
import AdminGenerateCaPage from './pages/AdminGenerateCaPage';
import AdminGenerateCrlPage from './pages/AdminGenerateCrlPage';
import AdminManageUsersPage from './pages/AdminManageUsersPage';
import AdminAuditPage from './pages/AdminAuditPage';
import AdminRevokeCertificatePage from './pages/AdminRevokeCertificatePage';
import AdminSignCsrPage from './pages/AdminSignCsrPage';
import AdminStatsPage from './pages/AdminStatsPage';
import DashboardAdminPage from './pages/DashboardAdminPage';
import DashboardUserPage from './pages/DashboardUserPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserCertificatesPage from './pages/UserCertificatesPage';
import UserDownloadCrlPage from './pages/UserDownloadCrlPage';
import UserGenerateCsrPage from './pages/UserGenerateCsrPage';
import UserRequestPipelinePage from './pages/UserRequestPipelinePage';
import UserRevokeCertificatePage from './pages/UserRevokeCertificatePage';
import UserValidateTokenPage from './pages/UserValidateTokenPage';
import UserRecepisses from './pages/UserRecepisses';
import UserProfilePage from './pages/UserProfilePage';
import VerifyPage from './pages/VerifyPage';
import SuperAdminSettingsPage from './pages/SuperAdminSettingsPage';
import AdminRecepisseStatsPage from './pages/AdminRecepisseStatsPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import { AdminRequestDetail, AdminRequestsList, UserRequestsPage } from './pages';
import { userService } from './services/api';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

class ErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean; msg: string }> {
  state = { crashed: false, msg: '' };
  static getDerivedStateFromError(e: Error) {
    return { crashed: true, msg: e.message };
  }
  render() {
    if (this.state.crashed) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">Une erreur s'est produite.</p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{this.state.msg}</p>
          <button
            onClick={() => { this.setState({ crashed: false, msg: '' }); window.location.hash = '/dashboard'; }}
            className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Retour au tableau de bord
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function useHydrateAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    userService
      .getMe()
      .then((user) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [setLoading, setUser]);
}

function useSyncTheme() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}

function App() {
  useHydrateAuth();
  useSyncTheme();

  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-neutral-950">
        <div className="text-h3 text-primary-800 dark:text-neutral-100">Chargement...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <HashRouter>

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/validate-token" element={<UserValidateTokenPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verify-email" element={<OtpVerificationPage />} />

          <Route
            element={
              <ProtectedRoute>
                <div className="flex h-screen overflow-hidden">
                  <Sidebar />
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <TopBar />
                    <main className="flex-1 overflow-y-auto bg-emerald-50 dark:bg-neutral-950 p-4 sm:p-6 md:p-8">
                      <ErrorBoundary>
                        <Outlet />
                      </ErrorBoundary>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardUserPage />} />
            <Route path="/certificates" element={<UserCertificatesPage />} />
            <Route path="/request-pipeline" element={<UserRequestPipelinePage />} />
            <Route path="/generate-csr" element={<UserGenerateCsrPage />} />
            <Route path="/requests" element={<UserRequestsPage />} />
            <Route path="/revoke-certificate" element={<UserRevokeCertificatePage />} />
            <Route path="/download-crl" element={<UserDownloadCrlPage />} />
            <Route path="/recepisses" element={<UserRecepisses />} />
            <Route path="/profile" element={<UserProfilePage />} />

            <Route path="/admin/dashboard" element={<DashboardAdminPage />} />
            <Route path="/admin/stats" element={<AdminStatsPage />} />
            <Route path="/admin/manage-users" element={<AdminManageUsersPage />} />
            <Route path="/admin/generate-ca" element={<AdminGenerateCaPage />} />
            <Route path="/admin/sign-csr" element={<AdminSignCsrPage />} />
            <Route path="/admin/generate-crl" element={<AdminGenerateCrlPage />} />
            <Route path="/admin/revoke-certificate" element={<AdminRevokeCertificatePage />} />
            <Route path="/admin/download-crl" element={<AdminDownloadCrlPage />} />
            <Route path="/admin/requests" element={<AdminRequestsList />} />
            <Route path="/admin/requests/:id" element={<AdminRequestDetail />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            <Route path="/admin/recepisses/stats" element={<AdminRecepisseStatsPage />} />
            <Route path="/superadmin/settings" element={<SuperAdminSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}

function ProtectedRoute({ children, adminOnly = false }: any) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'AE_CENTRALE', 'ADMIN_AEL', 'AEL'];
  if (adminOnly && !adminRoles.includes(user?.role ?? '')) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export default App;
