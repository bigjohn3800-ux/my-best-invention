import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LayoutDashboard, BookOpen, Brain, Lightbulb, Rocket, Zap, TrendingUp, Briefcase, CheckCircle2, Users, Building2, Shield, Award, Star, Compass, FileText, Presentation, Trophy, Target, Edit3, Download, Sparkles, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Course, UserProgress, Badge, InventionProject, BusinessCanvas } from "@shared/schema";

const iconMap: Record<string, typeof Lightbulb> = {
  lightbulb: Lightbulb, zap: Zap, rocket: Rocket, "trending-up": TrendingUp, briefcase: Briefcase,
};

const badgeIconMap: Record<string, typeof Star> = {
  lightbulb: Lightbulb, rocket: Rocket, "bar-chart": TrendingUp, "book-open": BookOpen,
  star: Star, award: Award, zap: Zap, brain: Brain, trophy: Trophy, target: Target,
  compass: Compass, "file-text": FileText, presentation: Presentation, "trending-up": TrendingUp,
};

interface DashboardStats {
  inventionCount: number;
  canvasCount: number;
  diagnosticCount: number;
}

interface BadgeWithStatus extends Badge {
  earned: boolean;
  awardedAt: string | null;
}

function generateCertificate(userName: string, courseName: string, completedDate: string) {
  const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 1200, 850);
  grad.addColorStop(0, "#0a0c1e");
  grad.addColorStop(0.5, "#0e1030");
  grad.addColorStop(1, "#0a0c1e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 850);

  ctx.strokeStyle = "rgba(0,209,255,0.3)";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1140, 790);
  ctx.strokeStyle = "rgba(112,0,255,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(45, 45, 1110, 760);

  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 1200, Math.random() * 850, Math.random() * 80 + 20, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,209,255,${Math.random() * 0.03})`;
    ctx.fill();
  }

  ctx.fillStyle = "#00D1FF";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("마이베스트 AI발명창업", 600, 100);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px sans-serif";
  ctx.fillText("수 료 증", 600, 180);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "16px sans-serif";
  ctx.fillText("CERTIFICATE OF COMPLETION", 600, 215);

  ctx.beginPath();
  const grd = ctx.createLinearGradient(300, 250, 900, 250);
  grd.addColorStop(0, "rgba(0,209,255,0)");
  grd.addColorStop(0.5, "rgba(0,209,255,0.5)");
  grd.addColorStop(1, "rgba(0,209,255,0)");
  ctx.strokeStyle = grd;
  ctx.lineWidth = 1;
  ctx.moveTo(300, 250);
  ctx.lineTo(900, 250);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "18px sans-serif";
  ctx.fillText("위 사람은 아래의 교육 과정을 성실히 이수하였으므로", 600, 310);
  ctx.fillText("이 수료증을 수여합니다.", 600, 340);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText(userName, 600, 420);

  ctx.beginPath();
  const grd2 = ctx.createLinearGradient(400, 450, 800, 450);
  grd2.addColorStop(0, "rgba(112,0,255,0)");
  grd2.addColorStop(0.5, "rgba(112,0,255,0.4)");
  grd2.addColorStop(1, "rgba(112,0,255,0)");
  ctx.strokeStyle = grd2;
  ctx.moveTo(400, 450);
  ctx.lineTo(800, 450);
  ctx.stroke();

  ctx.fillStyle = "#00D1FF";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(`과정: ${courseName}`, 600, 510);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "16px sans-serif";
  ctx.fillText(`수료일: ${completedDate}`, 600, 560);

  ctx.fillStyle = "rgba(0,209,255,0.4)";
  ctx.font = "12px monospace";
  ctx.fillText(`인증번호: ${certNumber}`, 600, 620);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "14px sans-serif";
  ctx.fillText("마이베스트 AI발명창업 교육센터", 600, 730);

  ctx.beginPath();
  const grd3 = ctx.createLinearGradient(200, 770, 1000, 770);
  grd3.addColorStop(0, "rgba(0,209,255,0)");
  grd3.addColorStop(0.5, "rgba(0,209,255,0.3)");
  grd3.addColorStop(1, "rgba(0,209,255,0)");
  ctx.strokeStyle = grd3;
  ctx.moveTo(200, 770);
  ctx.lineTo(1000, 770);
  ctx.stroke();

  const link = document.createElement("a");
  link.download = `수료증_${courseName}_${userName}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "superadmin" || user?.role === "admin";

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress[]>({ queryKey: ["/api/progress"] });
  const { data: dashStats, isLoading: dashStatsLoading, isError: dashStatsError } = useQuery<DashboardStats>({ queryKey: ["/api/dashboard/stats"] });
  const { data: userBadges, isLoading: badgesLoading } = useQuery<BadgeWithStatus[]>({ queryKey: ["/api/user/badges"] });
  const { data: inventions } = useQuery<InventionProject[]>({ queryKey: ["/api/invention-projects"], enabled: !!user });
  const { data: canvases } = useQuery<BusinessCanvas[]>({ queryKey: ["/api/business-canvases"], enabled: !!user });
  const { data: adminStats } = useQuery<{ totalUsers: number; newThisMonth: number; orgCount: number }>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  const isLoading = coursesLoading || progressLoading;
  const getProgressForCourse = (courseId: number) => progress?.find((p) => p.courseId === courseId);
  const totalCompleted = progress?.filter((p) => p.isCompleted).length || 0;
  const totalInProgress = progress?.filter((p) => !p.isCompleted && (p.completedSteps || 0) > 0).length || 0;
  const totalAiAnalysis = (dashStats?.inventionCount || 0) + (dashStats?.canvasCount || 0) + (dashStats?.diagnosticCount || 0);
  const earnedBadgeCount = userBadges?.filter((b) => b.earned).length || 0;
  const isNewUser =
    !isLoading &&
    !badgesLoading &&
    !dashStatsLoading &&
    !dashStatsError &&
    !!dashStats &&
    totalCompleted === 0 &&
    totalInProgress === 0 &&
    totalAiAnalysis === 0 &&
    earnedBadgeCount === 0;

  const firstSteps = [
    {
      step: "1",
      title: "창의성 진단 받기",
      description: "5가지 지표로 나만의 창의성 수준을 측정해보세요.",
      href: "/diagnosis?type=creativity",
      icon: Compass,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      cta: "진단 시작",
      testId: "card-first-step-diagnosis",
    },
    {
      step: "2",
      title: "AI 발명 도구 체험",
      description: "SCAMPER·TRIZ로 첫 발명 아이디어를 다듬어보세요.",
      href: "/invention-studio",
      icon: Lightbulb,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      cta: "발명 스튜디오 열기",
      testId: "card-first-step-invention",
    },
    {
      step: "3",
      title: "강좌 듣기",
      description: "발명/창업 트랙 강좌로 기본기를 쌓아보세요.",
      href: "/invention",
      icon: BookOpen,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      cta: "강좌 둘러보기",
      testId: "card-first-step-course",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center neon-glow">
              <LayoutDashboard className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-dashboard-title">
                {user?.displayName || user?.username}님의 대시보드
              </h1>
              <p className="text-muted-foreground">학습 현황과 AI 활동 기록을 확인하세요</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { label: "완료 과정", value: totalCompleted, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { label: "학습 중", value: totalInProgress, icon: BookOpen, color: "text-cyan-400", bg: "bg-cyan-500/10" },
              { label: "AI 분석", value: totalAiAnalysis, icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10" },
            ].map(({ label, value, icon: Icon, color, bg }, i) => (
              <div key={i} className="glass-card rounded-xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white" data-testid={`text-stat-value-${i}`}>{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {isAdmin && adminStats && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                회원 현황
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "전체 회원", value: adminStats.totalUsers, icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                  { label: "이번 달 신규", value: adminStats.newThisMonth, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "등록 단체", value: adminStats.orgCount, icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10" },
                ].map(({ label, value, icon: Icon, color, bg }, i) => (
                  <div key={i} className="glass-card rounded-xl p-5 flex items-center gap-4 border border-red-500/10" data-testid={`card-admin-dashboard-stat-${i}`}>
                    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p className="text-sm text-muted-foreground">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin">
                <button className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors" data-testid="link-admin-from-dashboard">
                  관리자 페이지로 이동 →
                </button>
              </Link>
            </div>
          )}

          {isNewUser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
              data-testid="section-new-user-onboarding"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">
                  추천 첫 단계 3가지
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                마이베스트 발명창업이 처음이신가요? 아래 순서대로 따라가면 어렵지 않게 시작할 수 있어요.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {firstSteps.map(({ step, title, description, href, icon: Icon, color, bg, border, cta, testId }) => (
                  <Link key={step} href={href}>
                    <div
                      className={`glass-card glass-card-hover rounded-xl p-5 cursor-pointer transition-all h-full flex flex-col border ${border}`}
                      data-testid={testId}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <span className={`text-xs font-bold ${color}`}>
                          STEP {step}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
                      <p className="text-xs text-muted-foreground mb-4 flex-1">{description}</p>
                      <div className={`inline-flex items-center text-xs font-medium ${color}`}>
                        {cta}
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {((inventions && inventions.length > 0) || (canvases && canvases.length > 0)) && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                최근 프로젝트
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {inventions?.slice(0, 3).map((p) => (
                  <Link key={`inv-${p.id}`} href={`/invention-studio?projectId=${p.id}`}>
                    <div className="glass-card glass-card-hover rounded-xl p-4 cursor-pointer transition-all group" data-testid={`card-dashboard-invention-${p.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">{p.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">{p.problem || "발명 프로젝트"}</p>
                        </div>
                        <BadgeUI variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 flex-shrink-0">이어서 작업</BadgeUI>
                      </div>
                    </div>
                  </Link>
                ))}
                {canvases?.slice(0, 3).map((c) => (
                  <Link key={`bmc-${c.id}`} href={`/startup-lab?canvasId=${c.id}`}>
                    <div className="glass-card glass-card-hover rounded-xl p-4 cursor-pointer transition-all group" data-testid={`card-dashboard-canvas-${c.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                          <Rocket className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-400 transition-colors">{c.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">{c.valueProposition || "비즈니스 캔버스"}</p>
                        </div>
                        <BadgeUI variant="outline" className="text-[10px] border-purple-500/20 text-purple-400 flex-shrink-0">이어서 작업</BadgeUI>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            나의 배지
          </h2>
          {badgesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
              {userBadges?.map((badge) => {
                const BadgeIcon = badgeIconMap[badge.icon] || Star;
                return (
                  <motion.div
                    key={badge.id}
                    className={`glass-card rounded-xl p-4 text-center transition-all ${badge.earned ? "ring-1 ring-yellow-500/30" : "opacity-40 grayscale"}`}
                    whileHover={badge.earned ? { scale: 1.05 } : undefined}
                    data-testid={`badge-card-${badge.key}`}
                  >
                    <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${badge.earned ? "bg-yellow-500/20" : "bg-white/5"}`}>
                      <BadgeIcon className={`w-5 h-5 ${badge.earned ? "text-yellow-400" : "text-gray-600"}`} />
                    </div>
                    <p className={`text-xs font-medium ${badge.earned ? "text-white" : "text-gray-500"}`}>{badge.name}</p>
                    {badge.earned && badge.awardedAt && (
                      <p className="text-[10px] text-yellow-400/60 mt-1">{new Date(badge.awardedAt).toLocaleDateString("ko-KR")}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {totalCompleted > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                수료증 발급
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {courses?.filter((c) => {
                  const p = getProgressForCourse(c.id);
                  return p?.isCompleted;
                }).map((course) => {
                  const p = getProgressForCourse(course.id)!;
                  return (
                    <div key={`cert-${course.id}`} className="glass-card rounded-xl p-4 flex items-center justify-between gap-3" data-testid={`card-certificate-${course.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{course.title}</p>
                          <p className="text-xs text-muted-foreground">수료 완료</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                        onClick={() => {
                          generateCertificate(
                            user?.displayName || user?.username || "학습자",
                            course.title,
                            p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("ko-KR") : new Date().toLocaleDateString("ko-KR")
                          );
                          toast({ title: "수료증이 다운로드됩니다" });
                        }}
                        data-testid={`button-download-cert-${course.id}`}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> 수료증
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold text-white mb-4">학습 과정</h2>
          {isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />)}</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {courses?.map((course) => {
                const p = getProgressForCourse(course.id);
                const steps = (course.steps as unknown[])?.length || 0;
                const completed = p?.completedSteps || 0;
                const percent = steps > 0 ? (completed / steps) * 100 : 0;
                const Icon = iconMap[course.icon || "lightbulb"] || BookOpen;
                return (
                  <Link key={course.id} href={`/course/${course.id}`} data-testid={`link-dashboard-course-${course.id}`}>
                    <div className="glass-card glass-card-hover rounded-xl p-5 cursor-pointer transition-all group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${course.color}20` }}>
                          <Icon className="w-5 h-5" style={{ color: course.color || undefined }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-white truncate group-hover:text-cyan-400 transition-colors">{course.title}</h3>
                          <BadgeUI variant="outline" className="text-[10px] mt-1 border-white/10 text-gray-400">
                            {course.track === "invention" ? "발명" : "창업"} · {course.level === "beginner" ? "초급" : course.level === "intermediate" ? "중급" : "고급"}
                          </BadgeUI>
                        </div>
                        {p?.isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={percent} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{completed}/{steps}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
