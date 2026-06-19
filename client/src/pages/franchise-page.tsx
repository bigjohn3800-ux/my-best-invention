import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Users, GraduationCap, CheckCircle2, Send, Shield, Zap, BookOpen, Award, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const benefits = [
  { icon: GraduationCap, title: "맞춤 커리큘럼", desc: "기관 수준에 맞는 발명·창업 교육 과정을 설계해드립니다", color: "cyan" },
  { icon: Users, title: "단체 관리 시스템", desc: "학생/회원 관리, 학습 현황 모니터링, 성과 리포트 제공", color: "purple" },
  { icon: Shield, title: "전용 관리자 계정", desc: "단체 관리자 권한으로 소속 회원을 직접 관리할 수 있습니다", color: "emerald" },
  { icon: Zap, title: "AI 도구 무제한", desc: "소속 회원 전원 AI 발명·창업 도구 무제한 이용", color: "amber" },
  { icon: BookOpen, title: "교재 연동", desc: "출간 교재와 연계된 체계적인 블렌디드 러닝 지원", color: "blue" },
  { icon: Award, title: "수료증 발급", desc: "과정 완료 시 디지털 수료증/활동증명서 자동 발급", color: "rose" },
];

export default function FranchisePage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    organizationName: "",
    contactName: "",
    phone: "",
    email: "",
    expectedMembers: "",
    message: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/franchise", form);
      return await res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "신청이 완료되었습니다!", description: "담당자가 빠른 시일 내에 연락드리겠습니다." });
    },
    onError: () => {
      toast({ title: "신청 중 오류가 발생했습니다", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organizationName || !form.contactName || !form.phone || !form.email) {
      toast({ title: "필수 항목을 입력해주세요", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  const colorMap: Record<string, { bg: string; text: string }> = {
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-400" },
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(112,0,255,0.1),transparent_60%)]" />

        <motion.div className="relative z-10 max-w-4xl mx-auto text-center pt-12" initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium glass-card text-purple-300 border border-purple-500/20">
              <Building2 className="w-3.5 h-3.5" />
              단체/기관 전용
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight" data-testid="text-franchise-title">
            <span className="gradient-text">단체 활용</span>
            <span className="text-white"> 문의</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-franchise-subtitle">
            학교, 학원, 교육기관, 기업 등 단체를 위한
            <br className="hidden sm:block" />
            맞춤형 AI 발명·창업 교육 프로그램을 제공합니다
          </motion.p>
        </motion.div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-white mb-3">단체 활용 혜택</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground">단체로 활용하시면 다양한 혜택을 누리실 수 있습니다</motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <motion.div key={i} variants={fadeUp} className="glass-card rounded-2xl p-6" data-testid={`card-benefit-${i}`}>
                <div className={`w-12 h-12 rounded-xl ${colorMap[b.color].bg} flex items-center justify-center mb-4`}>
                  <b.icon className={`w-6 h-6 ${colorMap[b.color].text}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4" id="apply">
        <div className="max-w-2xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-white mb-3 text-center">단체 활용 문의</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-8">아래 양식을 작성해주시면 빠른 시일 내에 연락드리겠습니다</motion.p>

            {submitted ? (
              <motion.div variants={fadeUp} className="glass-card rounded-2xl p-12 text-center" data-testid="franchise-success">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">신청이 완료되었습니다!</h3>
                <p className="text-muted-foreground">담당자가 입력하신 연락처로 빠른 시일 내에 연락드리겠습니다.</p>
              </motion.div>
            ) : (
              <motion.form variants={fadeUp} onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5" data-testid="form-franchise">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">기관/단체명 *</label>
                  <Input
                    value={form.organizationName}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                    placeholder="예: OO초등학교, OO학원"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    data-testid="input-org-name"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">담당자명 *</label>
                    <Input
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      placeholder="홍길동"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">예상 인원</label>
                    <Input
                      value={form.expectedMembers}
                      onChange={(e) => setForm({ ...form, expectedMembers: e.target.value })}
                      placeholder="30"
                      type="number"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      data-testid="input-expected-members"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> 연락처 *</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="010-1234-5678"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> 이메일 *</label>
                    <Input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      type="email"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">문의 내용</label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="교육 대상, 기간, 기타 요청사항 등을 자유롭게 적어주세요"
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                    data-testid="textarea-message"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gradient-primary text-white font-semibold rounded-xl"
                  disabled={mutation.isPending}
                  data-testid="button-submit-franchise"
                >
                  {mutation.isPending ? "전송 중..." : <><Send className="w-4 h-4 mr-2" /> 문의하기</>}
                </Button>
              </motion.form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
