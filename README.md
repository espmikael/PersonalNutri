# PersonalNutri

App pessoal de dieta: plano alimentar com opções de troca, macros do dia, metas, água, refeição livre, registro de bebida alcoólica e acompanhamento de peso e cintura. Funciona no celular e no computador, nos temas claro e escuro, e sincroniza pelo Supabase.

Site estático (HTML, CSS e JavaScript puros), publicado pelo GitHub Pages. Não tem build nem dependência para instalar.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Página única do app |
| `styles.css` | Visual (temas claro e escuro, layout de celular e PC) |
| `app.js` | Toda a lógica: telas, plano padrão, cálculos, sincronização, planilha |
| `config.js` | Nome do app e conexão com o Supabase |
| `sw.js` | Service worker: deixa o app abrir sem internet |
| `manifest.webmanifest`, `*.png`, `favicon.svg` | Ícone do prato e instalação na tela de início |
| `supabase.sql` | Script da tabela e das regras de acesso (rodar no Supabase, não precisa estar no repositório) |

## Publicar

1. Suba os arquivos na raiz do repositório (não dentro de uma pasta), inclusive o `sw.js`.
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

## Peso e medidas

Em **Progresso**, o check-in semanal pede o peso (em jejum) e a cintura. Em **Outras medidas** entram peito, braço contraído, coxa e quadril, para medir a cada 2 a 4 semanas. O card **Como medir** explica onde passar a fita em cada uma. Registrar de novo na mesma data completa o registro daquele dia sem apagar o que já estava lá.

O card **Medidas** compara a primeira e a última medida de cada parte. Para perder gordura e ganhar massa, o sinal bom é a cintura cair enquanto peito, braço e coxa se mantêm ou sobem, mesmo que o peso ande devagar.

## Dias anteriores

Na tela **Hoje**, as setas ‹ › ao lado da data voltam até 14 dias. Assim dá para revisar e marcar um dia que passou (refeições, anotações e água). Refeição que ficar sem marcação conta como pulada no histórico.

## Sem internet

O `sw.js` guarda uma cópia do app no aparelho. Sem sinal, o app abre normalmente, com a sessão que já estava aberta, e as alterações ficam salvas no aparelho. Quando a internet volta, ele sincroniza.

Ao publicar uma versão nova, o app pega os arquivos novos assim que abrir com internet. Se algo parecer antigo, feche e abra o app de novo.

## Anotar o que comeu de verdade

Cada refeição na tela **Hoje** tem um botão **+ Anotar**:

- **Comi outra coisa**: substitui a refeição do plano (marca como feita).
- **Comi a mais**: soma em cima do que estava no plano.
- **Refeição livre**: substitui a refeição e já marca a refeição livre da semana.

Desmarcar uma refeição que tem anotação de troca ou de refeição livre pede confirmação e apaga essa anotação. Apagar a anotação de uma refeição que só estava marcada por causa dela volta a refeição para não feita.

O card **Fora das refeições**, no fim do dia, serve para beliscos. As calorias de uma anotação são opcionais e entram só nas calorias do dia; proteína, carbo e gordura vêm apenas das refeições do plano.

Quando uma refeição é marcada como feita, o app guarda a opção e os macros daquele dia. Mudar o plano depois não altera o histórico.

## Exportar o histórico

Em **Progresso › Exportar histórico** sai `personalnutri-historico-AAAA-MM-DD.xlsx`, pensado para mandar a uma IA analisar. Abas:

- **Leia-me**: como cada número foi calculado.
- **Resumo diário**: uma linha por dia (inclusive dias sem registro), com refeições feitas, kcal do plano, kcal anotadas, kcal de bebida, total, diferença da meta, macros, refeição livre, peso, cintura e anotações.
- **Refeições**: cada refeição de cada dia, com a opção escolhida, se foi feita, se seguiu o plano e as anotações.
- **Anotações**, **Bebidas alcoólicas**, **Check-ins e medidas**, **Metas** e **Plano atual**.

A água entra no resumo diário (ml do dia e meta). A meta de água fica em **Macros › Metas** (padrão: 2.700 ml, como no plano da nutricionista).

## Plano padrão

Fica em `defaultPlan()`, no `app.js`. Hoje: café da manhã (shake com iogurte, panqueca ou crepioca), almoço e jantar (com feijão, sem feijão, massa, batata ou batata-doce), pré-treino às 16h (sanduíche com banana) e ceia (mamão, kiwi, morangos ou maçã). Totais com a primeira opção de cada refeição: cerca de 1.860 kcal, 175 g de proteína, 203 g de carboidrato e 37 g de gordura. Os macros são estimativas a partir de tabelas; corrija pelo rótulo no editor quando usar uma marca específica.

Para trazer o plano padrão de volta depois de mudanças: **Plano › Restaurar plano padrão**.

## Trocar o nome ou o ícone

- Nome: `config.js` (`name`), `manifest.webmanifest` e a tag `<title>` do `index.html`.
- Ícone: `favicon.svg` e os PNGs (`apple-touch-icon.png` 180 px, `icon-192.png`, `icon-512.png`).
