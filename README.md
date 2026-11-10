# PersonalNutri

App pessoal de dieta: plano alimentar com opções de troca, macros do dia, metas, refeição livre, registro de bebida e acompanhamento de peso e cintura. Funciona no celular e no computador, nos temas claro e escuro, e sincroniza pelo Supabase.

Site estático (HTML, CSS e JavaScript puros), publicado pelo GitHub Pages. Não tem build nem dependência para instalar.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Página única do app |
| `styles.css` | Visual (temas claro e escuro, layout de celular e PC) |
| `app.js` | Toda a lógica: telas, plano padrão, cálculos, sincronização, planilha |
| `config.js` | Nome do app e conexão com o Supabase |
| `manifest.webmanifest`, `*.png`, `favicon.svg` | Ícone do prato e instalação na tela de início |
| `supabase.sql` | Script da tabela e das regras de acesso (rodar no Supabase, não precisa estar no repositório) |

## Publicar

1. Suba os arquivos na raiz do repositório (não dentro de uma pasta).
2. Em **Settings › Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. O app fica em `https://espmikael.github.io/PersonalNutri/`.

## Supabase

O app usa o mesmo projeto do TreinoHoje (o plano gratuito permite só 2 projetos ativos). Por isso o login é o mesmo dos dois apps.

1. No projeto, abra **SQL Editor › New query**, cole o `supabase.sql` e clique em **Run**. Ele cria só a tabela `dieta_estado`, com RLS: cada conta lê e grava apenas a própria linha.
2. O `config.js` já tem a URL do projeto e a chave publishable. Essa chave pode ser pública; a proteção dos dados vem das regras de RLS. Nunca coloque a chave `service_role` no repositório.
3. Em **Authentication › URL Configuration**, adicione `https://espmikael.github.io/PersonalNutri/` em **Redirect URLs**. Não altere o **Site URL** (continua sendo o do TreinoHoje).

### Como a sincronização funciona

- Todo o estado do app (plano, metas, dias, extras e check-ins) fica numa linha por usuário, em JSON.
- Cada alteração é salva no aparelho na hora e enviada ao Supabase cerca de 1 segundo depois.
- Ao entrar ou voltar para o app, ele busca a versão da nuvem e fica com a mais recente. Se o mesmo dado for editado em dois aparelhos ao mesmo tempo, vale a última gravação.
- Sem login ("Usar sem conta neste aparelho"), os dados ficam só no navegador daquele aparelho.

## Importar e exportar o plano

Em **Plano**, o botão **Exportar planilha** gera `plano-dieta.xlsx`. Use esse arquivo como modelo para editar no Excel ou para refinar com outra IA, e depois volte com **Importar planilha** (.xlsx ou .csv). Importar substitui o plano atual, depois de pedir confirmação.

Colunas (acentos e maiúsculas não importam):

| Coluna | Exemplo | Obrigatória |
|---|---|---|
| Refeição | Almoço | sim |
| Horário | 12:00 | não |
| Opção | Com feijão | não (vira "Opção 1") |
| Alimento | Arroz | sim |
| Quantidade | 120 g | não |
| kcal | 155 | não |
| Proteína (g) | 3 | não |
| Carbo (g) | 34 | não |
| Gordura (g) | 0 | não |
| Dica | Pesos do alimento cozido | não |

- Cada linha é um alimento. Linhas com a mesma Refeição e Opção formam aquela opção.
- Se as colunas Refeição, Horário ou Opção ficarem vazias, o app repete o valor da linha de cima.
- Números aceitam vírgula ou ponto.

## Plano padrão

Fica em `defaultPlan()`, no `app.js`. Hoje: café da manhã (shake com iogurte, panqueca ou crepioca), almoço e jantar (com feijão, sem feijão, massa, batata ou batata-doce), pré-treino às 16h (sanduíche com banana) e ceia (mamão, kiwi, morangos ou maçã). Totais com a primeira opção de cada refeição: cerca de 1.860 kcal, 175 g de proteína, 203 g de carboidrato e 37 g de gordura. Os macros são estimativas a partir de tabelas; corrija pelo rótulo no editor quando usar uma marca específica.

Para trazer o plano padrão de volta depois de mudanças: **Plano › Restaurar plano padrão**.

## Trocar o nome ou o ícone

- Nome: `config.js` (`name`), `manifest.webmanifest` e a tag `<title>` do `index.html`.
- Ícone: `favicon.svg` e os PNGs (`apple-touch-icon.png` 180 px, `icon-192.png`, `icon-512.png`).
