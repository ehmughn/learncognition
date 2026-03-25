import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ModulesPage from "./pages/modules/ModulesPage";
import CreateModulePage from "./pages/modules/CreateModulePage";
import EditModulePage from "./pages/modules/EditModulePage";
import ModuleDetailPage from "./pages/modules/ModuleDetailPage";
import ObjectFormPage from "./pages/objects/ObjectFormPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import ProfilePage from "./pages/profile/ProfilePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/modules" element={<ModulesPage />} />
                  <Route path="/modules/new" element={<CreateModulePage />} />
                  <Route path="/modules/:id" element={<ModuleDetailPage />} />
                  <Route
                    path="/modules/:id/edit"
                    element={<EditModulePage />}
                  />
                  <Route
                    path="/modules/:id/objects/new"
                    element={<ObjectFormPage />}
                  />
                  <Route
                    path="/modules/:id/objects/:objId/edit"
                    element={<ObjectFormPage />}
                  />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
