// app/types/physics.ts
export interface Category {
  id: string;
  name: string;
  icon_name: string;
  bg_class: string;
  color_class: string;
  sort_order: number;
}

export interface Simulation {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  worksheet_url: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  user_id: string;
}