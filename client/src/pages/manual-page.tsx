import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import { motion } from "framer-motion";
import { BookOpen, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export default function ManualPage() {
  const { data, isLoading, isError } = useQuery<{ content: string }>({
    queryKey: ["/api/manual/content"],
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-manual-title">
                  사용자 매뉴얼
                </h1>
                <p className="text-muted-foreground">플랫폼의 모든 기능을 안내합니다</p>
              </div>
            </div>
            <a href="/api/manual/download" download>
              <Button
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                data-testid="button-download-manual"
              >
                <Download className="w-4 h-4 mr-2" /> 매뉴얼 다운로드
              </Button>
            </a>
          </div>

          <div className="glass-card rounded-2xl p-6 sm:p-10">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <p className="text-red-400 text-lg">매뉴얼을 불러올 수 없습니다</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm sm:prose-base max-w-none
                prose-headings:text-white prose-h1:text-2xl prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-4
                prose-h2:text-cyan-400 prose-h2:text-xl prose-h2:mt-10
                prose-h3:text-purple-400 prose-h3:text-lg
                prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white
                prose-table:border-collapse
                prose-th:bg-white/5 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-gray-300 prose-th:border prose-th:border-white/10
                prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-white/10 prose-td:text-gray-300
                prose-code:text-cyan-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-hr:border-white/10" data-testid="text-manual-content">
                <ReactMarkdown>{data?.content || ""}</ReactMarkdown>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
