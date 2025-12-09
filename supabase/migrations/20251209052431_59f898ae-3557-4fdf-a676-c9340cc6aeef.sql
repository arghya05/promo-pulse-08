-- Allow service role to manage cache (edge functions use service role key)
CREATE POLICY "Service role can manage cache" ON public.question_cache
FOR ALL USING (true) WITH CHECK (true);