# PersonalNutri: contexto para outras conversas

Resumo do estado do app e das decisões, atualizado em 16/11/2026. Cole no começo de uma conversa nova (ou adicione aos arquivos do Projeto) para ela partir daqui.

## O app

- Site: https://espmikael.github.io/PersonalNutri/ (GitHub Pages, repositório `espmikael/PersonalNutri`, publica a partir da `main`).
- Dados: Supabase (tabela `dieta_estado`, uma linha por usuário com todo o estado em JSON). Funciona offline e sincroniza celular e PC.
- Arquivos: `app.js` (telas e ações), `core.js` (cálculos e sincronização, com testes em `tests/`), `foods.js` (banco de alimentos), `styles.css`, `sw.js` (offline e atualização), `supabase.sql`.

## Importante: de onde vem o plano

O plano que aparece no app é o **plano salvo na conta** (Supabase), não o "plano padrão" escrito no código.
O plano padrão (`defaultPlan` em `app.js`) só vale para quem começa do zero ou usa "Restaurar plano padrão".
**Mudar o plano padrão no código não muda o plano de quem já usa o app.** Foi isso que causou confusão em 15/11: ajustes combinados em outra conversa não apareceram.
Para mudar o plano de verdade, há dois caminhos: editar pela tela Plano do app, ou criar uma migração em `migratePlan()` (`app.js`), que roda uma vez e fica marcada em `S.mig`.

## Plano atual (depois das mudanças de 15/11)

Metas salvas na conta: 1.855 kcal, 175 g de proteína, 195 g de carbo, 40 g de gordura, 2,7 L de água (vêm da primeira versão do app, de 10/11; o padrão do código é 1.860 / 205, mas isso não muda a conta). Refeição livre: 1 por semana. As metas se editam em Plano.

- **07:00 Café da manhã**, opções:
  - Shake: whey 1 dose, leite desnatado 300 ml, iogurte natural 1 pote (170 g), fruta. ~420 kcal, 42 g de proteína.
  - Panqueca de banana, Crepioca.
  - Ovos mexidos: 3 ovos, tomate, cebola, 1 fatia de pão integral, fruta.
- **12:00 Almoço**, opções: Com feijão, Sem feijão, Massa, Batata, Batata-doce. ~520 kcal, 55 g de proteína (150 g de frango ou carne magra).
- **16:00 Lanche da tarde**, opções: Sanduíche, Wrap de frango, Crepioca de frango e Shake pré-treino (whey com água, banana, aveia). Todas com ~290 a 330 kcal, 23 a 28 g de proteína e pouca gordura. O "Pão com doce de leite ou geleia" saiu (pouca proteína).
  - **Ele já é o pré-treino.** Comer 1 a 2 h antes de treinar e **nada mais até o treino**.
  - **Iogurte não vai antes do treino**; ele fica no shake da manhã.
  - Não existe mais refeição separada de "Pré-treino" nem o "Lanche" das 17h (iogurte + aveia).
- **21:00 Jantar**: mesmas opções do almoço. Não há refeição "Ceia" separada no plano.
- **Regra do plano** (aparece em Hoje, nas Regras): "Depois da janta, se bater fome, só uma fruta leve: 1/2 mamão papaia, 1 kiwi, 10 morangos ou 1 maçã (35 a 70 kcal)." Se comer, registrar em "+ Anotar › Comi a mais".
- Os cards das refeições não têm mais observações fixas; as dicas de cada opção abrem pelo ícone "i".

Total com a 1ª opção de cada refeição: ~1.780 kcal e ~174 g de proteína. A fruta da noite completa até a meta. Hoje mostra o que já foi comido no dia; Plano mostra o total planejado. As duas usam a mesma meta.

## Decisões e sugestões

- Proteína antes de dormir (caseína, cottage, iogurte grego): no plano atual o ganho é pequeno. A proteína do dia já é alta (~2,2 g/kg) e o jantar das 21h, com ~48 g de proteína, já faz esse papel. Vale só em dia de jantar fraco ou trocado, ou com fome à noite. Exemplos: cottage 100 g com 5 morangos (~115 kcal, 12 g de proteína) ou iogurte grego zero 170 g (~100 kcal, ~15 g). Não foi implementado. Levar para a nutricionista antes de mudar.

## Funcionalidades do app (15/11)

- **Hoje:** refeições primeiro, anel de calorias e macros (toque para ver Macros), próxima refeição em destaque, refeições feitas recolhidas, sequências de dias, "Repetir ontem", arrastar para trocar o dia.
- **Barra do celular:** Hoje, Compras, Extras, Progresso, Plano.
- **Anotações:** "Comi outra coisa", "Comi a mais" e "Refeição livre", com busca num banco de alimentos (valores aproximados da TACO) que preenche kcal e macros. Inclui açaí tradicional (copos de 300, 500 e 700 ml), sorvete napolitano, barras de chocolate, paçoca e leite em pó.
- **Progresso:** resumo da semana, gráficos de peso e cintura, fotos (precisa rodar a parte de fotos do `supabase.sql`), sugestão de ajuste da meta e exportação do histórico em planilha.
- **Compras:** lista semanal automática pela proporção das opções comidas nas últimas 2 semanas. O dia das compras se escolhe em Conta e ajustes.
- **Conta e ajustes:** tema automático, claro ou escuro; lembretes de refeição e água (só funcionam com o app aberto ou em segundo plano recente).
- A sincronização não deixa itens apagados voltarem, e plano, metas e regras têm versão própria.

## Atenção

Mais de uma sessão do Claude Code já mexeu neste repositório (inclusive por pull requests). Antes de mudar algo, buscar a `main` atual e aplicar por cima, sem sobrescrever.

## Pendências

- Rodar no Supabase a parte "Fotos de progresso" do `supabase.sql`.
- Conferir a sincronização entre celular e PC, que não pôde ser testada pelo ambiente de código.
