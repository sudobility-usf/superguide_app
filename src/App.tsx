import { Suspense, lazy, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SudobilityAppWithFirebaseAuth } from '@sudobility/building_blocks/firebase';
import { LanguageValidator } from '@sudobility/components';
import { isLanguageSupported, CONSTANTS } from './config/constants';
import i18n from './i18n';
import { useDocumentLanguage } from './hooks/useDocumentLanguage';
import { AuthProviderWrapper } from './components/providers/AuthProviderWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const GetStartedPage = lazy(() => import('./pages/GetStartedPage'));
const MyTripPage = lazy(() => import('./pages/MyTrip'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const HistoriesPage = lazy(() => import('./pages/HistoriesPage'));
const HistoryDetailPage = lazy(() => import('./pages/HistoryDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SitemapPage = lazy(() => import('./pages/SitemapPage'));
const LanguageRedirect = lazy(() => import('./components/layout/LanguageRedirect'));

/**
 * Full-screen loading spinner displayed while lazy-loaded route
 * components are being fetched.
 */
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
    <div
      role="status"
      aria-label="Loading"
      className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
    />
  </div>
);

function DocumentLanguageSync({ children }: { children: ReactNode }) {
  useDocumentLanguage();
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <DocumentLanguageSync>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LanguageRedirect />} />
            <Route
              path="/:lang"
              element={
                <LanguageValidator
                  isLanguageSupported={isLanguageSupported}
                  defaultLanguage="en"
                  storageKey="language"
                />
              }
            >
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="get-started" element={<GetStartedPage />} />
              <Route path="my-trip" element={<MyTripPage />} />
              <Route path="docs" element={<DocsPage />} />
              <Route
                path="histories"
                element={
                  <ErrorBoundary>
                    <HistoriesPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="histories/:historyId"
                element={
                  <ErrorBoundary>
                    <HistoryDetailPage />
                  </ErrorBoundary>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="sitemap" element={<SitemapPage />} />
              <Route path="*" element={<Navigate to="." replace />} />
            </Route>
            <Route path="*" element={<LanguageRedirect />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </DocumentLanguageSync>
  );
}

function App() {
  return (
    <SudobilityAppWithFirebaseAuth
      i18n={i18n}
      baseUrl={CONSTANTS.API_URL}
      testMode={CONSTANTS.DEV_MODE}
      AuthProviderWrapper={AuthProviderWrapper}
    >
      <AppRoutes />
    </SudobilityAppWithFirebaseAuth>
  );
}

export default App;
