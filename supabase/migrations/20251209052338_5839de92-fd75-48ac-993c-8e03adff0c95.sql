-- Create table for caching popular question responses by persona
CREATE TABLE public.question_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  persona TEXT NOT NULL,
  question TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(persona, question_hash)
);

-- Enable RLS
ALTER TABLE public.question_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access for cache (no auth required)
CREATE POLICY "Anyone can read cache" ON public.question_cache FOR SELECT USING (true);

-- Create index for fast lookups
CREATE INDEX idx_question_cache_lookup ON public.question_cache(persona, question_hash);
CREATE INDEX idx_question_cache_expires ON public.question_cache(expires_at);

-- Create trigger for updated_at
CREATE TRIGGER update_question_cache_updated_at
BEFORE UPDATE ON public.question_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();