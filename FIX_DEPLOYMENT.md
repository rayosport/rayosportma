# 🔧 Fix: "Export 'supabase' is not defined in module"

## Problème

L'erreur `Uncaught SyntaxError: Export 'supabase' is not defined in module` se produit parce que les variables d'environnement Supabase ne sont pas définies lors du build.

## Solution : Configurer les Secrets GitHub

### Étape 1: Aller dans les Settings du repository

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** (en haut à droite)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** > **Actions**

### Étape 2: Ajouter les secrets

Cliquez sur **New repository secret** et ajoutez :

#### Secret 1: `VITE_SUPABASE_URL`
- **Name:** `VITE_SUPABASE_URL`
- **Secret:** Votre URL Supabase (ex: `https://xxxxx.supabase.co`)
- Cliquez sur **Add secret**

#### Secret 2: `VITE_SUPABASE_ANON_KEY`
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Secret:** Votre clé anon Supabase (commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- Cliquez sur **Add secret**

### Étape 3: Où trouver ces valeurs ?

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Allez dans **Settings** > **API**
4. Vous verrez :
   - **Project URL** → C'est votre `VITE_SUPABASE_URL`
   - **anon public** key → C'est votre `VITE_SUPABASE_ANON_KEY`

⚠️ **IMPORTANT:** Utilisez la clé **anon public**, PAS la clé **service_role** !

### Étape 4: Redéployer

Après avoir ajouté les secrets :

1. Allez dans **Actions** (onglet GitHub)
2. Trouvez le dernier workflow qui a échoué
3. Cliquez sur **Re-run jobs** > **Re-run failed jobs**

Ou simplement faites un nouveau commit et push :

```bash
git commit --allow-empty -m "Trigger rebuild with secrets"
git push origin main
```

## Vérification

Le workflow va maintenant :
1. ✅ Vérifier que les secrets sont définis (nouvelle étape ajoutée)
2. ✅ Build avec les variables d'environnement
3. ✅ Déployer sur GitHub Pages

## Si le problème persiste

### Vérifier que les secrets sont bien configurés

1. Allez dans **Settings** > **Secrets and variables** > **Actions**
2. Vérifiez que vous voyez bien :
   - `VITE_SUPABASE_URL` ✅
   - `VITE_SUPABASE_ANON_KEY` ✅

### Vérifier les logs du workflow

1. Allez dans **Actions**
2. Cliquez sur le dernier workflow
3. Regardez l'étape "Verify environment variables"
4. Si elle échoue, les secrets ne sont pas configurés

### Test local

Pour tester localement avant de déployer :

```bash
# Créer .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
GITHUB_PAGES_BASE=/
EOF

# Build local
npm run build

# Si ça fonctionne, les secrets GitHub devraient aussi fonctionner
```

## Résumé

Le problème vient du fait que les variables d'environnement ne sont pas disponibles lors du build GitHub Actions. 

**Solution:** Configurer les secrets GitHub dans Settings > Secrets and variables > Actions

Une fois configurés, le workflow vérifiera automatiquement leur présence avant de builder, et vous verrez une erreur claire si quelque chose manque.

