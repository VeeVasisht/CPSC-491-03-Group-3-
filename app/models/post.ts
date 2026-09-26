import { Timestamp } from "firebase/firestore";

export interface Post {
  id: string;
  authorId: string;

  title: string;
  description: string;
  imageUrl: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatePostData {
  title: string;
  description: string;
  image: File;
}
