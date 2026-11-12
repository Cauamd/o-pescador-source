export const RARITIES={
  'Comum':{tier:1,stars:'★',color:'#9fd8c9',accent:'#4fa38b',glow:'rgba(159,216,201,.38)',weight:9,fx:{bubbles:14,sparkles:4,rays:3,trail:1,rings:1,jellies:0,lightning:0,duration:4.5}},
  'Incomum':{tier:2,stars:'★★',color:'#7ec8ff',accent:'#3582d4',glow:'rgba(126,200,255,.48)',weight:5,fx:{bubbles:22,sparkles:14,rays:5,trail:3,rings:2,jellies:0,lightning:0,duration:5.2}},
  'Raro':{tier:3,stars:'★★★',color:'#f3c26b',accent:'#d9822b',glow:'rgba(243,194,107,.58)',weight:3,fx:{bubbles:32,sparkles:28,rays:8,trail:5,rings:3,jellies:2,lightning:0,duration:6.0}},
  'Épico':{tier:4,stars:'★★★★',color:'#c98bff',accent:'#7a3ee6',glow:'rgba(201,139,255,.68)',weight:2,fx:{bubbles:44,sparkles:48,rays:11,trail:8,rings:4,jellies:4,lightning:2,duration:7.0}},
  'Lendário':{tier:5,stars:'★★★★★',color:'#ff9ad5',accent:'#ffd86b',glow:'rgba(255,154,213,.85)',weight:1,fx:{bubbles:60,sparkles:80,rays:16,trail:12,rings:6,jellies:6,lightning:4,duration:8.5}}
};

export const FISH=[
  // Comuns (Tier 1)
  {id:'sardinha',name:'Sardinha',rarity:'Comum',shape:'sleek',tint:'#8ec8c0',belly:'#e4f7f3',pattern:'stripe',desc:'Pequena, veloz e prateada; brilha em cardumes rasos.',min:.3,max:1.2,price:14,zone:0,depth:5,difficulty:.7,rod:0,weather:'calm'},
  {id:'manjuba',name:'Manjuba-prata',rarity:'Comum',shape:'school',tint:'#a8e0d8',belly:'#f2fffc',pattern:' lateral',desc:'Corpo quase translúcido com faixa prateada espelhada.',min:.2,max:.9,price:15,zone:0,depth:6,difficulty:.65,rod:0,weather:'calm'},
  {id:'tainha',name:'Tainha',rarity:'Comum',shape:'mullet',tint:'#7ab8a8',belly:'#dfeee9',pattern:'scales',desc:'Escamas largas e salto ágil nas águas calmas da costa.',min:1,max:3,price:18,zone:0,depth:12,difficulty:.9,rod:0,weather:'calm'},
  {id:'corvina',name:'Corvina-da-costa',rarity:'Comum',shape:'drum',tint:'#c4b07b',belly:'#f0e8d2',pattern:'bars',desc:'Dorso arqueado em bronze com listras diagonais marcantes.',min:1.2,max:3.5,price:20,zone:0,depth:16,difficulty:.95,rod:0,weather:'rain'},
  // Incomuns (Tier 2)
  {id:'robalo',name:'Robalo',rarity:'Incomum',shape:'bass',tint:'#68b4e8',belly:'#e3f3ff',pattern:'lateral',desc:'Predador costeiro de mandíbula forte e linha lateral escura.',min:2,max:5,price:28,zone:1,depth:30,difficulty:1.1,rod:0,weather:'rain'},
  {id:'anchova',name:'Anchova-azul',rarity:'Incomum',shape:'torpedo',tint:'#4c9cf0',belly:'#d6eeff',pattern:'finned',desc:'Torpedo azul-metálico de cauda rápida e nadadeiras douradas.',min:2.2,max:5.5,price:30,zone:0,depth:22,difficulty:1.05,rod:0,weather:'calm'},
  {id:'xareu',name:'Xaréu-prateado',rarity:'Incomum',shape:'trevally',tint:'#8ccfff',belly:'#f0f9ff',pattern:'scutes',desc:'Corpo alto como um escudo prateado e nadadeiras em foice.',min:2.5,max:6,price:33,zone:1,depth:38,difficulty:1.15,rod:1,weather:'calm'},
  {id:'garoupa',name:'Garoupa-pintada',rarity:'Incomum',shape:'grouper',tint:'#d97b6c',belly:'#f7cfc6',pattern:'spots',desc:'Robusta habitante das pedras, coberta de pintas avermelhadas.',min:3,max:7.5,price:36,zone:1,depth:45,difficulty:1.2,rod:1,weather:'rain'},
  // Raros (Tier 3)
  {id:'dourado',name:'Dourado-do-mar',rarity:'Raro',shape:'crest',tint:'#f5c542',belly:'#7be098',pattern:'spots',desc:'Crista frontal imponente com reflexos ouro, esmeralda e azul.',min:4,max:9,price:42,zone:1,depth:60,difficulty:1.35,rod:1,weather:'calm'},
  {id:'cavala',name:'Cavala-real',rarity:'Raro',shape:'mackerel',tint:'#e8b84b',belly:'#fff1cc',pattern:'tiger',desc:'Flecha de mar aberto com listras tigradas e pínulas douradas.',min:4.5,max:10,price:48,zone:1,depth:75,difficulty:1.4,rod:1,weather:'rain'},
  {id:'badejo',name:'Badejo-imperial',rarity:'Raro',shape:'emperor',tint:'#e09a48',belly:'#fae0bc',pattern:'bars',desc:'Gigante das lajes profundas com faixas imperiais em cobre e ouro.',min:6,max:12,price:54,zone:2,depth:120,difficulty:1.45,rod:2,weather:'calm'},
  {id:'atum',name:'Atum-azul',rarity:'Raro',shape:'tuna',tint:'#3c78d8',belly:'#f5d07a',pattern:'finlets',desc:'Colosso hidrodinâmico de dorso azul-real e pínulas reluzentes.',min:7,max:14,price:60,zone:2,depth:150,difficulty:1.55,rod:2,weather:'rain'},
  // Épicos (Tier 4)
  {id:'vela',name:'Peixe-vela',rarity:'Épico',shape:'sail',tint:'#b87cff',belly:'#7ee8ff',pattern:'saildots',desc:'Abre uma imensa vela dorsal estriada que brilha nas correntes.',min:8,max:15,price:72,zone:1,depth:110,difficulty:1.6,rod:2,weather:'calm'},
  {id:'espadarte',name:'Peixe-espada',rarity:'Épico',shape:'sword',tint:'#9f6bff',belly:'#e6d9ff',pattern:'slash',desc:'Guerreiro das águas profundas armado com uma longa lâmina frontal.',min:9.5,max:17,price:78,zone:2,depth:175,difficulty:1.68,rod:2,weather:'rain'},
  {id:'cherne',name:'Cherne-abissal',rarity:'Épico',shape:'abyssal',tint:'#7c52cc',belly:'#d9a6ff',pattern:'biolum',desc:'Encouraçado das fossas marinhas com fendas bioluminescentes.',min:10,max:18,price:84,zone:2,depth:195,difficulty:1.72,rod:2,weather:'rain'},
  // Lendários (Tier 5)
  {id:'marlin',name:'Marlim prateado',rarity:'Lendário',shape:'marlin',tint:'#ff85c8',belly:'#fff0b8',pattern:'royal',desc:'Lenda viva do oceano; sua lança corta as ondas em prata e ouro.',min:12,max:22,price:95,zone:2,depth:220,difficulty:1.8,rod:2,weather:'calm'},
  {id:'enguia_astral',name:'Serpente-de-lumina',rarity:'Lendário',shape:'eel',tint:'#ff6ee0',belly:'#7cf7ff',pattern:'stars',desc:'Serpente mística que ondula nas profundezas desenhando constelações.',min:11,max:20,price:110,zone:2,depth:250,difficulty:1.85,rod:3,weather:'rain'},
  {id:'rei_abismo',name:'Leviatã-dourado',rarity:'Lendário',shape:'dragon',tint:'#ffc452',belly:'#ff7ab8',pattern:'dragon',desc:'O soberano ancestral dos mares, coroado de barbatanas solares.',min:14,max:22,price:125,zone:2,depth:290,difficulty:1.9,rod:3,weather:'calm'}
];

export const UPGRADES={rod:{name:'Vara',desc:'Controle da linha e novas espécies',prices:[130,420,950],max:3},motor:{name:'Motor',desc:'Mais velocidade e acesso às águas profundas',prices:[160,480,1100],max:3},hold:{name:'Porão',desc:'+12 kg de capacidade por nível',prices:[100,280,650],max:3},hull:{name:'Casco',desc:'Reduz o dano dos tubarões',prices:[140,360,800],max:3},sonar:{name:'Sonar',desc:'Revela cardumes e distância no mapa',prices:[220],max:1},spear:{name:'Lança',desc:'Mais dano e alcance defensivo',prices:[150,390],max:2},home:{name:'Nossa casa',desc:'Conforto para sua família e avanço da história',prices:[250,750,1800],max:3}};
export const BALANCE={fuelPerSecond:.035,repairPrice:25,fuelPrice:18,foodPrice:30,sharkMin:120,sharkMax:240};
export const SHOALS=[{x:0,z:-48},{x:-60,z:-100},{x:100,z:-180},{x:-160,z:-260},{x:80,z:-400},{x:-210,z:-500}];
