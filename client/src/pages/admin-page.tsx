import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Building2, UserCog, TrendingUp, FileText, Activity, BarChart3, UserPlus, Sparkles, ArrowRightLeft, Info } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import type { User, FranchiseInquiry } from "@shared/schema";

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

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<{ totalUsers: number; newThisMonth: number; orgCount: number }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const roleChangeMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "역할이 변경되었습니다" });
    },
    onError: () => {
      toast({ title: "역할 변경 실패", variant: "destructive" });
    },
  });

  const { data: aiUsage } = useQuery<{ days: number; daily: { date: string; count: number }[]; byEndpoint: { endpoint: string; count: number }[]; total: number }>({
    queryKey: ["/api/admin/ai-usage", { days: 30 }],
    queryFn: async () => {
      const res = await fetch("/api/admin/ai-usage?days=30", { credentials: "include" });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const { data: franchiseInquiries } = useQuery<FranchiseInquiry[]>({
    queryKey: ["/api/admin/franchise"],
  });

  const franchiseStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/franchise/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/franchise"] });
      toast({ title: "상태가 변경되었습니다" });
    },
  });

  const statusLabels: Record<string, string> = { pending: "대기", contacted: "연락 완료", completed: "처리 완료", rejected: "반려" };
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const isSuperadmin = user?.role === "superadmin";

  const [analyticsDays, setAnalyticsDays] = useState<7 | 30 | 90>(30);
  const [analyticsTool, setAnalyticsTool] = useState<string>("all");

  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    days: number;
    tool: string | null;
    signupsDaily: { date: string; count: number }[];
    aiDaily: { date: string; guest: number; member: number }[];
    byTool: { tool: string; count: number }[];
    conversion: { guestSessions: number; signups: number; rate: number };
    totals: { signups: number; guestCalls: number; memberCalls: number };
  }>({
    queryKey: ["/api/admin/analytics/overview", { days: analyticsDays, tool: analyticsTool }],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(analyticsDays) });
      if (analyticsTool && analyticsTool !== "all") params.set("tool", analyticsTool);
      const res = await fetch(`/api/admin/analytics/overview?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const conversionPct = analytics ? Math.round(analytics.conversion.rate * 1000) / 10 : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-admin-title">
                관리자 대시보드
              </h1>
              <p className="text-muted-foreground">시스템 전체 현황 및 회원 관리</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {statsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />)
            ) : (
              [
                { label: "전체 회원", value: stats?.totalUsers || 0, icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                { label: "이번 달 신규", value: stats?.newThisMonth || 0, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "등록 단체", value: stats?.orgCount || 0, icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10" },
              ].map(({ label, value, icon: Icon, color, bg }, i) => (
                <div key={i} className="glass-card rounded-xl p-5 flex items-center gap-4" data-testid={`card-admin-stat-${i}`}>
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                분석 대시보드
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1" data-testid="toggle-analytics-days">
                  {[7, 30, 90].map(d => (
                    <button
                      key={d}
                      onClick={() => setAnalyticsDays(d as 7 | 30 | 90)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${analyticsDays === d ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:text-white"}`}
                      data-testid={`button-days-${d}`}
                    >
                      {d}일
                    </button>
                  ))}
                </div>
                <Select value={analyticsTool} onValueChange={setAnalyticsTool}>
                  <SelectTrigger className="w-36 h-9 text-xs bg-white/5 border-white/10 text-white" data-testid="select-analytics-tool">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    <SelectItem value="all">전체 도구</SelectItem>
                    <SelectItem value="scamper">SCAMPER</SelectItem>
                    <SelectItem value="triz">TRIZ</SelectItem>
                    <SelectItem value="patent">특허초안</SelectItem>
                    <SelectItem value="bmc">BMC</SelectItem>
                    <SelectItem value="pitch">피칭덱</SelectItem>
                    <SelectItem value="diagnosis">진단</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {analyticsLoading ? (
                [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />)
              ) : (
                <>
                  <div className="glass-card rounded-xl p-4 flex items-center gap-3" data-testid="kpi-signups">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{analytics?.totals.signups ?? 0}</p>
                      <p className="text-xs text-gray-400">신규 가입</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-4 flex items-center gap-3" data-testid="kpi-guest-calls">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{analytics?.totals.guestCalls ?? 0}</p>
                      <p className="text-xs text-gray-400">게스트 AI 호출</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-4 flex items-center gap-3" data-testid="kpi-member-calls">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{analytics?.totals.memberCalls ?? 0}</p>
                      <p className="text-xs text-gray-400">회원 AI 호출</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-4 flex items-center gap-3" data-testid="kpi-conversion">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xl font-bold text-white">{conversionPct}%</p>
                        <TooltipProvider>
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-gray-500 hover:text-gray-300" data-testid="tooltip-conversion">
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              근사치: 기간 내 IP+UA 해시 기준 고유 게스트 중, 같은 해시로 72시간 이내 회원가입한 비율. 공용 와이파이·시크릿 모드·여러 기기 사용 등 환경에 따라 실제 값과 차이가 있을 수 있습니다.
                            </TooltipContent>
                          </UiTooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-xs text-gray-400">게스트→회원 전환 (근사)</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mb-4">
              <div className="glass-card rounded-xl p-4" data-testid="chart-signups-daily">
                <p className="text-sm text-gray-400 mb-2">일자별 신규 가입</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.signupsDaily ?? []}>
                      <defs>
                        <linearGradient id="signArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => (v || "").slice(5)} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#0a0a1a", border: "1px solid #ffffff20", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                      <Area type="monotone" dataKey="count" name="신규 가입" stroke="#10b981" strokeWidth={2} fill="url(#signArea)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card rounded-xl p-4" data-testid="chart-ai-guest-vs-member">
                <p className="text-sm text-gray-400 mb-2">일자별 AI 호출 (게스트 vs 회원)</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.aiDaily ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => (v || "").slice(5)} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#0a0a1a", border: "1px solid #ffffff20", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                      <Line type="monotone" dataKey="guest" name="게스트" stroke="#fb923c" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="member" name="회원" stroke="#00D1FF" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4" data-testid="chart-by-tool">
              <p className="text-sm text-gray-400 mb-2">도구별 호출 수 (전체, 기간 내)</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.byTool ?? []} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <YAxis dataKey="tool" type="category" stroke="#94a3b8" fontSize={11} width={90} />
                    <Tooltip contentStyle={{ background: "#0a0a1a", border: "1px solid #ffffff20", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                    <Bar dataKey="count" name="호출 수" fill="#7000FF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              최근 30일 AI 사용 분석
              <span className="text-xs text-gray-400 font-normal ml-1">(총 {aiUsage?.total ?? 0}회)</span>
            </h2>
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-4 lg:col-span-2" data-testid="chart-ai-usage-daily">
                <p className="text-sm text-gray-400 mb-2">일자별 AI 호출</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={aiUsage?.daily || []}>
                      <defs>
                        <linearGradient id="aiArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00D1FF" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#00D1FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#0a0a1a", border: "1px solid #ffffff20", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                      <Area type="monotone" dataKey="count" stroke="#00D1FF" strokeWidth={2} fill="url(#aiArea)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card rounded-xl p-4" data-testid="chart-ai-usage-endpoint">
                <p className="text-sm text-gray-400 mb-2">엔드포인트별 호출</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(aiUsage?.byEndpoint || []).map(e => ({ name: e.endpoint.replace("/api/ai/", ""), count: e.count }))} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={90} />
                      <Tooltip contentStyle={{ background: "#0a0a1a", border: "1px solid #ffffff20", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                      <Bar dataKey="count" fill="#7000FF" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            전체 회원 목록
          </h2>

          {usersLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />)}</div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-admin-users">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">ID</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">아이디</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">이름</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">역할</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">가입일</th>
                      {isSuperadmin && <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">역할 변경</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers?.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`row-user-${u.id}`}>
                        <td className="px-5 py-3 text-sm text-gray-400">{u.id}</td>
                        <td className="px-5 py-3 text-sm text-white font-medium">{u.username}</td>
                        <td className="px-5 py-3 text-sm text-gray-300">{u.displayName || "-"}</td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className={`text-xs ${roleColors[u.role] || ""}`}>
                            {roleLabels[u.role] || u.role}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                        </td>
                        {isSuperadmin && (
                          <td className="px-5 py-3">
                            {u.id !== user?.id ? (
                              <Select
                                value={u.role}
                                onValueChange={(role) => roleChangeMutation.mutate({ id: u.id, role })}
                              >
                                <SelectTrigger className="w-36 h-8 text-xs bg-white/5 border-white/10 text-white" data-testid={`select-role-${u.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/10">
                                  <SelectItem value="member">회원</SelectItem>
                                  <SelectItem value="group_admin">단체관리자</SelectItem>
                                  <SelectItem value="admin">행정관리자</SelectItem>
                                  <SelectItem value="superadmin">최고관리자</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-gray-500">본인</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {franchiseInquiries && franchiseInquiries.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                단체 활용 문의 목록
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{franchiseInquiries.length}</Badge>
              </h2>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="table-franchise">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">기관명</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">담당자</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">연락처</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">인원</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">상태</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">신청일</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {franchiseInquiries.map((inq) => (
                        <tr key={inq.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`row-franchise-${inq.id}`}>
                          <td className="px-5 py-3 text-sm text-white font-medium">{inq.organizationName}</td>
                          <td className="px-5 py-3 text-sm text-gray-300">{inq.contactName}</td>
                          <td className="px-5 py-3 text-sm text-gray-400">
                            <div>{inq.phone}</div>
                            <div className="text-xs">{inq.email}</div>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-400">{inq.expectedMembers || "-"}</td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className={`text-xs ${statusColors[inq.status] || ""}`}>
                              {statusLabels[inq.status] || inq.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-400">
                            {new Date(inq.createdAt).toLocaleDateString("ko-KR")}
                          </td>
                          <td className="px-5 py-3">
                            <Select
                              value={inq.status}
                              onValueChange={(status) => franchiseStatusMutation.mutate({ id: inq.id, status })}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10 text-white" data-testid={`select-franchise-status-${inq.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-white/10">
                                <SelectItem value="pending">대기</SelectItem>
                                <SelectItem value="contacted">연락 완료</SelectItem>
                                <SelectItem value="completed">처리 완료</SelectItem>
                                <SelectItem value="rejected">반려</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
