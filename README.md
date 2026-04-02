# 🎮 Level Up Peter

Habit tracker gamificado que transforma seus hábitos diários em quests de RPG.

## Stack

- **Frontend**: React + Vite + Vanilla CSS (PWA)
- **Backend**: FastAPI + Python
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Railway

## Setup Local

### 1. Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL em `supabase/schema.sql` no SQL Editor
3. Copie as credenciais (URL, Anon Key, Service Role Key, JWT Secret)

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Edite .env com suas credenciais Supabase
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edite VITE_API_URL se necessário
npm run dev
```

## Deploy no Railway

### Backend
1. Crie um novo serviço no Railway apontando para `/backend`
2. Configure as variáveis de ambiente (copie do `.env.example`)
3. Port: 8000

### Frontend
1. Crie um novo serviço apontando para `/frontend`
2. Build command: `npm run build`
3. Start command: `npx serve dist -s -l 3000`
4. Configure `VITE_API_URL` com a URL do backend no Railway

## Gamificação

| Ação | XP |
|------|----|
| Completar 1 hábito | 50 XP |
| Perfect Day (4/4) | 300 + 100 bônus |
| Combo x2 (20+ dias) | Dobro do XP |
| Combo x3 (40 dias) | Triplo do XP |

### Níveis
🌱 Novato → ⚔️ Disciplinado → 🛡️ Guerreiro → 🔮 Mestre → 👑 Lenda → 🌟 Ascendido → 💎 Imortal → 🔥 Divino
