const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface Background {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
}

const BUCKET_NAME = "background";

export const BACKGROUNDS: Background[] = [
  {
    id: "none",
    name: "None",
    imageUrl: "",
    thumbnailUrl: "",
  },
  {
    id: "demon-slayer-1",
    name: "Demon Slayer 1",
    imageUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/demon-slayer-1.jpg`,
    thumbnailUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/demon-slayer-1.jpg`,
  },
  {
    id: "demon-slayer-2",
    name: "Demon Slayer 2",
    imageUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/demon-slayer-2.jpg`,
    thumbnailUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/demon-slayer-2.jpg`,
  },
  {
    id: "demon-slayer-3",
    name: "Demon Slayer 3",
    imageUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/demon-slayer-3.jpg`,
    thumbnailUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/demon-slayer-3.jpg`,
  },
  {
    id: "demon-slayer-4",
    name: "Demon Slayer 4",
    imageUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/demon-slayer-4.jpg`,
    thumbnailUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/demon-slayer-4.jpg`,
  },
];

export const getBackgroundById = (
  id: string | null
): Background | undefined => {
  if (!id) return BACKGROUNDS[0]; // Return 'none' if no background selected
  return BACKGROUNDS.find((bg) => bg.id === id);
};
