# O Pescador — Mar de casa

Primeira versão jogável modular de um simulador de pesca para navegador. A auditoria inicial encontrou somente o briefing e a imagem de referência: não havia repositório, package.json, dependências ou sistemas anteriores para preservar.

## Atualização gráfica V2

Barco reconstruído com casco curvo, bancos e equipamentos; costa com relevo, vegetação instanciada, casas detalhadas e decoração portuária. [Relatório, evidências e limites de validação](docs/MODELS_V2.md). [Créditos dos assets](docs/ASSET_CREDITS.md).

## Atualização gráfica V1

O oceano foi modularizado com seis ondas Gerstner, flutuação compartilhada, reflexo planar, LOD e esteira. Consulte [o relatório técnico e a validação](docs/OCEAN_V1.md). A cena completa em WebGL ainda requer validação; os shaders foram compilados e renderizados offscreen por Mesa.

## Executar

Requer Node.js 20+ para validação e Python 3 para o servidor simples. Os módulos Three.js já estão incluídos; não é necessário npm install.

```sh
npm test
npm run build
python3 -m http.server 8080 --directory dist
```

Abra http://localhost:8080. Não abra index.html por file://: módulos ES precisam de HTTP. WebGL 2 e aceleração gráfica são necessários para a cena 3D. Quando não disponíveis, um modo 2D esquemático explicitamente identificado preserva as regras e interações.

## Controles e objetivo

- W/S: acelerar, reduzir e dar ré; A/D: virar.
- F: lançar e fisgar. Espaço ou botão pressionado: recolher; solte para aliviar a tensão.
- E: porto, somente a até 24 metros da origem. I: porão. Q: equipar lança; pressione novamente para atacar em alcance.
- Arraste sobre a cena para girar a câmera. Esc: pausa/resgate.
- Setas e botões disponíveis em telas pequenas.

Capture, volte ao porto, venda a carga e compre melhorias. Espécies maiores precisam de varas melhores. Águas profundas exigem motor nível 1 e vara nível 2. O sonar revela os cardumes. Alimentos e melhorias da casa avançam os objetivos familiares. Não existe perda passiva de progresso da família. Sem combustível, é possível remar devagar; o resgate perde a carga, mas conserva dinheiro e melhorias.

## Arquivos e arquitetura

A V2 integra módulos em `dist/models/`, materiais em `dist/assets/materials/` e addons locais em `dist/vendor/addons/`.

| Arquivo | Responsabilidade |
|---|---|
| dist/index.html | HUD, introdução, menus e acessibilidade básica |
| dist/style.css | Layout responsivo, interface e controles por toque |
| dist/config.js | Espécies, preços, requisitos, melhorias, cardumes e parâmetros |
| dist/systems.js | Economia, inventário, validação de save, pesca e IA do tubarão |
| dist/world.js | Three.js, oceano/sky GLSL, barco, vila, peixes, chuva, câmera e efeitos |
| dist/fallback.js | Renderização Canvas 2D para dispositivos sem WebGL |
| dist/main.js | Loop, navegação, controles, UI, missões, áudio, clima e persistência |
| dist/vendor | Three.js 0.180.0 e licença MIT |
| tests/systems.test.mjs | Testes das regras independentes do renderer |
| scripts/build.mjs | Validação sintática e existência dos recursos estáticos |
| package.json | Comandos de build e testes; nenhum bundler necessário |

## Implementado

- Navegação com deltaTime, aceleração, inércia, ré, câmera suave, combustível, bloqueio costeiro simplificado e limites marítimos.
- Pesca com lançamento, espera variável, mordida temporizada, fisgada, tensão, resistência, fuga, captura e limite do porão.
- Seis espécies, quatro raridades, pesos/valores/habitats/requisitos e influência do clima nas probabilidades.
- Venda individual ou total, remoção atômica da carga em memória, compras com validação, 7 categorias de melhorias e suprimentos.
- Três zonas, bloqueio por equipamentos, cardumes e sonar no mapa.
- IA do tubarão: afastado, patrulha, aproximação, alerta, ataque e recuo. Encontros em 120–240 segundos de mar aberto, dano ao casco, alcance e cooldown da lança.
- Missões, prólogo pulável, alimentos, melhorias da casa e mudanças visuais no porão/casco/telhado.
- Ciclo dia/noite, transições de chuva/vento, variação de navegação e pesca.
- Oceano V1: seis ondas Gerstner, amostragem compartilhada com flutuação, Fresnel, absorção, reflexos planares da cena, espuma e esteira, malha com detalhe variável e céu integrado. Veja docs/OCEAN_V1.md.
- Áudio sintetizado: ambiente, motor e sinais contextuais, sem amostras de terceiros.
- Autosave a cada 10 s e após transações; validação de dados, IDs duplicados e campos ausentes; localStorage versionado.
- Pausa, inventário, comprador, melhorias, serviços, missões, mapa, volume e três presets de resolução/sombras.

## Dependências e recursos

Three.js **0.180.0**, distribuído localmente sob MIT (dist/vendor/THREE-LICENSE.txt), obtido do pacote npm via jsDelivr. Não usa CDN de código durante a partida. Modelos, shaders e áudio são procedurais e criados para o projeto. Materiais incluem mapas autorais e Rocky Terrain 02 adaptado do pacote fornecido; veja os créditos. A imagem enviada é somente referência e não foi usada como cenário estático. Fontes DM Sans/Manrope são carregadas opcionalmente do Google Fonts; há alternativas locais de sistema.

## Verificação real

- `npm test`: 26 testes aprovados, 0 falhas (8 de regras + 9 do oceano + 9 de modelos). Cobrem venda não duplicada, compras inválidas/capacidade, excesso de carga, save corrompido/round-trip, captura controlada, rompimento da linha, dano/recuo/alcance do tubarão e serviços.
- `npm run build`: passou. É validação dos módulos/arquivos de uma distribuição estática, não compilação de shaders na GPU.
- Navegador: introdução, carregamento do modo 2D, HUD, lançamento de linha, cancelamento, comprador e compra de alimentos foram exercitados. Compra reduziu 45 para 15 moedas e desabilitou compras sem saldo. Após recarregar, o saldo de 15 moedas foi restaurado; menu de configurações também foi aberto. Um erro de denominador na missão inicial após comprar comida antecipadamente foi identificado e corrigido.
- O navegador remoto informou `GL_RENDERER = Disabled` e falhou na criação de contexto WebGL. Foi implementado tratamento com fallback 2D, em vez de tela vazia. **Cena 3D completa, desempenho e captura/combate completos no navegador não foram validados.** Os novos shaders foram compilados, executados e capturados separadamente em Mesa EGL por software; isso não valida a cena completa. Os fluxos de pesca e combate foram validados por testes de lógica.
- Não há medição confiável de FPS nem teste físico em celular. Não se promete 60 FPS.

## Limitações e próxima etapa

Esta entrega é uma base jogável, não a execução integral da produção cinematográfica descrita no briefing.

- Água agora usa render target planar da cena com fallback atmosférico; não usa SSR, ray tracing ou refração por depth texture. Profundidade costeira é analítica aproximada. Consulte o relatório V1 para os limites do reflexo em ondas.
- Nuvens têm aparência procedural no shader da esfera do céu, não volume real. Sem bloom, SSAO, DOF ou pós-processamento adicional.
- Barco e costa receberam modelos procedurais detalhados e materiais PBR na V2. Personagens e peixes continuam simples; sem animações esqueléticas ou cinemática dirigida da família.
- Colisão costeira e defesa da lança usam aproximações de distância; tubarão aproxima-se por um setor previsível. Não há física hidrodinâmica, mira livre ou colisão por triângulo.
- Iscas e linhas consumíveis separadas, diversidade de compradores, ramificações narrativas, exportação/importação de save, controles remapeáveis e gamepad não estão implementados.
- Missões são objetivos derivados dos dados, sem árvore de quests extensa. Família não possui NPCs com IA. A casa muda de telhado, sem interior jogável.
- Save é por navegador/origem, sem nuvem. Ao recarregar, o barco retorna ao porto mantendo carga e recursos; posição e luta não persistem. Não existe trava entre várias abas: jogue em uma aba por vez.
- Dificuldade/economia são valores iniciais; precisam de sessões prolongadas de playtest.

Prioridade seguinte: validar em GPU WebGL 2 real, ajustar shaders/perfil de desempenho, testar uma viagem completa em desktop e celular e calibrar os novos modelos, materiais e vegetação com medições reais.
