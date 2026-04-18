import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = trpc.users.listAdmins.useQuery();
  const promoteToAdmin = trpc.users.promoteToAdmin.useMutation({
    onSuccess: () => {
      toast.success("Usuário promovido a administrador");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao promover usuário");
    },
  });

  const demoteToUser = trpc.users.demoteToUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário rebaixado para usuário comum");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao rebaixar usuário");
    },
  });

  return (
    <AdminLayout title="Gerenciar Usuários">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Usuários</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie as permissões de acesso ao painel administrativo.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-medium mb-1">Novos usuários precisam ser promovidos</p>
            <p>Quando um novo usuário faz login pela primeira vez, ele é criado com permissão de usuário comum. Você pode promovê-lo a administrador aqui.</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 rounded" />
              <Skeleton className="h-12 rounded" />
              <Skeleton className="h-12 rounded" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nome</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Função</th>
                    <th className="px-4 py-3 text-left font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <span className="font-medium text-foreground">{user.name || "Sem nome"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.role === "admin" ? (
                            <>
                              <Shield className="w-4 h-4 text-yellow-500" />
                              <span className="text-yellow-600 dark:text-yellow-400 font-medium">Administrador</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 text-blue-500" />
                              <span className="text-blue-600 dark:text-blue-400">Usuário</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {user.role === "admin" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => demoteToUser.mutate({ userId: user.id })}
                              disabled={demoteToUser.isPending}
                              className="text-xs"
                            >
                              {demoteToUser.isPending ? "..." : "Rebaixar"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => promoteToAdmin.mutate({ userId: user.id })}
                              disabled={promoteToAdmin.isPending}
                              className="text-xs"
                            >
                              {promoteToAdmin.isPending ? "..." : "Promover"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
