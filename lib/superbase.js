import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iiuxilqvkfmpdfgcahnq.supabase.co'; // Substitua com sua URL do Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdXhpbHF2a2ZtcGRmZ2NhaG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjI1MzMsImV4cCI6MjA1NjIzODUzM30.-PhUnmlu2k3dAQ1T_neF342GhL-_NN27yGaM9J_YC5s'; // Substitua com sua chave pública

export const supabase = createClient(supabaseUrl, supabaseKey);