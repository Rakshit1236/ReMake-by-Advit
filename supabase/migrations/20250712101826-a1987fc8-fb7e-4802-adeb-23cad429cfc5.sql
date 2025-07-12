-- Create enum types for better data consistency
CREATE TYPE public.item_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.item_condition AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE public.item_category AS ENUM ('men', 'women', 'kids', 'unisex');
CREATE TYPE public.swap_status AS ENUM ('pending', 'accepted', 'completed', 'cancelled');
CREATE TYPE public.exchange_type AS ENUM ('direct_swap', 'point_redemption');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  email TEXT NOT NULL,
  points INTEGER DEFAULT 100, -- Starting points for new users
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category public.item_category NOT NULL,
  size TEXT,
  condition public.item_condition NOT NULL,
  point_value INTEGER DEFAULT 10,
  status public.item_status DEFAULT 'pending',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create item_images table for multiple images per item
CREATE TABLE public.item_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create swaps table for tracking exchanges
CREATE TABLE public.swaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  offered_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL, -- NULL for point redemptions
  exchange_type public.exchange_type NOT NULL,
  points_used INTEGER DEFAULT 0,
  status public.swap_status DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage buckets for item images
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for items
CREATE POLICY "Anyone can view approved items" ON public.items FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.items FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for item_images
CREATE POLICY "Anyone can view item images" ON public.item_images FOR SELECT USING (true);
CREATE POLICY "Users can manage images for own items" ON public.item_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.items WHERE items.id = item_images.item_id AND items.user_id = auth.uid())
);

-- RLS Policies for swaps
CREATE POLICY "Users can view own swaps" ON public.swaps FOR SELECT USING (
  auth.uid() = requester_id OR auth.uid() = owner_id
);
CREATE POLICY "Users can create swaps" ON public.swaps FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own swaps" ON public.swaps FOR UPDATE USING (
  auth.uid() = requester_id OR auth.uid() = owner_id
);

-- Storage policies for item images
CREATE POLICY "Anyone can view item images" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');
CREATE POLICY "Authenticated users can upload item images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'item-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update own uploaded images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own uploaded images" ON storage.objects FOR DELETE USING (
  bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_swaps_updated_at BEFORE UPDATE ON public.swaps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.swaps;
ALTER TABLE public.items REPLICA IDENTITY FULL;
ALTER TABLE public.swaps REPLICA IDENTITY FULL;