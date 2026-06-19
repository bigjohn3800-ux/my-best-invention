import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Plus, Copy, Users, KeyRound, BookOpen, CheckCircle2, Lightbulb, Rocket, Brain, Award, BarChart3, TrendingUp, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import type { Organization, User } from "@shared/schema";

type SafeUser = Omit<User, "password">;

interface OrgMember {
  id: number;
  userId: number;
  organizationId: number;
  joinedAt: string;
  user: SafeUser;
  progress: { completedCourses: number; inProgress: number };
}

export default function AdminGroupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const isGroupAdmin = user?.role === "group_admin" || user?.role === "admin" || user?.role === "superadmin";

  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: members, isLoading: membersLoading } = useQuery<OrgMember[]>({
    queryKey: ["/api/organizations", selectedOrgId, "members"],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      const res = await fetch(`/api/organizations/${selectedOrgId}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedOrgId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/organizations", { name: orgName, description: orgDesc });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({ title: "단체가 생성되었습니다" });
      setCreateOpen(false);
      setOrgName("");
      setOrgDesc("");
    },
    onError: () => {
      toast({ title: "단체 생성 실패", variant: "destructive" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/organizations/join", { inviteCode: joinCode });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({ title: `"${data.organization.name}" 단체에 가입했습니다` });
      setJoinOpen(false);
      setJoinCode("");
    },
    onError: (err: Error) => {
      toast({
        title: "가입 실패",
        description: err.message.includes("올바르지") ? "초대 코드를 확인해주세요" : err.message,
        variant: "destructive",
      });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "초대 코드가 복사되었습니다" });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-group-title">
                  단체 관리
                </h1>
                <p className="text-muted-foreground">소속 단체 및 회원을 관리하세요</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-white/10 text-gray-300 hover:bg-white/5" data-testid="button-join-org">
                    <KeyRound className="w-4 h-4 mr-2" />
                    코드로 가입
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-white/10 text-white" data-testid="modal-join-org">
                  <DialogHeader>
                    <DialogTitle className="text-white">초대 코드로 단체 가입</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-gray-300">초대 코드</Label>
                      <Input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="초대 코드를 입력하세요"
                        className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500 uppercase tracking-widest text-center text-lg"
                        data-testid="input-join-code"
                      />
                    </div>
                    <Button
                      className="w-full gradient-primary text-white"
                      onClick={() => joinMutation.mutate()}
                      disabled={!joinCode || joinMutation.isPending}
                      data-testid="button-submit-join"
                    >
                      {joinMutation.isPending ? "가입 중..." : "가입하기"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {isGroupAdmin && (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gradient-primary text-white" data-testid="button-create-org">
                      <Plus className="w-4 h-4 mr-2" />
                      단체 생성
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-white/10 text-white" data-testid="modal-create-org">
                    <DialogHeader>
                      <DialogTitle className="text-white">새 단체 만들기</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label className="text-gray-300">단체명</Label>
                        <Input
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="단체명을 입력하세요"
                          className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          data-testid="input-org-name"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">설명 (선택)</Label>
                        <Input
                          value={orgDesc}
                          onChange={(e) => setOrgDesc(e.target.value)}
                          placeholder="단체 설명"
                          className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          data-testid="input-org-desc"
                        />
                      </div>
                      <Button
                        className="w-full gradient-primary text-white"
                        onClick={() => createMutation.mutate()}
                        disabled={!orgName || createMutation.isPending}
                        data-testid="button-submit-create-org"
                      >
                        {createMutation.isPending ? "생성 중..." : "생성하기"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {orgsLoading ? (
            <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />)}</div>
          ) : (
            <div className="grid gap-4">
              {(!organizations || organizations.length === 0) && (
                <div className="glass-card rounded-xl p-12 text-center">
                  <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">소속된 단체가 없습니다</p>
                  <p className="text-sm text-gray-500 mt-1">초대 코드를 입력하여 단체에 가입하세요</p>
                </div>
              )}
              {organizations?.map((org) => (
                <div
                  key={org.id}
                  className={`glass-card rounded-xl p-5 cursor-pointer transition-all hover:bg-white/[0.03] ${selectedOrgId === org.id ? "ring-1 ring-cyan-500/30" : ""}`}
                  onClick={() => setSelectedOrgId(org.id)}
                  data-testid={`card-org-${org.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{org.name}</h3>
                        {org.description && <p className="text-xs text-gray-400 mt-0.5">{org.description}</p>}
                      </div>
                    </div>
                    {org.inviteCode && (
                      <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        onClick={(e) => { e.stopPropagation(); copyCode(org.inviteCode); }}
                        data-testid={`button-copy-code-${org.id}`}
                      >
                        <span className="text-xs text-cyan-400 font-mono tracking-widest">{org.inviteCode}</span>
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedOrgId && (
            <OrgDetailedView orgId={selectedOrgId} members={members} membersLoading={membersLoading} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

interface OrgStats {
  memberCount: number;
  stats: {
    user: Omit<User, "password">;
    progress: { completedCourses: number; inProgress: number };
    inventionCount: number;
    bmcCount: number;
    diagnosticCount: number;
    aiUsageCount: number;
    badgeCount: number;
  }[];
}

interface MemberWorks {
  inventions: { id: number; title: string; createdAt: string }[];
  canvases: { id: number; title: string; createdAt: string }[];
  diagnostics: { id: number; type: string; createdAt: string }[];
}

function MemberWorksButton({ orgId, memberId, memberName }: { orgId: number; memberId: number; memberName: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery<MemberWorks>({
    queryKey: ["/api/organizations", orgId, "members", memberId, "works"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/members/${memberId}/works`, { credentials: "include" });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    enabled: open,
  });
  const fmt = (d: string) => new Date(d).toLocaleDateString("ko-KR");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-white/10 text-cyan-300 hover:bg-cyan-500/10" data-testid={`button-works-${memberId}`}>
          <FolderOpen className="w-3 h-3 mr-1" /> 보기
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg" data-testid={`modal-works-${memberId}`}>
        <DialogHeader>
          <DialogTitle className="text-white">{memberName} 님의 작품</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2 py-4"><Skeleton className="h-6 bg-white/5" /><Skeleton className="h-6 bg-white/5" /><Skeleton className="h-6 bg-white/5" /></div>
        ) : (
          <div className="space-y-4 mt-2 max-h-[60vh] overflow-y-auto">
            <div>
              <p className="text-xs text-yellow-400 font-semibold mb-2 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5" /> 발명 프로젝트 ({data?.inventions.length || 0})</p>
              {data?.inventions.length ? (
                <ul className="space-y-1.5">{data.inventions.map(it => (
                  <li key={it.id} className="text-sm text-gray-200 flex justify-between gap-2 px-3 py-2 rounded-lg bg-white/5">
                    <span className="truncate">{it.title || "(제목 없음)"}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{fmt(it.createdAt)}</span>
                  </li>
                ))}</ul>
              ) : <p className="text-xs text-gray-500 px-3 py-2">아직 등록된 작품이 없습니다.</p>}
            </div>
            <div>
              <p className="text-xs text-purple-400 font-semibold mb-2 flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5" /> BMC 캔버스 ({data?.canvases.length || 0})</p>
              {data?.canvases.length ? (
                <ul className="space-y-1.5">{data.canvases.map(it => (
                  <li key={it.id} className="text-sm text-gray-200 flex justify-between gap-2 px-3 py-2 rounded-lg bg-white/5">
                    <span className="truncate">{it.title || "(제목 없음)"}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{fmt(it.createdAt)}</span>
                  </li>
                ))}</ul>
              ) : <p className="text-xs text-gray-500 px-3 py-2">아직 등록된 캔버스가 없습니다.</p>}
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-semibold mb-2 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> 진단 ({data?.diagnostics.length || 0})</p>
              {data?.diagnostics.length ? (
                <ul className="space-y-1.5">{data.diagnostics.map(it => (
                  <li key={it.id} className="text-sm text-gray-200 flex justify-between gap-2 px-3 py-2 rounded-lg bg-white/5">
                    <span>{it.type === "creativity" ? "창의성 진단" : "창업 진단"}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{fmt(it.createdAt)}</span>
                  </li>
                ))}</ul>
              ) : <p className="text-xs text-gray-500 px-3 py-2">아직 진단 기록이 없습니다.</p>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OrgDetailedView({ orgId, members, membersLoading }: { orgId: number; members?: OrgMember[]; membersLoading: boolean }) {
  const { data: orgStats, isLoading: statsLoading } = useQuery<OrgStats>({
    queryKey: ["/api/organizations", orgId, "stats"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/stats`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!orgId,
  });

  const loading = membersLoading || statsLoading;
  const stats = orgStats?.stats || [];

  const totals = stats.reduce((acc, s) => ({
    inventions: acc.inventions + s.inventionCount,
    bmcs: acc.bmcs + s.bmcCount,
    diagnostics: acc.diagnostics + s.diagnosticCount,
    aiUsage: acc.aiUsage + s.aiUsageCount,
    badges: acc.badges + s.badgeCount,
    completed: acc.completed + s.progress.completedCourses,
  }), { inventions: 0, bmcs: 0, diagnostics: 0, aiUsage: 0, badges: 0, completed: 0 });

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-cyan-400" />
        단체 현황 대시보드
      </h2>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="org-stats-summary">
            {[
              { label: "회원수", value: stats.length, icon: Users, color: "text-cyan-400 bg-cyan-500/10" },
              { label: "발명 프로젝트", value: totals.inventions, icon: Lightbulb, color: "text-yellow-400 bg-yellow-500/10" },
              { label: "BMC 캔버스", value: totals.bmcs, icon: Rocket, color: "text-purple-400 bg-purple-500/10" },
              { label: "진단 횟수", value: totals.diagnostics, icon: Brain, color: "text-emerald-400 bg-emerald-500/10" },
              { label: "AI 사용", value: totals.aiUsage, icon: TrendingUp, color: "text-blue-400 bg-blue-500/10" },
              { label: "수료 과정", value: totals.completed, icon: Award, color: "text-amber-400 bg-amber-500/10" },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl p-4 text-center">
                <div className={`w-9 h-9 rounded-lg ${s.color} mx-auto mb-2 flex items-center justify-center`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> 회원별 활동 현황
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-org-members">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">회원</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">레벨</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">발명</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">BMC</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">진단</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">AI</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">배지</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">수료</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">작품</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => (
                    <tr key={s.user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors" data-testid={`row-member-${s.user.id}`}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                            {(s.user.displayName || s.user.username).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{s.user.displayName || s.user.username}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.user.level === "advanced" ? "bg-purple-500/10 text-purple-400" : s.user.level === "intermediate" ? "bg-blue-500/10 text-blue-400" : "bg-gray-500/10 text-gray-400"}`}>
                          {s.user.level === "beginner" ? "초급" : s.user.level === "intermediate" ? "중급" : "고급"}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2 text-yellow-400">{s.inventionCount}</td>
                      <td className="text-center py-3 px-2 text-purple-400">{s.bmcCount}</td>
                      <td className="text-center py-3 px-2 text-emerald-400">{s.diagnosticCount}</td>
                      <td className="text-center py-3 px-2 text-blue-400">{s.aiUsageCount}</td>
                      <td className="text-center py-3 px-2 text-amber-400">{s.badgeCount}</td>
                      <td className="text-center py-3 px-2">
                        <span className="text-green-400">{s.progress.completedCourses}</span>
                        <span className="text-gray-600 mx-0.5">/</span>
                        <span className="text-yellow-400">{s.progress.inProgress}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <MemberWorksButton orgId={orgId} memberId={s.user.id} memberName={s.user.displayName || s.user.username} />
                      </td>
                    </tr>
                  ))}
                  {stats.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-400">아직 소속 회원이 없습니다</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
