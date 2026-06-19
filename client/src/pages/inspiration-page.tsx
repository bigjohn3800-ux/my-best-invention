import Navbar from "@/components/navbar";
import { motion } from "framer-motion";
import { Lightbulb, Rocket, Star, Heart, ArrowRight, Sparkles, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";

// Map any incoming level value (URL query, saved user.level, legacy seed values)
// to the audience values the kid-mode UI expects. Anything we can't recognise
// falls back to "high" so non-elementary visitors keep the standard layout.
const VALID_AUDIENCES = new Set(["elementary", "middle", "high", "university", "general"]);
const normalizeLevel = (l?: string | null): string => {
  if (!l) return "high";
  if (l === "beginner") return "elementary";
  if (l === "intermediate") return "high";
  if (l === "advanced") return "university";
  return VALID_AUDIENCES.has(l) ? l : "high";
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const studentInventors = [
  {
    name: "루이 브라유",
    age: "15세",
    invention: "점자 시스템",
    desc: "시각 장애를 가진 루이 브라유는 15세에 점자를 발명하여 전 세계 시각장애인의 삶을 완전히 바꿔놓았습니다.",
    kidDesc: "눈이 안 보였던 루이는 \"앞이 안 보여도 책을 읽고 싶어!\"라는 마음으로 점자를 만들었어요.",
    color: "cyan",
    icon: Star,
  },
  {
    name: "체스터 그린우드",
    age: "15세",
    invention: "귀마개 (Earmuffs)",
    desc: "추운 겨울 스케이트를 타다가 귀가 시려웠던 체스터는 철사와 비버 모피로 최초의 귀마개를 발명했습니다.",
    kidDesc: "겨울에 스케이트를 타다 귀가 너무 시려워서, 직접 따뜻한 귀마개를 만들었어요.",
    color: "purple",
    icon: Lightbulb,
  },
  {
    name: "프랭크 엡퍼슨",
    age: "11세",
    invention: "아이스 캔디 (Popsicle)",
    desc: "우연히 음료를 밖에 두고 얼린 것에서 영감을 받아, 전 세계적으로 사랑받는 아이스 캔디를 발명했습니다.",
    kidDesc: "마실 것을 밖에 두고 잤더니 꽝꽝 얼었어요. 그게 바로 아이스바의 시작!",
    color: "emerald",
    icon: Trophy,
  },
  {
    name: "알렉산드리아 스콧",
    age: "8세",
    invention: "Alex's Lemonade Stand",
    desc: "소아암 환자였던 알렉스는 레모네이드 판매로 소아암 연구 기금을 모금하는 사회적 발명을 시작했습니다.",
    kidDesc: "아팠던 알렉스는 \"다른 친구들도 도와주고 싶어\"라며 레모네이드를 팔아 기부를 시작했어요.",
    color: "amber",
    icon: Heart,
  },
  {
    name: "기탄잘리 라오",
    age: "15세",
    invention: "Tethys (수질 검사 장치)",
    desc: "납 오염 수질 문제를 해결하기 위해 AI 기반 수질 검사 장치를 개발하여 타임지 '올해의 아이'로 선정되었습니다.",
    kidDesc: "더러워진 물을 바로 알 수 있는 작은 장치를 만들어서 \"올해의 아이\"로 뽑혔어요.",
    color: "cyan",
    icon: Sparkles,
  },
  {
    name: "잭 앤드라카",
    age: "15세",
    invention: "췌장암 조기 진단 키트",
    desc: "기존보다 168배 빠르고 26,000배 저렴한 췌장암 조기 진단 센서를 개발하여 세계를 놀라게 했습니다.",
    kidDesc: "큰 병을 빨리 알 수 있는 검사를 발명해서 어른들도 깜짝 놀라게 했어요.",
    color: "purple",
    icon: TrendingUp,
  },
];

const aiStartupStories = [
  {
    company: "OpenAI",
    field: "생성형 AI",
    desc: "ChatGPT를 통해 인공지능 대중화를 이끌며, 교육·의료·창작 등 모든 분야에서 혁신을 만들어가고 있습니다.",
    kidDesc: "ChatGPT라는 똑똑한 AI 친구를 만들어서 누구나 AI를 쓸 수 있게 했어요.",
    metric: "기업가치 $80B+",
    color: "cyan",
  },
  {
    company: "뤼튼 (Wrtn)",
    field: "AI 콘텐츠 생성",
    desc: "한국의 대표 AI 스타트업으로 누구나 쉽게 AI를 활용할 수 있는 플랫폼을 만들어 빠르게 성장하고 있습니다.",
    kidDesc: "한국에서 만든 AI 도구예요. 글쓰기 같은 걸 AI가 도와줘요.",
    metric: "MAU 300만+",
    color: "purple",
  },
  {
    company: "미드저니 (Midjourney)",
    field: "AI 이미지 생성",
    desc: "텍스트만으로 놀라운 이미지를 생성하는 AI 도구를 만들어, 디자인과 예술의 새로운 패러다임을 열었습니다.",
    kidDesc: "글로 적기만 하면 멋진 그림을 그려주는 AI예요.",
    metric: "사용자 1600만+",
    color: "emerald",
  },
  {
    company: "Duolingo",
    field: "AI 교육",
    desc: "AI를 활용한 맞춤형 언어 학습으로, 게이미피케이션과 결합하여 전 세계 5억 명의 사용자를 확보했습니다.",
    kidDesc: "게임처럼 즐겁게 외국어를 배우는 AI 앱이에요. 5억 명이 쓰고 있어요!",
    metric: "사용자 5억+",
    color: "amber",
  },
];

function getColorClasses(color: string) {
  switch (color) {
    case "cyan": return { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", glow: "rgba(0,209,255,0.08)" };
    case "purple": return { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", glow: "rgba(112,0,255,0.08)" };
    case "emerald": return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "rgba(16,185,129,0.08)" };
    case "amber": return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "rgba(245,158,11,0.08)" };
    default: return { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", glow: "rgba(0,209,255,0.08)" };
  }
}

export default function InspirationPage() {
  const { user } = useAuth();
  const searchString = useSearch();
  // Resolve audience level from URL (?level=elementary takes priority) and
  // fall back to the user's saved default. Anything else is treated as a
  // non-elementary audience and renders the standard layout.
  const urlLevel = new URLSearchParams(searchString).get("level");
  const level = normalizeLevel(urlLevel || user?.level);
  const isKid = level === "elementary";

  return (
    <div className="min-h-screen" data-testid={isKid ? "kid-mode-active" : undefined}>
      <Navbar />

      <div className={isKid ? "kid-mode" : ""}>

      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-[radial-gradient(ellipse,rgba(0,209,255,0.10),transparent_60%)]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse,rgba(112,0,255,0.06),transparent_60%)]" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center pt-16"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium glass-card text-cyan-300 border border-cyan-500/20" data-testid="badge-inspiration">
              <Trophy className="w-3.5 h-3.5" />
              {isKid ? "🌟 영감의 전당" : "영감의 전당"}
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight" data-testid="text-inspiration-title">
            <span className="gradient-text">세상을 바꾼</span>
            <br />
            <span className="text-white">{isKid ? "어린이 발명가들" : "어린 발명가들"}</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-inspiration-subtitle">
            {isKid ? (
              <>
                나도 할 수 있어요! 어린 친구들이
                <br className="hidden sm:block" />
                만든 멋진 발명 이야기를 만나봐요.
              </>
            ) : (
              <>
                나이는 숫자에 불과합니다. 세상을 바꾼 발명과 혁신은
                <br className="hidden sm:block" />
                바로 여러분과 같은 학생들에게서 시작되었습니다.
              </>
            )}
          </motion.p>

          {isKid && (
            <motion.div variants={fadeUp} className="mt-8 max-w-xl mx-auto">
              <div className="kid-banner" data-testid="banner-kid-mode">
                <span className="text-2xl">🌟</span>
                <span>지금은 <strong>초등학생 모드</strong>예요! 친구들의 발명 이야기를 쉽게 읽어봐요.</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-student-inventors-title">
              <Lightbulb className="w-8 h-8 inline-block mr-2 text-cyan-400" />
              {isKid ? "어린 친구들이 만든 발명" : "세상을 바꾼 학생 발명가들"}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
              {isKid ? "나와 비슷한 나이의 친구들이 만든 멋진 이야기예요." : "어린 나이에 세상을 놀라게 한 발명가들의 이야기"}
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentInventors.map((inventor, idx) => {
              const colors = getColorClasses(inventor.color);
              return (
                <motion.div key={inventor.name} variants={fadeUp}>
                  <div className="glass-card glass-card-hover rounded-2xl p-6 h-full transition-all duration-300" data-testid={`card-inventor-${idx}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
                        <inventor.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{inventor.name}</h3>
                        <span className={`text-xs font-medium ${colors.text}`}>{inventor.age}에 발명</span>
                      </div>
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {inventor.invention}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isKid ? inventor.kidDesc : inventor.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-ai-startups-title">
              <Rocket className="w-8 h-8 inline-block mr-2 text-purple-400" />
              {isKid ? "AI로 멋진 일을 하는 회사들" : "AI 창업 성공 사례"}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
              {isKid ? "AI를 똑똑하게 써서 세상을 바꾸는 회사들이에요." : "인공지능으로 세상을 변화시키고 있는 기업들"}
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid md:grid-cols-2 gap-6">
            {aiStartupStories.map((story, idx) => {
              const colors = getColorClasses(story.color);
              return (
                <motion.div key={story.company} variants={fadeUp}>
                  <div className="glass-card glass-card-hover rounded-2xl p-8 h-full transition-all duration-300" data-testid={`card-startup-${idx}`}>
                    <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                      <div>
                        <h3 className="text-xl font-bold text-white">{story.company}</h3>
                        <span className={`text-sm font-medium ${colors.text}`}>{story.field}</span>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {story.metric}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isKid ? story.kidDesc : story.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-3xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 neon-glow" data-testid="section-motivation">
            <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" data-testid="text-motivation-title">
              {isKid ? "나도 할 수 있어요!" : "나도 할 수 있다!"}
            </h2>
            <p className="text-lg text-muted-foreground mb-3" data-testid="text-motivation-message">
              {isKid ? "큰 발명도 처음에는 작은 생각에서 시작했어요." : "위대한 발명은 거창한 것에서 시작되지 않습니다."}
            </p>
            <p className="text-muted-foreground mb-8">
              {isKid ? (
                <>
                  매일 “불편하네” 하고 느낀 것을 적어두기.
                  <br className="hidden sm:block" />
                  그게 바로 첫 번째 발명의 시작이에요.
                  <br className="hidden sm:block" />
                  AI 친구가 옆에서 도와줄 거예요!
                </>
              ) : (
                <>
                  일상의 불편함을 발견하고, 작은 아이디어를 키워나가는 것.
                  <br className="hidden sm:block" />
                  바로 그것이 세상을 바꾸는 발명의 시작입니다.
                  <br className="hidden sm:block" />
                  AI와 함께라면, 여러분의 아이디어는 더 빛날 수 있습니다.
                </>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={user ? (isKid ? "/invention-studio?level=elementary" : "/invention-studio") : "/auth"}>
                <Button size="lg" className="gradient-primary text-white font-semibold px-8 py-6 text-base rounded-xl" data-testid="button-motivation-invention">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  {isKid ? "✨ 발명 놀이터 가기" : "발명 시작하기"}
                </Button>
              </Link>
              <Link href={user ? (isKid ? "/startup-lab?level=elementary" : "/startup-lab") : "/auth"}>
                <Button size="lg" variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 px-8 py-6 text-base rounded-xl" data-testid="button-motivation-startup">
                  <Rocket className="w-5 h-5 mr-2" />
                  {isKid ? "🚀 창업 놀이터 가기" : "창업 도전하기"}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      </div>

      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">마이베스트 <span className="text-cyan-400">발명창업</span></span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2024 마이베스트 발명창업. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
