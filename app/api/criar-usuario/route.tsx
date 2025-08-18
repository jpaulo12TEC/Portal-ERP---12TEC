import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const userSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6, 'Senha precisa ter no mínimo 6 caracteres'),
  nome: z.string().min(2),
  empresa: z.string().optional(),
  cargo: z.string().optional(),
  nivelAcesso: z.string().min(2),
  telefone: z.string().optional(),
  departamento: z.string().optional(),
  fotocaminho: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Pega o token do header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado. Token não enviado.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // Valida o usuário logado via token JWT
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    // Verifica se o usuário tem nível de acesso admin
    const userRole = userData.user.user_metadata?.nivelAcesso;
    if (userRole !== 'admincompras') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem criar usuários.' }, { status: 403 });
    }

    // Valida o body
    const body = await request.json();
    const parsed = userSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, senha, nome, empresa, cargo, nivelAcesso, telefone, departamento, fotocaminho } = parsed.data;

    // Cria o usuário no Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        empresa,
        cargo,
        nivelAcesso,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Cria perfil na tabela 'profiles'
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user?.id,
        nome,
        empresa,
        cargo,
        nivel_acesso: nivelAcesso,
        email,
        telefone,
        departamento,
        fotocaminho,
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Usuário criado com sucesso!', data });
  } catch (error) {
    console.error('Erro na criação:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
