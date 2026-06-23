import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, RoleProtectedRoute } from "@/lib/protected-route";
import { Loader2 } from "lucide-react";

const NotFound = lazy(() => import("@/pages/not-found"));
const HomePage = lazy(() => import("@/pages/home-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const LegalPage = lazy(() => import("@/pages/legal-page"));
const PricingPage = lazy(() => import("@/pages/pricing-page"));
const CourseListPage = lazy(() => import("@/pages/course-list-page"));
const CourseDetailPage = lazy(() => import("@/pages/course-detail-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const InventionStudioPage = lazy(() => import("@/pages/invention-studio-page"));
const StartupLabPage = lazy(() => import("@/pages/startup-lab-page"));
const DiagnosisPage = lazy(() => import("@/pages/diagnosis-page"));
const InspirationPage = lazy(() => import("@/pages/inspiration-page"));
const IdeaNotesPage = lazy(() => import("@/pages/idea-notes-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const AdminMembersPage = lazy(() => import("@/pages/admin-members-page"));
const AdminGroupPage = lazy(() => import("@/pages/admin-group-page"));
const FranchisePage = lazy(() => import("@/pages/franchise-page"));
const GuidePage = lazy(() => import("@/pages/guide-page"));
const CommunityPage = lazy(() => import("@/pages/community-page"));
const ManualPage = lazy(() => import("@/pages/manual-page"));
const AudiencesPage = lazy(() => import("@/pages/audiences-page"));
const CheckoutPage = lazy(() => import("@/pages/checkout-page"));
const PaymentSuccessPage = lazy(() => import("@/pages/payment-success-page"));
const PaymentFailPage = lazy(() => import("@/pages/payment-fail-page"));
const ShareViewPage = lazy(() => import("@/pages/share-view-page"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/share/:token" component={ShareViewPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/payment/success" component={PaymentSuccessPage} />
      <Route path="/payment/fail" component={PaymentFailPage} />
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
          <Suspense fallback={<RouteLoading />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
