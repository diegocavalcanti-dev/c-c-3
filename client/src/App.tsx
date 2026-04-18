import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ArticleList from "./pages/ArticleList";
import ArticlePage from "./pages/ArticlePage";
import SearchPage from "./pages/SearchPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminPostEditor from "./pages/admin/AdminPostEditor";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminImport from "./pages/admin/AdminImport";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCMSPro from "./pages/admin/AdminCMSPro";
import AdminDashboardPro from "./pages/admin/AdminDashboardPro";
import AdminPostsListPro from "./pages/admin/AdminPostsListPro";
// import AdPopup from "./components/AdPopup";


function Router() {
  return (
    <>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Home} />
        <Route path="/categoria/:slug" component={ArticleList} />
        <Route path="/busca" component={SearchPage} />

        {/* Admin routes - IMPORTANTE: vém antes da rota genérica */}
        <Route path="/admin" component={AdminDashboardPro} />
        <Route path="/admin/dashboard" component={AdminDashboardPro} />
        <Route path="/admin/posts" component={AdminPostsListPro} />
        <Route path="/admin/posts/novo" component={AdminPostEditor} />
        <Route path="/admin/posts/:id/editar" component={AdminPostEditor} />
        <Route path="/admin/categorias" component={AdminCategories} />
        <Route path="/admin/usuarios" component={AdminUsers} />
        <Route path="/admin/importar" component={AdminImport} />
        <Route path="/admin/media" component={AdminMedia} />

        {/* Article route - genérica, deve ser a última */}
        <Route path="/:slug" component={ArticlePage} />

        {/* 404 - sempre por último */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
          {/* <AdPopup /> */}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
