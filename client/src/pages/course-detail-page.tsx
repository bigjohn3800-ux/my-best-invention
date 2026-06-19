import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Lightbulb, Rocket, ArrowLeft, CheckCircle2, Circle, Lock, ChevronDown, ChevronUp, BookOpen, Zap, Award, TrendingUp, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Course, CourseStep, UserProgress } from "@shared/schema";
import { useState } from "react";
import confetti from "canvas-confetti";
import ReactMarkdown from "react-markdown";

const iconMap: Record<string, any> = {
  lightbulb: Lightbulb, zap: Zap, award: Award, rocket: Rocket, "trending-up": TrendingUp, briefcase: Briefcase,
};
const levelLabels: Record<string, string> = { beginner: "초급", intermediate: "중급", advanced: "고급" };

export default function CourseDetailPage() {
  const [, params] = useRoute("/course/:id");
  const courseId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  const { data: course, isLoading } = useQuery<Course>({ queryKey: ["/api/courses", courseId] });
  const { data: allProgress } = useQuery<UserProgress[]>({ queryKey: ["/api/progress"], enabled: !!user });

  const progress = allProgress?.find((p) => p.courseId === courseId);
  const steps = (course?.steps as CourseStep[]) || [];
  const completedSteps = progress?.completedSteps || 0;
  const progressPercent = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  const progressMutation = useMutation({
    mutationFn: async (stepIndex: number) => {
      const res = await apiRequest("POST", "/api/progress", {
        courseId, completedSteps: stepIndex + 1, totalSteps: steps.length, isCompleted: stepIndex + 1 >= steps.length,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      if (data?.newBadge) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast({ title: `🏆 배지 획득: ${data.newBadge.name}`, description: "대시보드에서 배지를 확인하세요!" });
        queryClient.invalidateQueries({ queryKey: ["/api/user/badges"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-32 space-y-6">
          <Skeleton className="h-12 w-96 bg-white/5" />
          <Skeleton className="h-6 w-full bg-white/5" />
          <Skeleton className="h-64 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  const Icon = iconMap[course.icon || "lightbulb"] || BookOpen;
  const isInvention = course.track === "invention";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href={`/${course.track === "invention" ? "invention" : "startup"}`}>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-8" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
              {isInvention ? "발명 과정" : "창업 과정"}으로 돌아가기
            </button>
          </Link>

          <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${course.color}20` }}>
              <Icon className="w-8 h-8" style={{ color: course.color || undefined }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-xs border-white/10 text-gray-400">{levelLabels[course.level]}</Badge>
                <span className="text-sm text-muted-foreground">{steps.length}개 학습 단계</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-course-detail-title">{course.title}</h1>
              <p className="text-muted-foreground mt-2" data-testid="text-course-detail-desc">{course.description}</p>
            </div>
          </div>

          {user && (
            <div className="mb-10 p-4 rounded-xl glass-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">학습 진행률</span>
                <span className="text-sm text-muted-foreground" data-testid="text-progress">{completedSteps}/{steps.length} 완료</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCompleted = user ? index < completedSteps : false;
              const isCurrent = user ? index === completedSteps : index === 0;
              const isExpanded = expandedStep === index;

              return (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <div className={`glass-card rounded-xl transition-all duration-200 ${
                    isCompleted ? "border border-emerald-500/30" :
                    isCurrent ? "border border-cyan-500/30 neon-glow" :
                    ""
                  }`}>
                    <button className="w-full text-left" onClick={() => setExpandedStep(isExpanded ? null : index)} data-testid={`button-step-${index}`}>
                      <div className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            ) : isCurrent ? (
                              <div className="w-6 h-6 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                              </div>
                            ) : (
                              <Circle className="w-6 h-6 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono">{String(index + 1).padStart(2, "0")}</span>
                              <h3 className={`font-semibold ${isCompleted ? "text-emerald-400" : "text-white"}`}>{step.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-5 pb-5">
                        <div className="ml-10 pt-4 border-t border-white/5">
                          <div className="prose prose-invert prose-sm max-w-none mb-4 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:p-2 [&_th]:border [&_th]:border-white/10 [&_th]:bg-white/5 [&_td]:p-2 [&_td]:border [&_td]:border-white/10 [&_pre]:bg-white/5 [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-cyan-300 [&_strong]:text-white [&_h2]:text-base [&_h2]:mt-4 [&_h3]:text-sm [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_p]:my-2" data-testid={`text-step-content-${index}`}>
                            <ReactMarkdown>{step.content}</ReactMarkdown>
                          </div>
                          {user && !isCompleted && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); progressMutation.mutate(index); }}
                              disabled={progressMutation.isPending}
                              className="gap-2 gradient-primary text-white"
                              data-testid={`button-complete-step-${index}`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {isCurrent ? "학습 완료" : "완료 표시"}
                            </Button>
                          )}
                          {!user && (
                            <Link href="/auth">
                              <Button size="sm" variant="outline" className="gap-2 border-white/10 text-gray-400">
                                <Lock className="w-4 h-4" />
                                로그인하여 진행 기록하기
                              </Button>
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
