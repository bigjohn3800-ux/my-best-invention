import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Eye, EyeOff, ArrowLeft } from "lucide-react";
import logoIcon from "@assets/generated_images/aihand_emblem.png";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(2, "아이디는 2자 이상이어야 합니다"),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
});

const registerSchema = z.object({
  username: z.string().min(2, "아이디는 2자 이상이어야 합니다"),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
  displayName: z.string().optional(),
  schoolName: z.string().optional(),
  gradeLevel: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const GRADE_OPTIONS = [
  { value: "elementary", label: "초등학생" },
  { value: "middle", label: "중학생" },
  { value: "high", label: "고등학생" },
  { value: "university", label: "대학생" },
  { value: "general", label: "일반/성인" },
];

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [youthAgreed, setYouthAgreed] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [gradeLevel, setGradeLevel] = useState<string>("");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", displayName: "", schoolName: "", gradeLevel: "" },
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = (data: LoginForm) => { loginMutation.mutate(data); };
  const handleRegister = (data: RegisterForm) => {
    registerMutation.mutate({
      ...data,
      gradeLevel: gradeLevel || data.gradeLevel || null,
      isMinor,
      ageConfirmed,
      termsAgreed,
      privacyAgreed,
      youthPolicyAgreed: youthAgreed,
      parentalConsent: isMinor,
      parentEmail: isMinor ? parentEmail.trim() : null,
    } as any);
  };

  const baseConsentOk = termsAgreed && privacyAgreed && youthAgreed;
  const adultPathOk = !isMinor && ageConfirmed;
  const minorPathOk = isMinor && /.+@.+\..+/.test(parentEmail.trim());
  const canSubmit = baseConsentOk && (adultPathOk || minorPathOk);

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link href="/" data-testid="link-home">
            <div className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer mb-6">
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </div>
          </Link>
          <Link href="/" data-testid="link-home-logo">
            <div className="flex items-center gap-2 mb-8 w-fit cursor-pointer">
              <img src={logoIcon} alt="마이베스트 AI발명창업 로고" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]" />
              <span className="font-bold text-lg text-white">마이베스트 <span className="text-cyan-400">발명창업</span></span>
            </div>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-auth-title">
            {isLogin ? "로그인" : "회원가입"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isLogin
              ? "계정에 로그인하여 AI 도구와 학습 기록을 이용하세요"
              : "새 계정을 만들어 AI 기반 발명·창업 도구를 활용하세요"}
          </p>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <Label htmlFor="login-username" className="text-gray-300">아이디</Label>
                <Input id="login-username" {...loginForm.register("username")} placeholder="아이디를 입력하세요" className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500" data-testid="input-login-username" />
                {loginForm.formState.errors.username && <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.username.message}</p>}
              </div>
              <div>
                <Label htmlFor="login-password" className="text-gray-300">비밀번호</Label>
                <div className="relative mt-1.5">
                  <Input id="login-password" type={showPassword ? "text" : "password"} {...loginForm.register("password")} placeholder="비밀번호를 입력하세요" className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" data-testid="input-login-password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full gradient-primary text-white h-11" disabled={loginMutation.isPending} data-testid="button-login">
                {loginMutation.isPending ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <Label htmlFor="register-username" className="text-gray-300">아이디</Label>
                <Input id="register-username" {...registerForm.register("username")} placeholder="사용할 아이디를 입력하세요" className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500" data-testid="input-register-username" />
                {registerForm.formState.errors.username && <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.username.message}</p>}
              </div>
              <div>
                <Label htmlFor="register-displayName" className="text-gray-300">이름 (선택)</Label>
                <Input id="register-displayName" {...registerForm.register("displayName")} placeholder="표시될 이름을 입력하세요" className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500" data-testid="input-register-displayname" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="register-school" className="text-gray-300">학교/기관 (선택)</Label>
                  <Input id="register-school" {...registerForm.register("schoolName")} placeholder="예) 마이베스트초등" className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500" data-testid="input-register-school" />
                </div>
                <div>
                  <Label htmlFor="register-grade" className="text-gray-300">학년 단계</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger id="register-grade" className="mt-1.5 bg-white/5 border-white/10 text-white" data-testid="select-register-grade">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10 text-white">
                      {GRADE_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="register-password" className="text-gray-300">비밀번호</Label>
                <div className="relative mt-1.5">
                  <Input id="register-password" type={showPassword ? "text" : "password"} {...registerForm.register("password")} placeholder="비밀번호를 입력하세요" className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" data-testid="input-register-password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.password.message}</p>}
              </div>

              <div className="space-y-2.5 pt-1 border-t border-white/5 mt-2 pt-4">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={isMinor} onChange={(e) => { setIsMinor(e.target.checked); if (e.target.checked) setAgeConfirmed(false); }} className="mt-0.5 accent-cyan-500" data-testid="input-is-minor" />
                  <span className="text-xs text-gray-300 group-hover:text-white leading-relaxed">
                    저는 만 14세 미만이며, 보호자가 함께 가입을 도와주고 있습니다
                  </span>
                </label>
                {isMinor ? (
                  <div className="ml-6 mt-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <Label htmlFor="parent-email" className="text-xs text-yellow-300">보호자 이메일 (필수)</Label>
                    <Input id="parent-email" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@example.com" className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm h-9" data-testid="input-parent-email" />
                    <p className="text-[11px] text-yellow-300/70 mt-1.5 leading-relaxed">
                      만 14세 미만 가입 시 「개인정보 보호법」에 따라 보호자(법정대리인) 동의가 필요합니다. 입력하신 이메일로 동의 안내가 발송될 수 있습니다.
                    </p>
                  </div>
                ) : (
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-0.5 accent-cyan-500" data-testid="input-age-confirm" />
                    <span className="text-xs text-gray-400 group-hover:text-gray-300 leading-relaxed">만 14세 이상입니다 (필수)</span>
                  </label>
                )}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} className="mt-0.5 accent-cyan-500" data-testid="input-terms-agree" />
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 leading-relaxed">
                    <Link href="/legal/terms"><span className="text-cyan-400 hover:underline">이용약관</span></Link>에 동의합니다 (필수)
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} className="mt-0.5 accent-cyan-500" data-testid="input-privacy-agree" />
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 leading-relaxed">
                    <Link href="/legal/privacy"><span className="text-cyan-400 hover:underline">개인정보처리방침</span></Link>에 동의합니다 (필수)
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={youthAgreed} onChange={(e) => setYouthAgreed(e.target.checked)} className="mt-0.5 accent-cyan-500" data-testid="input-youth-agree" />
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 leading-relaxed">
                    <Link href="/legal/youth"><span className="text-cyan-400 hover:underline">청소년보호방침</span></Link> 및 AI 윤리 고지를 확인하였습니다 (필수)
                  </span>
                </label>
              </div>
              <Button type="submit" className="w-full gradient-primary text-white h-11" disabled={registerMutation.isPending || !canSubmit} data-testid="button-register">
                {registerMutation.isPending ? "가입 중..." : "회원가입"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-cyan-400 transition-colors" data-testid="button-toggle-auth">
              {isLogin ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
            </button>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden gradient-primary">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative flex flex-col items-center justify-center p-12 text-white">
          <div className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center mb-8">
            <Sparkles className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-center mb-4" data-testid="text-auth-hero-title">
            마이베스트
            <br />
            AI발명창업
          </h2>
          <p className="text-white/80 text-center max-w-sm leading-relaxed">
            SCAMPER · TRIZ · 특허 명세서 · BMC · IR 피칭덱
            AI가 함께하는 체계적인 발명·창업 교육
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
            {[
              { label: "AI 발명 스튜디오", desc: "SCAMPER · TRIZ" },
              { label: "AI 창업 랩", desc: "BMC · IR 피칭" },
              { label: "진단 솔루션", desc: "레이더 차트" },
              { label: "수준별 교육", desc: "초급~고급" },
            ].map(({ label, desc }, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-white/60 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
