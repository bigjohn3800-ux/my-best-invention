import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-4">
        <AlertCircle className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">404</h1>
        <p className="text-muted-foreground mb-6">페이지를 찾을 수 없습니다</p>
        <Link href="/">
          <Button className="gradient-primary text-white" data-testid="button-go-home">홈으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}
