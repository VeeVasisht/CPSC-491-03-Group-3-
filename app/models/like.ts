export interface Like {
  postId: string;
  userId: string;
  likedAt: number;
}

export interface LikeState {
  isLiked: boolean;
  likeCount: number;
}