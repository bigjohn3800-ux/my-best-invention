import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, RoleProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LegalPage from "@/pages/legal-page";
import PricingPage from "@/pages/pricing-page";
import CourseListPage from "@/pages/course-list-page";
import CourseDetailPage from "@/pages/course-detail-page";
import DashboardPage from "@/pages/dashboard-page";
import InventionStudioPage from "@/pages/invention-studio-page";
import StartupLabPage from "@/pages/startup-lab-page";
import DiagnosisPage from "@/pages/diagnosis-page";
import InspirationPage from "@/pages/inspiration-page";
import IdeaNotesPage from "@/pages/idea-notes-page";
import AdminPage from "@/pages/admin-page";
import AdminMembersPage from "@/pages/admin-members-page";
import AdminGroupPage from "@/pages/admin-group-page";
import FranchisePage from "@/pages/franchise-page";
import GuidePage from "@/pages/guide-page";
import CommunityPage from "@/pages/community-page";
import ManualPage from "@/pages/manual-page";
import AudiencesPage from "@/pages/audiences-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/inspiration" component={InspirationPage} />
      <Route path="/invention">
        {() => <CourseListPage track="invention" />}
      </Route>
      <Route path="/startup">
        {() => <CourseListPage track="startup" />}
      </Route>
      <Route path="/course/:id" component={CourseDetailPage} />
      <Route path="/invention-studio" component={InventionStudioPage} />
      <Route path="/startup-lab" component={StartupLabPage} />
      <Route path="/diagnosis" component={DiagnosisPage} />
      <Route path="/idea-notes" component={IdeaNotesPage} />
      <Route path="/legal/:type" component={LegalPage} />
      <Route path="/franchise" component={FranchisePage} />
      <Route path="/guide" component={GuidePage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/manual" component={ManualPage} />
      <Route path="/audiences" component={AudiencesPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <RoleProtectedRoute path="/admin" component={AdminPage} roles={["superadmin", "admin"]} />
      <RoleProtectedRoute path="/admin/members" component={AdminMembersPage} roles={["superadmin", "admin"]} />
      <RoleProtectedRoute path="/admin/group" component={AdminGroupPage} roles={["superadmin", "admin", "group_admin"]} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
