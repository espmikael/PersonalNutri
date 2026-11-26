/* Banco de alimentos do PersonalNutri.
   Valores aproximados por 100 g (ou 100 ml nas bebidas), com base na Tabela TACO/Unicamp, na USDA e em rótulos comuns.
   Formato: [nome, kcal, proteína g, carbo g, gordura g, porção (opcional), gramas ou ml da porção].
   Opcional no fim: outras porções [[quantidade, nome], ...] no lugar do atalho "2 ×".
   Os líquidos (medidos em ml) estão em LIQUIDOS, logo abaixo. */
(function (root) {
  const FOODS = [
    // Arroz, massas, pães e cereais
    ['Arroz branco cozido', 128, 2.5, 28.1, 0.2, '1 col. servir', 45],
    ['Arroz integral cozido', 124, 2.6, 25.8, 1.0, '1 col. servir', 45],
    ['Macarrão cozido', 158, 5.8, 30.9, 0.9, '1 pegador', 110],
    ['Macarrão integral cozido', 124, 5.3, 26.5, 0.5, '1 pegador', 110],
    ['Cuscuz de milho cozido', 113, 2.2, 25.3, 0.7, '1 fatia', 100],
    ['Pão francês', 300, 8.0, 58.6, 3.1, '1 unidade', 50],
    ['Pão de forma integral', 253, 9.4, 49.9, 3.7, '1 fatia', 25],
    ['Pão de forma branco', 266, 7.6, 49.4, 3.3, '1 fatia', 25],
    ['Pão de queijo assado', 363, 5.1, 34.2, 24.6, '1 unidade', 25],
    ['Goma de tapioca', 240, 0.2, 59.5, 0, '1 tapioca', 60],
    ['Aveia em flocos', 394, 13.9, 66.6, 8.5, '1 col. sopa', 15],
    ['Farelo de aveia', 246, 17.3, 66.2, 7.0, '1 col. sopa', 11],
    ['Granola', 450, 10, 65, 15, '1 col. sopa', 15],
    ['Biscoito de arroz', 387, 8.2, 81.5, 2.8, '1 unidade', 9],
    ['Biscoito cream cracker', 432, 10.1, 68.7, 14.4, '1 unidade', 7],
    ['Pipoca sem óleo', 387, 13, 78, 4.5, '1 xícara', 8],
    ['Milho verde em conserva', 98, 3.2, 17.1, 2.4, '1 col. sopa', 25],
    ['Farofa pronta', 406, 2.1, 80.3, 9.1, '1 col. sopa', 15],

    // Feijões e grãos
    ['Feijão carioca cozido', 76, 4.8, 13.6, 0.5, '1 concha', 86],
    ['Feijão preto cozido', 77, 4.5, 14.0, 0.5, '1 concha', 86],
    ['Lentilha cozida', 93, 6.3, 16.3, 0.5, '1 concha', 86],
    ['Grão-de-bico cozido', 164, 8.9, 27.4, 2.6, '1 col. sopa', 22],
    ['Feijoada', 117, 8.7, 11.6, 6.5, '1 concha', 150],

    // Tubérculos
    ['Batata inglesa cozida', 52, 1.2, 11.9, 0, '1 unidade média', 140],
    ['Batata-doce cozida', 77, 0.6, 18.4, 0.1, '1 unidade média', 150],
    ['Mandioca cozida', 125, 0.6, 30.1, 0.3, '1 pedaço', 100],
    ['Purê de batata', 100, 1.9, 15, 4, '1 col. servir', 50],
    ['Batata frita', 267, 5.0, 35.6, 13.1, '1 porção média', 110],

    // Carnes, aves, peixes e ovos
    ['Peito de frango grelhado', 159, 32.0, 0, 2.5, '1 filé', 120],
    ['Coxa de frango assada sem pele', 209, 26, 0, 10.9, '1 unidade', 70],
    ['Frango desfiado', 163, 31, 0, 3.6, '1 col. sopa', 25],
    ['Patinho grelhado', 219, 35.9, 0, 7.3, '1 bife', 100],
    ['Carne moída refogada', 212, 26.7, 0, 10.9, '1 col. sopa', 30],
    ['Alcatra grelhada', 241, 31.9, 0, 11.6, '1 bife', 100],
    ['Contrafilé grelhado', 278, 32.4, 0, 15.5, '1 bife', 100],
    ['Filé mignon grelhado', 220, 32.8, 0, 8.8, '1 medalhão', 100],
    ['Lombo de porco assado', 210, 35.7, 0, 6.4, '1 fatia', 80],
    ['Linguiça de porco grelhada', 296, 23.2, 0, 21.9, '1 gomo', 60],
    ['Hambúrguer bovino grelhado', 250, 17, 3, 19, '1 unidade', 90],
    ['Tilápia grelhada', 128, 26.2, 0, 2.7, '1 filé', 120],
    ['Salmão grelhado', 206, 22.1, 0, 12.4, '1 posta', 120],
    ['Atum em lata (água)', 116, 25.5, 0, 0.8, '1 lata drenada', 120],
    ['Sardinha em lata (óleo, drenada)', 208, 24.6, 0, 11.5, '1 lata drenada', 85],
    ['Camarão cozido', 99, 24, 0.2, 0.3, '1 porção', 100],
    ['Ovo inteiro', 143, 12.6, 0.7, 9.5, '1 unidade', 50],
    ['Ovo frito', 240, 15.6, 1.2, 18.6, '1 unidade', 50],
    ['Clara de ovo', 52, 10.9, 0.7, 0.2, '1 clara', 33],
    ['Peito de peru fatiado', 100, 18.7, 2.3, 1.7, '1 fatia', 15],
    ['Presunto magro', 94, 14.3, 2.1, 2.7, '1 fatia', 15],
    ['Tofu', 76, 8.1, 1.9, 4.8, '1 fatia', 50],
    ['Whey protein', 400, 80, 10, 6.5, '1 dose', 30],
    ['Strogonoff de frango', 157, 17.6, 2.6, 8.0, '1 concha', 130],
    ['Lasanha à bolonhesa', 140, 8, 14, 6, '1 pedaço', 250],

    // Leite e derivados
    ['Leite integral', 60, 3.1, 4.6, 3.2, '1 copo', 200],
    ['Leite desnatado', 35, 3.4, 4.9, 0.1, '1 copo', 200],
    ['Iogurte natural integral', 51, 4.1, 1.9, 3.0, '1 pote', 170],
    ['Iogurte natural desnatado', 41, 3.8, 5.8, 0.3, '1 pote', 170],
    ['Iogurte grego zero', 60, 10, 4, 0.4, '1 pote', 100],
    ['Queijo mussarela', 330, 22.6, 3.0, 25.2, '1 fatia', 20],
    ['Queijo minas frescal', 264, 17.4, 3.2, 20.2, '1 fatia', 30],
    ['Queijo cottage', 98, 11.1, 3.4, 4.3, '1 col. sopa', 30],
    ['Queijo parmesão ralado', 453, 35.6, 1.7, 33.5, '1 col. sopa', 10],
    ['Requeijão light', 180, 11, 4, 13, '1 col. sopa', 20],
    ['Requeijão tradicional', 257, 9.6, 2.4, 23.4, '1 col. sopa', 20],
    ['Manteiga', 726, 0.4, 0.1, 82.4, '1 col. chá', 5],
    ['Creme de leite', 221, 1.5, 4.5, 22.5, '1 col. sopa', 15],
    ['Leite condensado', 313, 7.7, 57, 6.7, '1 col. sopa', 20],
    ['Leite em pó integral', 497, 25.4, 39.2, 26.9, '1 col. sopa', 15],

    // Frutas
    ['Banana prata', 98, 1.3, 26.0, 0.1, '1 unidade', 80],
    ['Banana nanica', 92, 1.4, 23.8, 0.1, '1 unidade', 100],
    ['Maçã', 56, 0.3, 15.2, 0, '1 unidade', 130],
    ['Mamão papaia', 40, 0.5, 10.4, 0.1, '1/2 unidade', 155],
    ['Morango', 30, 0.9, 6.8, 0.3, '1 unidade', 12],
    ['Kiwi', 51, 1.3, 11.5, 0.6, '1 unidade', 76],
    ['Laranja', 37, 1.0, 8.9, 0.1, '1 unidade', 140],
    ['Tangerina', 38, 0.8, 9.6, 0.1, '1 unidade', 120],
    ['Manga', 72, 0.4, 19.4, 0.2, '1/2 unidade', 150],
    ['Abacaxi', 48, 0.9, 12.3, 0.1, '1 fatia', 75],
    ['Melancia', 33, 0.9, 8.1, 0, '1 fatia', 200],
    ['Melão', 29, 0.7, 7.5, 0, '1 fatia', 100],
    ['Uva', 53, 0.7, 13.6, 0.2, '1 cacho pequeno', 100],
    ['Pera', 53, 0.6, 14.0, 0.1, '1 unidade', 130],
    ['Goiaba', 54, 1.1, 13.0, 0.4, '1 unidade', 120],
    ['Abacate', 96, 1.2, 6.0, 8.4, '1 col. sopa', 30],
    ['Açaí polpa sem açúcar', 58, 0.8, 6.2, 3.9, '1 pacote', 100],
    ['Açaí tradicional (com xarope de guaraná)', 110, 0.7, 21.5, 3.7, 'Copo de 300 ml', 300, [[500, 'Copo de 500 ml'], [700, 'Copo de 700 ml']]],
    ['Uva-passa', 299, 3.1, 79.2, 0.5, '1 col. sopa', 15],

    // Verduras e legumes
    ['Alface', 11, 1.3, 1.7, 0.2, '1 prato', 50],
    ['Tomate', 15, 1.1, 3.1, 0.2, '1 unidade', 100],
    ['Cenoura crua', 34, 1.3, 7.7, 0.2, '1 col. sopa ralada', 12],
    ['Brócolis cozido', 25, 2.1, 4.4, 0.5, '1 xícara', 90],
    ['Abobrinha cozida', 15, 1.1, 3.0, 0.2, '1 col. servir', 50],
    ['Chuchu cozido', 19, 0.4, 4.8, 0, '1 col. servir', 50],
    ['Couve refogada', 90, 1.7, 8.7, 6.6, '1 col. servir', 40],
    ['Pepino', 10, 0.9, 2.0, 0, '1/2 unidade', 100],
    ['Beterraba cozida', 32, 1.3, 7.2, 0.1, '1 col. sopa', 25],
    ['Abóbora cabotiá cozida', 48, 1.4, 10.8, 0.7, '1 col. servir', 60],
    ['Molho de tomate', 38, 1.4, 7.7, 0.2, '1 col. sopa', 20],

    // Gorduras, castanhas e sementes
    ['Azeite de oliva', 884, 0, 0, 100, '1 col. sopa', 12],
    ['Óleo de soja', 884, 0, 0, 100, '1 col. sopa', 12],
    ['Pasta de amendoim', 588, 25.1, 20, 50.4, '1 col. sopa', 15],
    ['Amendoim torrado', 606, 22.5, 18.7, 54, '1 punhado', 30],
    ['Castanha-do-pará', 643, 14.5, 15.1, 63.5, '1 unidade', 4],
    ['Castanha de caju torrada', 570, 18.5, 29.1, 46.3, '1 punhado', 30],
    ['Nozes', 620, 14, 18.4, 59.4, '1 unidade', 5],
    ['Amêndoas', 581, 18.6, 29.5, 47.3, '1 punhado', 30],
    ['Chia', 486, 16.5, 42.1, 30.7, '1 col. sopa', 10],

    // Doces e açúcares
    ['Açúcar', 387, 0, 99.5, 0, '1 col. chá', 5],
    ['Mel', 309, 0, 84, 0, '1 col. sopa', 20],
    ['Doce de leite', 306, 5.5, 59.5, 6, '1 col. sopa', 20],
    ['Chocolate ao leite', 540, 7.2, 59.6, 30.3, '1 barra pequena', 25],
    ['Barra de chocolate ao leite', 540, 7.2, 59.6, 30.3, '1 barra', 90],
    ['Barra de chocolate meio amargo', 475, 4.9, 62.4, 29.9, '1 barra', 90],
    ['Paçoca', 487, 16, 52.4, 26.1, '1 unidade', 20],
    ['Bombom', 490, 5, 60, 25, '1 unidade', 20],
    ['Brigadeiro', 440, 4, 65, 18, '1 unidade', 20],
    ['Sorvete de creme', 207, 3.5, 23.6, 11, '1 bola', 60],
    ['Sorvete napolitano', 180, 3, 24, 8, '1 bola', 60],
    ['Bolo simples', 330, 5, 55, 10, '1 fatia', 60],
    ['Biscoito recheado', 472, 6.4, 70.5, 19.6, '1 unidade', 12],
    ['Barra de cereal', 390, 5, 72, 9, '1 unidade', 25],
    ['Barra de proteína', 420, 33, 40, 15, '1 unidade', 45],
    ['Achocolatado em pó', 401, 4.2, 91.2, 2.2, '1 col. sopa', 15],

    // Chocolates e snacks de pacote (valores de rótulo; a porção é a embalagem ou a unidade)
    ['Snickers', 483, 8.8, 60, 23, '1 barra', 45],
    ['Snickers pequeno', 465, 8.8, 60.5, 23.3, '1 barra', 21.5],
    ['Snickers mini', 472, 8.3, 61.1, 22.2, '1 unidade', 9],
    ['Moranguete', 427, 0.9, 81, 11, '1 unidade', 9],
    ['KitKat', 530, 8, 57.8, 28.9, '1 barra', 41.5],
    ['Prestígio', 467, 3, 63.6, 21.5, '1 unidade', 33],
    ['Bis', 513, 6, 63.3, 25.7, '1 unidade', 6],
    ['Sonho de Valsa', 520, 5, 65, 26, '1 unidade', 20],
    ['Ouro Branco', 535, 5, 60, 29.5, '1 unidade', 20],
    ['Batom (Baton)', 531, 8, 53.1, 31.2, '1 unidade', 16],
    ['Wafer recheado de morango', 520, 5.7, 60, 28, '4 unidades', 30],
    ['Ruffles original', 533, 5.1, 47, 35, '1 pacote pequeno', 40],

    // Lanches e comida de rua
    ['Pizza de mussarela', 266, 11.4, 33, 9.7, '1 fatia', 110],
    ['Pizza de calabresa', 290, 12, 30, 13, '1 fatia', 110],
    ['Hambúrguer de lanchonete', 260, 13, 25, 12, '1 sanduíche', 200],
    ['Coxinha de frango', 283, 9.6, 34.5, 11.8, '1 unidade', 80],
    ['Pastel de carne frito', 388, 10.1, 43.8, 20.1, '1 unidade', 80],
    ['Esfiha de carne', 260, 11, 32, 9, '1 unidade', 80],
    ['Sushi', 150, 6, 28, 1.5, '1 peça', 30],
    ['Gyudon (carne com cebola, arroz, ovo e crispy)', 191, 8.9, 21.1, 7.8, '1 tigela', 450],

    // Bebidas (por 100 ml)
    ['Refrigerante', 42, 0, 10.6, 0, '1 lata', 350],
    ['Refrigerante zero', 0, 0, 0, 0, '1 lata', 350],
    ['Suco de laranja natural', 45, 0.7, 10.4, 0.2, '1 copo', 250],
    // Vitaminas batidas com 250 ml de leite desnatado (por 100 ml; a porção é o copo inteiro). Só a de abacate leva açúcar (24 g)
    ['Vitamina de abacate', 87, 2.4, 10.7, 4.4, '1 copo (250 ml de leite + 1 abacate pequeno + 2 col. sopa de açúcar)', 480],
    ['Vitamina de morango', 34, 2.7, 5.4, 0.2, '1 copo (250 ml de leite + 100 g de morango)', 350],
    ['Vitamina de banana', 50, 2.9, 10.0, 0.1, '1 copo (250 ml de leite + 1 banana)', 330],
    ['Vitamina de banana com aveia', 81, 3.9, 15.1, 0.8, '1 copo (250 ml de leite + 1 banana + 2 col. sopa de aveia)', 350],
    ['Vitamina de mamão', 37, 2.3, 7.1, 0.1, '1 copo (250 ml de leite + 1/2 mamão papaia)', 400],
    ['Água de coco', 22, 0, 5.3, 0, '1 copo', 250],
    ['Café sem açúcar', 2, 0.1, 0.3, 0, '1 xícara', 50]
  ];
  /* Medidos em ml: bebidas, leites líquidos e o açaí de copo */
  const LIQUIDOS = /^(Refrigerante|Suco|Água|Café|Vitamina|Leite (integral|desnatado)$|Açaí tradicional)/;
  FOODS.isLiquid = (name) => LIQUIDOS.test(name);
  if (typeof module !== 'undefined' && module.exports) module.exports = FOODS; else root.FOODS = FOODS;
})(typeof self !== 'undefined' ? self : this);
