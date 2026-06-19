import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, UserPlus } from "lucide-react";
import { Link } from "wouter";

interface GuestSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GuestSignupModal({ open, onOpenChange }: GuestSignupModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-white/10 text-white" data-testid="modal-guest-signup">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 neon-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-xl text-white">
            무료 체험이 끝났습니다
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 mt-2">
            비회원은 AI 도구를 2회까지 무료로 체험할 수 있습니다.
            회원가입하면 모든 AI 도구를 무제한으로 이용할 수 있어요!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Link href="/auth">
            <Button
              className="w-full gradient-primary text-white h-12 text-base font-medium"
              onClick={() => onOpenChange(false)}
              data-testid="button-signup-from-modal"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              무료 회원가입
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-signup-modal"
          >
            나중에 하기
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {[
            "AI 발명 도구 무제한 이용",
            "프로젝트 저장 및 관리",
            "학습 진도 추적",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {benefit}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
