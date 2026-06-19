import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import { motion } from "framer-motion";
import { Heart, Lightbulb, Rocket, Plus, Trash2, Filter, Users, Calendar, Tag, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useSearch } from "wouter";

interface GalleryPostWithUser {
  id: number;
  userId: number;
  type: string;
  projectId: number | null;
  title: string;
  description: string | null;
  tags: string[] | null;
  likesCount: number;
  createdAt: string;
  user: { displayName: string | null; username: string };
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchString = useSearch();
  const urlType = new URLSearchParams(searchString).get("type");
  const [filter, setFilter] = useState<string>(urlType === "invention" || urlType === "bmc" ? urlType : "all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("invention");
  const [newTags, setNewTags] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useQuery<{ posts: GalleryPostWithUser[]; likedPostIds: number[] }>({
    queryKey: ["/api/gallery", filter, searchQuery, selectedTags.slice().sort().join(",")],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("type", filter);
      if (searchQuery) params.set("q", searchQuery);
      if (selectedTags.length > 0) params.set("tag", selectedTags.join(","));
      const url = params.toString() ? `/api/gallery?${params.toString()}` : "/api/gallery";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const posts = data?.posts || [];
  const likedPostIds = new Set(data?.likedPostIds || []);

  const { data: allData } = useQuery<{ posts: GalleryPostWithUser[]; likedPostIds: number[] }>({
    queryKey: ["/api/gallery", "tags-source"],
    queryFn: async () => {
      const res = await fetch("/api/gallery", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const availableTags = Array.from(
    new Set((allData?.posts || []).flatMap(p => p.tags || []).filter(Boolean))
  ).slice(0, 30);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedTags([]);
    setFilter("all");
  };

  const hasActiveFilters = searchInput.trim().length > 0 || selectedTags.length > 0 || filter !== "all";

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gallery", {
        type: newType,
        title: newTitle,
        description: newDesc || null,
        tags: newTags ? newTags.split(",").map(t => t.trim()).filter(Boolean) : null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "작품이 등록되었습니다!" });
      setCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewTags("");
    },
    onError: () => toast({ title: "등록 실패", variant: "destructive" }),
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, liked }: { postId: number; liked: boolean }) => {
      if (liked) {
        await apiRequest("DELETE", `/api/gallery/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/gallery/${postId}/like`);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/gallery"] }),
    onError: () => toast({ title: "좋아요 처리 실패", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/gallery/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "삭제되었습니다" });
    },
    onError: () => toast({ title: "삭제 실패", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-community-title">
                  커뮤니티 갤러리
                </h1>
                <p className="text-muted-foreground">학생들의 발명과 창업 아이디어를 만나보세요</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 glass-card rounded-lg p-1">
                {[
                  { value: "all", label: "전체" },
                  { value: "invention", label: "발명" },
                  { value: "bmc", label: "창업" },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f.value ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white"}`}
                    data-testid={`button-filter-${f.value}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {user && (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gradient-primary text-white" data-testid="button-create-post">
                      <Plus className="w-4 h-4 mr-2" />
                      작품 등록
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-white/10 text-white" data-testid="modal-create-post">
                    <DialogHeader>
                      <DialogTitle className="text-white">작품 등록하기</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm text-gray-300 mb-1.5 block">유형</label>
                        <Select value={newType} onValueChange={setNewType}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-post-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-white/10">
                            <SelectItem value="invention">발명 아이디어</SelectItem>
                            <SelectItem value="bmc">창업 BMC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-300 mb-1.5 block">제목</label>
                        <Input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="작품 제목을 입력하세요"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          data-testid="input-post-title"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-300 mb-1.5 block">설명</label>
                        <Textarea
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          placeholder="작품에 대해 설명해주세요"
                          rows={4}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          data-testid="input-post-desc"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-300 mb-1.5 block">태그 (쉼표로 구분)</label>
                        <Input
                          value={newTags}
                          onChange={(e) => setNewTags(e.target.value)}
                          placeholder="AI, 발명, 환경 등"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          data-testid="input-post-tags"
                        />
                      </div>
                      <Button
                        className="w-full gradient-primary text-white"
                        onClick={() => createMutation.mutate()}
                        disabled={!newTitle.trim() || createMutation.isPending}
                        data-testid="button-submit-post"
                      >
                        {createMutation.isPending ? "등록 중..." : "등록하기"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="제목, 본문, 작성자로 검색"
                className="pl-9 pr-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                data-testid="input-gallery-search"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  data-testid="button-clear-search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {availableTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                {availableTags.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300" : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"}`}
                      data-testid={`chip-tag-${tag}`}
                    >
                      #{tag}
                    </button>
                  );
                })}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 ml-auto"
                    data-testid="button-reset-filters"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />)}
            </div>
          ) : isError ? (
            <div className="glass-card rounded-xl p-16 text-center">
              <p className="text-red-400 text-lg mb-2">데이터를 불러오는데 실패했습니다</p>
              <Button variant="outline" className="border-white/10 text-gray-300 mt-2" onClick={() => refetch()} data-testid="button-retry-gallery">
                다시 시도
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-card rounded-xl p-16 text-center" data-testid="empty-gallery">
              <Lightbulb className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              {hasActiveFilters ? (
                <>
                  <p className="text-gray-400 text-lg mb-2">검색 결과가 없습니다</p>
                  <p className="text-gray-500 text-sm mb-4">다른 키워드나 태그로 다시 시도해보세요</p>
                  <Button variant="outline" className="border-white/10 text-gray-300" onClick={resetFilters} data-testid="button-reset-filters-empty">
                    필터 초기화
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-400 text-lg mb-2">아직 등록된 작품이 없습니다</p>
                  <p className="text-gray-500 text-sm">첫 번째 작품을 등록해보세요!</p>
                  {!user && (
                    <Link href="/auth">
                      <Button className="gradient-primary text-white mt-4" data-testid="button-login-to-post">
                        로그인하고 등록하기
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post, i) => {
                const isLiked = likedPostIds.has(post.id);
                const isOwner = user?.id === post.userId;
                return (
                  <motion.div
                    key={post.id}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="glass-card glass-card-hover rounded-xl p-5 h-full flex flex-col" data-testid={`card-gallery-${post.id}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${post.type === "invention" ? "bg-cyan-500/10" : "bg-purple-500/10"}`}>
                            {post.type === "invention"
                              ? <Lightbulb className="w-4 h-4 text-cyan-400" />
                              : <Rocket className="w-4 h-4 text-purple-400" />
                            }
                          </div>
                          <span className={`text-xs font-medium ${post.type === "invention" ? "text-cyan-400" : "text-purple-400"}`}>
                            {post.type === "invention" ? "발명" : "창업"}
                          </span>
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => deleteMutation.mutate(post.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                            data-testid={`button-delete-post-${post.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-white mb-2 line-clamp-2" data-testid={`text-post-title-${post.id}`}>
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-3 flex-1">{post.description}</p>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.map((tag, ti) => (
                            <span key={ti} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {(post.user.displayName || post.user.username).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-400">{post.user.displayName || post.user.username}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                          <button
                            onClick={() => {
                              if (!user) {
                                toast({ title: "로그인이 필요합니다", variant: "destructive" });
                                return;
                              }
                              likeMutation.mutate({ postId: post.id, liked: isLiked });
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${isLiked ? "bg-red-500/10 text-red-400" : "hover:bg-white/5 text-gray-400"}`}
                            data-testid={`button-like-${post.id}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-400" : ""}`} />
                            <span className="text-xs">{post.likesCount}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
