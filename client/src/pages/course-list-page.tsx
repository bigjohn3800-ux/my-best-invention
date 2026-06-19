import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Lightbulb, Rocket, BookOpen, Zap, Award, TrendingUp, Briefcase, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/navbar";
import type { Course } from "@shared/schema";

const iconMap: Record<string, any> = {
  lightbulb: Lightbulb, zap: Zap, award: Award, rocket: Rocket, "trending-up": TrendingUp, briefcase: Briefcase,
};

const levelLabels: Record<string, string> = { beginner: "초급", intermediate: "중급", advanced: "고급" };
const levelDescriptions: Record<string, string> = { beginner: "초등학생", intermediate: "중·고등학생", advanced: "대학생·일반인" };

export default function CourseListPage({ track }: { track: "invention" | "startup" }) {
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses", `?track=${track}`],
  });

  const isInvention = track === "invention";
  const trackTitle = isInvention ? "발명 과정" : "창업 과정";
  const trackDescription = isInvention
    ? "아이디어 발상부터 특허 출원까지, 단계별로 발명 역량을 키워보세요"
    : "사업 아이디어부터 투자 유치까지, 실전 창업 과정을 체험하세요";
  const TrackIcon = isInvention ? Lightbulb : Rocket;

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative pt-24 pb-12 overflow-hidden px-4">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full ${isInvention ? "bg-[radial-gradient(ellipse,rgba(0,209,255,0.08),transparent_60%)]" : "bg-[radial-gradient(ellipse,rgba(112,0,255,0.08),transparent_60%)]"}`} />
        <div className="relative max-w-5xl mx-auto pt-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`inline-flex w-16 h-16 rounded-2xl ${isInvention ? "bg-cyan-500/10" : "bg-purple-500/10"} items-center justify-center mb-6`}>
              <TrackIcon className={`w-8 h-8 ${isInvention ? "text-cyan-400" : "text-purple-400"}`} />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white" data-testid="text-track-title">{trackTitle}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-track-description">{trackDescription}</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="space-y-6">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl bg-white/5" />)}</div>
          ) : (
            <div className="space-y-6">
              {courses?.map((course, i) => {
                const Icon = iconMap[course.icon || "lightbulb"] || BookOpen;
                return (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Link href={`/course/${course.id}`} data-testid={`link-course-${course.id}`}>
                      <div className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer transition-all group">
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-48 h-32 sm:h-auto flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${course.color}15` }}>
                            <Icon className="w-12 h-12 group-hover:scale-110 transition-transform duration-300" style={{ color: course.color || undefined }} />
                          </div>
                          <div className="p-6 sm:p-8 flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge variant="outline" className="text-xs font-medium border-white/10 text-gray-400" data-testid={`badge-level-${course.id}`}>
                                {levelLabels[course.level]} · {levelDescriptions[course.level]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{(course.steps as any[])?.length || 0}개 학습 단계</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors" data-testid={`text-course-title-${course.id}`}>
                              {course.title}
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4" data-testid={`text-course-desc-${course.id}`}>
                              {course.description}
                            </p>
                            <div className={`flex items-center gap-2 text-sm font-medium ${isInvention ? "text-cyan-400" : "text-purple-400"}`}>
                              과정 시작하기
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
