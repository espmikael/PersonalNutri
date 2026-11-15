# PersonalNutri

**Acessar:** https://espmikael.github.io/PersonalNutri/

App pessoal para seguir o plano alimentar no dia a dia. Mostra as refeições do dia com as opções de troca, soma calorias e macros, registra água, refeição livre e bebida alcoólica, e acompanha peso, medidas e fotos toda semana. Funciona no celular e no computador, sincroniza pelo Supabase e exporta o histórico em planilha para analisar o que funcionou e o que não funcionou.

## O que tem

- **Hoje:** anel de calorias com proteína, carbo e gordura; próxima refeição em destaque; refeições feitas recolhidas; sequências de dias (proteína, água, plano); "Repetir ontem"; arrastar para o lado troca o dia.
- **Anotações com banco de alimentos:** busca em ~130 alimentos comuns (valores aproximados da TACO e de rótulos) e preenche calorias e macros.
- **Progresso:** resumo da semana (adesão, médias de kcal, proteína e água), gráficos de peso e cintura com média móvel, fotos de progresso e sugestão de ajuste da meta.
- **Plano:** editor com duplicar opção, alimentos do banco e importação/exportação em planilha.
- **Compras:** lista de compras gerada pelo plano, para quantos dias quiser, com itens para riscar e compartilhar.
- **Conta e ajustes:** tema automático/claro/escuro e lembretes de refeição e água.
- Desfazer ao apagar, aviso de nova versão do app, funciona offline.

## Supabase

Rode o `supabase.sql` no SQL Editor do projeto. A primeira parte cria a tabela de dados; a segunda cria o armazenamento das fotos de progresso (necessária só para as fotos).

## Arquivos

- `index.html`, `styles.css`: página e visual.
- `app.js`: telas, ações e sincronização.
- `core.js`: lógica pura (somas do dia, junção da sincronização, resumos, lista de compras). Testada.
- `foods.js`: banco de alimentos.
- `sw.js`: funcionamento offline e atualização. Ao publicar uma versão nova, troque o `VERSION`.

## Testes

```bash
npm test
```

Precisa só do Node 18 ou mais novo; não há dependências para instalar.
