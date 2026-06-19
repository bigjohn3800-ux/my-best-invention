import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Search, ShieldBan, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import type { User } from "@shared/schema";

type SafeUser = Omit<User, "password">;

const roleLabels: Record<string, string> = {
  superadmin: "최고관리자",
  admin: "행정관리자",
  group_admin: "단체관리자",
  member: "회원",
};

const roleColors: Record<string, string> = {
  superadmin: "bg-red-500/10 text-red-400 border-red-500/20",
  admin: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  group_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  member: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export default function AdminMembersPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isSuperadmin = currentUser?.role === "superadmin";

  const { data: allUsers, isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const blockMutation = useMutation({
    mutationFn: async ({ id, blocked }: { id: number; blocked: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/block`, { blocked });
      return res.json() as Promise<SafeUser>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "회원 상태가 변경되었습니다." });
    },
    onError: () => {
      toast({ title: "상태 변경에 실패했습니다.", variant: "destructive" });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
      return res.json() as Promise<SafeUser>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "역할이 변경되었습니다." });
    },
    onError: () => {
      toast({ title: "역할 변경에 실패했습니다.", variant: "destructive" });
    },
  });

  const filtered = allUsers?.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || "").toLowerCase().includes(search.toLowerCase())
  );

  const canChangeRole = (targetUser: SafeUser) => {
    return isSuperadmin && targetUser.role !== "superadmin" && targetUser.role !== "group_admin";
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-members-title">
                회원 관리
              </h1>
              <p className="text-muted-foreground">회원을 검색하고 차단/해제할 수 있습니다</p>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="아이디 또는 이름으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              data-testid="input-search-members"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />)}</div>
          ) : (
            <div className="space-y-3">
              {filtered?.map((u) => (
                <div key={u.id} className="glass-card rounded-xl p-4 flex items-center gap-4" data-testid={`card-member-${u.id}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {(u.displayName || u.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{u.displayName || u.username}</p>
                      {u.blocked && (
                        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                          차단됨
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                  {canChangeRole(u) ? (
                    <Select
                      value={u.role}
                      onValueChange={(value) => roleMutation.mutate({ id: u.id, role: value })}
                      disabled={roleMutation.isPending}
                    >
                      <SelectTrigger
                        className={`w-[120px] h-8 text-xs border ${roleColors[u.role] || ""}`}
                        data-testid={`select-role-${u.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">회원</SelectItem>
                        <SelectItem value="admin">행정관리자</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={`text-xs ${roleColors[u.role] || ""}`} data-testid={`badge-role-${u.id}`}>
                      {roleLabels[u.role] || u.role}
                    </Badge>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                  {u.role !== "superadmin" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => blockMutation.mutate({ id: u.id, blocked: !u.blocked })}
                      disabled={blockMutation.isPending}
                      className={u.blocked
                        ? "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      }
                      data-testid={`button-block-${u.id}`}
                    >
                      {u.blocked ? (
                        <><ShieldCheck className="w-4 h-4 mr-1" /> 해제</>
                      ) : (
                        <><ShieldBan className="w-4 h-4 mr-1" /> 차단</>
                      )}
                    </Button>
                  )}
                </div>
              ))}
              {filtered?.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
