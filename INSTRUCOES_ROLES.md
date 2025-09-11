# Configuração de Roles no Sistema

## Como Funciona

O sistema agora verifica o role do usuário na tabela `usuarios` do Supabase antes de permitir acesso aos dados dos pacientes.

### Roles Permitidos
- `admin` - Administrador
- `super_admin` - Super Administrador  
- `doctor` - Médico

### Roles Bloqueados
- `user` - Usuário comum (recepção)
- Qualquer outro role não listado acima

## Como Configurar no Supabase

### 1. Verificar se o usuário existe na tabela `usuarios`

```sql
SELECT * FROM usuarios WHERE email = 'email@exemplo.com';
```

### 2. Inserir usuário na tabela `usuarios` (se não existir)

```sql
INSERT INTO usuarios (id, email, nome_completo, role, clinica_id)
VALUES (
  'uuid-do-usuario-auth', 
  'email@exemplo.com', 
  'Nome Completo', 
  'doctor', 
  1
);
```

### 3. Atualizar role de usuário existente

```sql
UPDATE usuarios 
SET role = 'doctor' 
WHERE email = 'email@exemplo.com';
```

### 4. Verificar roles de todos os usuários

```sql
SELECT email, nome_completo, role, clinica_id 
FROM usuarios 
ORDER BY role, email;
```

## Comportamento do Sistema

### Login
- ✅ **Funciona normalmente** - qualquer usuário autenticado pode fazer login
- ✅ **Não bloqueia** - o login continua funcionando como antes

### Dashboard
- ✅ **Acesso liberado** - todos os usuários logados podem acessar o dashboard
- ✅ **Mostra role do usuário** - exibe o role atual do usuário logado no header e na página
- ⚠️ **Busca de pacientes** - apenas usuários com roles `admin`, `super_admin` ou `doctor` podem buscar pacientes
- ❌ **Usuários sem permissão** - veem uma mensagem de "Acesso Restrito" no lugar da barra de busca

### Página de Paciente
- ✅ **Acesso direto** - apenas usuários com roles permitidos podem acessar
- ❌ **Usuários sem permissão** - são redirecionados para o dashboard com mensagem de "Acesso Negado"

### Verificação de Role
- ✅ **Automática** - o sistema verifica automaticamente o role do usuário após o login
- ✅ **Visual** - o role é exibido visualmente no header e na página principal
- ✅ **Tempo real** - a verificação acontece a cada carregamento da página

## Exemplo de Configuração

```sql
-- Médico
UPDATE usuarios SET role = 'doctor' WHERE email = 'medico@clinica.com';

-- Administrador
UPDATE usuarios SET role = 'admin' WHERE email = 'admin@clinica.com';

-- Recepção (não terá acesso aos pacientes)
UPDATE usuarios SET role = 'user' WHERE email = 'recepcao@clinica.com';
```

## Testando

### 1. Verificar Role do Usuário
1. Faça login com qualquer usuário
2. No dashboard, você deve ver:
   - Seu role exibido no header (canto superior direito)
   - Uma badge colorida na página principal mostrando seu role
   - Status de "Acesso liberado" ou "Acesso restrito"

### 2. Testar Acesso de Médico/Admin
1. Faça login com um usuário que tem role `doctor`, `admin` ou `super_admin`
2. Você deve ver:
   - Badge verde/azul/roxo com o role
   - "Acesso liberado" na página
   - Barra de busca funcionando normalmente
   - Poder acessar páginas de pacientes

### 3. Testar Acesso Restrito
1. Faça login com um usuário que tem role `user` ou outro
2. Você deve ver:
   - Badge cinza com "Recepção" ou o role atual
   - "Acesso restrito" na página
   - Mensagem de "Acesso Restrito" no lugar da barra de busca
   - Se tentar acessar uma página de paciente diretamente, será redirecionado

### 4. Verificar Mudanças de Role
1. Altere o role de um usuário no Supabase
2. Faça logout e login novamente
3. O novo role deve aparecer automaticamente
