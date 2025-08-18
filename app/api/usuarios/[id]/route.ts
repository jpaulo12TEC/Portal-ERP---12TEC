// app/api/usuarios/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  const user_metadata = data.user?.user_metadata || {}

  const nome = user_metadata.nome || 'Nome não disponível'
  const empresa = user_metadata.empresa || 'Empresa não disponível'
  const cargo = user_metadata.cargo || 'Cargo não disponível'
  const nivelAcesso = user_metadata.nivelAcesso || 'Nível de acesso não disponível'

  return NextResponse.json({ nome, empresa, cargo, nivelAcesso })
}
