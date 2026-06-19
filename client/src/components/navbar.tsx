import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Lightbulb, Rocket, LayoutDashboard, LogOut, Menu, X, Shield, StickyNote, BookOpen, Trophy, BarChart3, ChevronDown, Wrench, GraduationCap, Sparkles, Brain, Building2, TrendingUp, Users, CreditCard } from "lucide-react";
import logoIcon from "@assets/generated_images/aihand_emblem.png";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DropdownItem {
  href: string;
  label: string;
  icon: typeof Lightbulb;
  desc: string;
}

interface NavCategory {
  label: string;
  icon: typeof Lightbulb;
  items?: DropdownItem[];
  href?: string;
  color: string;
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    label: "발명스튜디오",
    icon: Lightbulb,
    color: "cyan",
    items: [
      { href: "/invention-studio", label: "AI 발명도구", icon: Wrench, desc: "SCAMPER·TRIZ·특허 초안" },
      { href: "/invention", label: "발명 과정", icon: GraduationCap, desc: "단계별 발명 학습" },
      { href: "/inspiration", label: "영감의 전당", icon: Trophy, desc: "발명 사례와 영감" },
      { href: "/diagnosis?type=creativity", label: "창의성 진단", icon: Brain, desc: "5개 영역 창의성 평가" },
      { href: "/idea-notes", label: "My Idea 노트", icon: StickyNote, desc: "아이디어 메모·관리" },
      { href: "/community?type=invention", label: "발명 갤러리", icon: Users, desc: "발명 작품 공유·소통" },
    ],
  },
  {
    label: "창업랩",
    icon: Rocket,
    color: "purple",
    items: [
      { href: "/startup-lab", label: "AI 창업도구", icon: Wrench, desc: "BMC 캔버스·IR 피치덱" },
      { href: "/startup", label: "창업 과정", icon: GraduationCap, desc: "단계별 창업 학습" },
      { href: "/inspiration?tab=startup", label: "AI 창업 사례", icon: Sparkles, desc: "창업 성공 사례" },
      { href: "/diagnosis?type=startup", label: "창업 진단", icon: TrendingUp, desc: "5개 영역 창업 지수" },
      { href: "/idea-notes", label: "My Idea 노트", icon: StickyNote, desc: "아이디어 메모·관리" },
      { href: "/community?type=bmc", label: "창업 갤러리", icon: Users, desc: "창업 작품 공유·소통" },
    ],
  },
  {
    label: "대상별 시작",
    icon: Users,
    color: "yellow",
    href: "/audiences",
  },
  {
    label: "패키지",
    icon: CreditCard,
    color: "pink",
    href: "/pricing",
  },
  {
    label: "단체 활용 문의",
    icon: Building2,
    color: "green",
    href: "/franchise",
  },
  {
    label: "가이드",
    icon: BookOpen,
    color: "blue",
    href: "/guide",
  },
];

function DropdownMenu({ items, color, onClose }: { items: DropdownItem[]; color: string; onClose: () => void }) {
  const colorMap: Record<string, string> = {
    cyan: "hover:bg-cyan-500/10 hover:text-cyan-300",
    purple: "hover:bg-purple-500/10 hover:text-purple-300",
  };
  const iconBg: Record<string, string> = {
    cyan: "bg-cyan-500/15 text-cyan-300",
    purple: "bg-purple-500/15 text-purple-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
      style={{ background: "linear-gradient(135deg, rgba(12, 15, 35, 0.97), rgba(18, 22, 48, 0.97))", backdropFilter: "blur(24px)" }}
      data-testid="dropdown-menu"
    >
      <div className="p-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-200 transition-all ${colorMap[color] || ""}`}
              data-testid={`link-dropdown-${item.href.replace(/[/?=]/g, "-").replace(/^-/, "")}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg[color] || "bg-white/5 text-gray-300"}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-[11px] text-gray-400">{item.desc}</p>
              </div>
            </button>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

function NavCategoryButton({ cat, isActive }: { cat: NavCategory; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (cat.items) setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const colorText: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    green: "text-emerald-400 bg-emerald-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    pink: "text-pink-400 bg-pink-500/10",
  };

  const Icon = cat.icon;

  if (cat.href) {
    return (
      <Link href={cat.href} data-testid={`link-nav-${cat.label}`}>
        <button
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
            ${isActive ? colorText[cat.color] || "text-cyan-400 bg-cyan-500/10" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
        >
          <Icon className="w-4 h-4" />
          {cat.label}
        </button>
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5
          ${isActive ? colorText[cat.color] || "text-cyan-400 bg-cyan-500/10" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
        data-testid={`button-nav-${cat.label}`}
      >
        <Icon className="w-4 h-4" />
        {cat.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && cat.items && (
          <DropdownMenu items={cat.items} color={cat.color} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

interface MobilePrimaryItem {
  href: string;
  label: string;
  icon: typeof Lightbulb;
  color: string;
}

const MOBILE_PRIMARY: MobilePrimaryItem[] = [
  { href: "/invention-studio", label: "발명 AI도구", icon: Lightbulb, color: "cyan" },
  { href: "/startup-lab", label: "창업 AI도구", icon: Rocket, color: "purple" },
  { href: "/diagnosis?type=creativity", label: "진단", icon: Brain, color: "pink" },
  { href: "/idea-notes", label: "내 아이디어", icon: StickyNote, color: "yellow" },
  { href: "/pricing", label: "패키지", icon: CreditCard, color: "green" },
];

const MOBILE_MORE: MobilePrimaryItem[] = [
  { href: "/inspiration", label: "영감의 전당", icon: Trophy, color: "cyan" },
  { href: "/inspiration?tab=startup", label: "AI 창업 사례", icon: Sparkles, color: "purple" },
  { href: "/diagnosis?type=startup", label: "창업 진단", icon: TrendingUp, color: "purple" },
  { href: "/startup", label: "창업 과정", icon: GraduationCap, color: "purple" },
  { href: "/community?type=invention", label: "발명 갤러리", icon: Users, color: "cyan" },
  { href: "/community?type=bmc", label: "창업 갤러리", icon: Users, color: "purple" },
  { href: "/audiences", label: "대상별 시작", icon: Users, color: "yellow" },
  { href: "/invention", label: "강좌", icon: GraduationCap, color: "blue" },
  { href: "/franchise", label: "단체 활용 문의", icon: Building2, color: "green" },
  { href: "/guide", label: "가이드", icon: BookOpen, color: "blue" },
];

const MOBILE_COLOR_BG: Record<string, string> = {
  cyan: "bg-cyan-500/15 text-cyan-300",
  purple: "bg-purple-500/15 text-purple-300",
  yellow: "bg-yellow-500/15 text-yellow-300",
  green: "bg-emerald-500/15 text-emerald-300",
  blue: "bg-blue-500/15 text-blue-300",
  pink: "bg-pink-500/15 text-pink-300",
};

function MobilePrimaryLink({ item, active, onNavigate }: { item: MobilePrimaryItem; active: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <button
        onClick={onNavigate}
        className={`w-full min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors
          ${active ? "bg-white/10 text-white" : "text-gray-200 hover:bg-white/5"}`}
        data-testid={`link-mobile-primary-${item.href.replace(/[/?=&]/g, "-").replace(/^-/, "")}`}
      >
        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${MOBILE_COLOR_BG[item.color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="flex-1 text-left">{item.label}</span>
      </button>
    </Link>
  );
}

function MobileMoreLink({ item, active, onNavigate }: { item: MobilePrimaryItem; active: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <button
        onClick={onNavigate}
        className={`w-full min-h-[44px] px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors
          ${active ? "text-white bg-white/5" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
        data-testid={`link-mobile-more-${item.href.replace(/[/?=&]/g, "-").replace(/^-/, "")}`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
      </button>
    </Link>
  );
}

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isItemActive = (href: string) => {
    const base = href.split("?")[0];
    return location === href || (base !== "/" && location.startsWith(base));
  };

  const isCategoryActive = (cat: NavCategory): boolean => {
    if (cat.href) return location.startsWith(cat.href);
    if (cat.items) return cat.items.some((item) => location.startsWith(item.href.split("?")[0]));
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={logoIcon} alt="마이베스트 AI발명창업 로고" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]" data-testid="img-logo" />
              <span className="font-bold text-lg tracking-tight text-white">
                마이베스트 <span className="text-cyan-400">발명창업</span>
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_CATEGORIES.map((cat) => (
              <NavCategoryButton key={cat.label} cat={cat} isActive={isCategoryActive(cat)} />
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {(user.role === "superadmin" || user.role === "admin" || user.role === "group_admin") && (
                  <Link href={user.role === "superadmin" ? "/admin" : user.role === "admin" ? "/admin/members" : "/admin/group"} data-testid="link-admin">
                    <Button variant="ghost" size="sm" className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <Shield className="w-4 h-4" />
                      관리
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard" data-testid="link-dashboard">
                  <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-white hover:bg-white/5">
                    <LayoutDashboard className="w-4 h-4" />
                    대시보드
                  </Button>
                </Link>
                <span className="text-sm text-gray-400">{user.displayName || user.username}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logoutMutation.mutate()}
                  data-testid="button-logout"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/auth" data-testid="link-auth">
                <Button size="sm" className="gradient-primary text-white border-0 font-medium">
                  로그인
                </Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-400"
            onClick={() => {
              const next = !mobileOpen;
              setMobileOpen(next);
              if (!next) setMoreOpen(false);
            }}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 overflow-hidden"
            style={{ background: "linear-gradient(180deg, rgba(10, 12, 30, 0.98), rgba(14, 16, 38, 0.98))", backdropFilter: "blur(24px)" }}
          >
            <div className="px-4 py-3 space-y-1">
              {MOBILE_PRIMARY.map((item) => (
                <MobilePrimaryLink
                  key={item.href}
                  item={item}
                  active={isItemActive(item.href)}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}

              <div className="pt-2">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 flex items-center justify-between transition-colors"
                  data-testid="button-mobile-more"
                >
                  <span>더 보기</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 space-y-0.5">
                        {MOBILE_MORE.map((item) => (
                          <MobileMoreLink
                            key={item.href}
                            item={item}
                            active={isItemActive(item.href)}
                            onNavigate={() => setMobileOpen(false)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-2 border-t border-white/5">
                {user ? (
                  <>
                    {(user.role === "superadmin" || user.role === "admin" || user.role === "group_admin") && (
                      <Link href={user.role === "superadmin" ? "/admin" : user.role === "admin" ? "/admin/members" : "/admin/group"}>
                        <button
                          onClick={() => setMobileOpen(false)}
                          className="w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                        >
                          <Shield className="w-4 h-4" />
                          관리
                        </button>
                      </Link>
                    )}
                    <Link href="/dashboard">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 flex items-center gap-3"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        대시보드
                      </button>
                    </Link>
                    <button
                      onClick={() => { logoutMutation.mutate(); setMobileOpen(false); }}
                      className="w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link href="/auth">
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="w-full px-4 py-3 rounded-lg text-sm font-medium gradient-primary text-white"
                    >
                      로그인 / 회원가입
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
