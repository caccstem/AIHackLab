const ITEMS = {
  plank: { name: 'Oak Planks', icon: 'oak_planks' }, stick: { name: 'Stick', icon: 'stick' },
  cobble: { name: 'Cobblestone', icon: 'cobblestone' }, coal: { name: 'Coal', icon: 'coal' },
  iron: { name: 'Iron Ingot', icon: 'iron_ingot' }, diamond: { name: 'Diamond', icon: 'diamond' },
  redstone: { name: 'Redstone Dust', icon: 'redstone' }, redstoneTorch: { name: 'Redstone Torch', icon: 'redstone_torch' },
  stone: { name: 'Stone', icon: 'stone' }, paper: { name: 'Paper', icon: 'paper' }, leather: { name: 'Leather', icon: 'leather' },
  obsidian: { name: 'Obsidian', icon: 'obsidian' }, cryingObsidian: { name: 'Crying Obsidian', icon: 'crying_obsidian' },
  glowstone: { name: 'Glowstone', icon: 'glowstone' }, book: { name: 'Book', icon: 'book' },
  wheat: { name: 'Wheat', icon: 'wheat' }, string: { name: 'String', icon: 'string' },
  gold: { name: 'Gold Ingot', icon: 'gold_ingot' }, quartz: { name: 'Nether Quartz', icon: 'quartz' },
  bow: { name: 'Bow', icon: 'bow' }, pumpkin: { name:'Pumpkin', icon:'pumpkin' },
  sugar: { name:'Sugar', icon:'sugar' }, egg: { name:'Egg', icon:'egg' },
  redMushroom: { name:'Red Mushroom', icon:'red_mushroom' }, brownMushroom: { name:'Brown Mushroom', icon:'brown_mushroom' },
  bowl: { name:'Bowl', icon:'bowl' }
};

const ITEM_ZH = { plank:'橡木木板',stick:'木棍',cobble:'圆石',coal:'煤炭',iron:'铁锭',diamond:'钻石',redstone:'红石粉',redstoneTorch:'红石火把',stone:'石头',paper:'纸',leather:'皮革',obsidian:'黑曜石',cryingObsidian:'哭泣的黑曜石',glowstone:'荧石',book:'书',wheat:'小麦',string:'线',gold:'金锭',quartz:'下界石英',bow:'弓',pumpkin:'南瓜',sugar:'糖',egg:'鸡蛋',redMushroom:'红色蘑菇',brownMushroom:'棕色蘑菇',bowl:'碗' };
const RESULT_ZH = { 'Wooden Pickaxe':'木镐','Stone Axe':'石斧','Torch':'火把','Iron Pickaxe':'铁镐','Diamond Sword':'钻石剑','Crafting Table':'工作台','Bread':'面包','Chest':'箱子','Furnace':'熔炉','Iron Chestplate':'铁胸甲','Iron Leggings':'铁护腿','Bow':'弓','Fishing Rod':'钓鱼竿','Shield':'盾牌','Clock':'时钟','Compass':'指南针','Book':'书','Redstone Repeater':'红石中继器','Piston':'活塞','Respawn Anchor':'重生锚','Enchanting Table':'附魔台','Redstone Lamp':'红石灯','Bookshelf':'书架','Observer':'侦测器','Dispenser':'发射器','Pumpkin Pie':'南瓜派','Mushroom Stew':'蘑菇煲' };
const ARMOR_VALUES = { 'Iron Chestplate':6, 'Iron Leggings':5 };
const FOOD_VALUES = { 'Pumpkin Pie':{hunger:8,saturation:4.8}, 'Mushroom Stew':{hunger:6,saturation:7.2} };
const HURT_SOUNDS = [1,2,3].map(number=>`assets/sounds/player-hurt-${number}.ogg`);
const HURT_AUDIO = HURT_SOUNDS.map(source=>{
  const audio=new Audio(source);
  audio.preload='auto';
  audio.volume=.55;
  return audio;
});
let lastHurtSound=-1;

const RECIPES = [
  { difficulty:2, title:'Craft a Wooden Pickaxe', description:'Every great adventure starts with the right tool.', result:'Wooden Pickaxe', resultIcon:'wooden_pickaxe', xp:100, stock:{plank:3,stick:2,cobble:2,coal:2}, pattern:['plank','plank','plank',null,'stick',null,null,'stick',null] },
  { difficulty:2, title:'Craft a Stone Axe', description:'A sturdy companion for gathering wood.', result:'Stone Axe', resultIcon:'stone_axe', xp:100, stock:{cobble:3,stick:2,plank:2,coal:2}, patterns:[
    ['cobble','cobble',null,'cobble','stick',null,null,'stick',null],
    [null,'cobble','cobble',null,'stick','cobble',null,'stick',null]
  ] },
  { difficulty:1, title:'Craft a Torch', description:'Light the path before the monsters arrive.', result:'Torch', resultIcon:'torch', xp:100, stock:{coal:1,stick:1,plank:3,cobble:2}, pattern:[null,null,null,null,'coal',null,null,'stick',null] },
  { difficulty:2, title:'Craft an Iron Pickaxe', description:'Dig deeper and uncover rarer treasure.', result:'Iron Pickaxe', resultIcon:'iron_pickaxe', xp:100, stock:{iron:3,stick:2,cobble:2,plank:2}, pattern:['iron','iron','iron',null,'stick',null,null,'stick',null] },
  { difficulty:1, title:'Craft a Diamond Sword', description:'A sharp challenge to begin your journey.', result:'Diamond Sword', resultIcon:'diamond_sword', xp:100, stock:{diamond:2,stick:1,iron:2,plank:2}, pattern:[null,'diamond',null,null,'diamond',null,null,'stick',null] },
  { difficulty:1, title:'Craft a Crafting Table', description:'Arrange four planks into a square.', result:'Crafting Table', resultIcon:'crafting_table', xp:75, stock:{plank:4,cobble:2,coal:2}, pattern:['plank','plank',null,'plank','plank',null,null,null,null] },
  { difficulty:1, title:'Craft Bread', description:'Place three wheat together in a row.', result:'Bread', resultIcon:'bread', xp:75, stock:{wheat:3,plank:2,coal:2}, pattern:['wheat','wheat','wheat',null,null,null,null,null,null] },
  { difficulty:2, shapeless:true, title:'Craft Pumpkin Pie', description:'Combine a pumpkin, sugar, and an egg.', result:'Pumpkin Pie', resultIcon:'pumpkin_pie', xp:125, stock:{pumpkin:1,sugar:1,egg:1,wheat:2,coal:2}, pattern:['pumpkin','sugar','egg',null,null,null,null,null,null] },
  { difficulty:3, shapeless:true, title:'Craft Mushroom Stew', description:'Combine both mushrooms with a bowl.', result:'Mushroom Stew', resultIcon:'mushroom_stew', xp:150, stock:{redMushroom:1,brownMushroom:1,bowl:1,plank:2,coal:2}, pattern:['redMushroom','brownMushroom','bowl',null,null,null,null,null,null] },
  { difficulty:3, title:'Craft a Chest', description:'Eight planks, one carefully placed opening.', result:'Chest', resultIcon:'chest', xp:150, stock:{plank:8,cobble:3,iron:2,coal:2}, pattern:['plank','plank','plank','plank',null,'plank','plank','plank','plank'] },
  { difficulty:3, title:'Craft a Furnace', description:'Build a stone ring strong enough for smelting.', result:'Furnace', resultIcon:'furnace', xp:150, stock:{cobble:8,plank:3,iron:2,coal:2}, pattern:['cobble','cobble','cobble','cobble',null,'cobble','cobble','cobble','cobble'] },
  { difficulty:3, title:'Craft an Iron Chestplate', description:'Shape eight ingots into sturdy armor.', result:'Iron Chestplate', resultIcon:'iron_chestplate', xp:175, stock:{iron:8,diamond:2,cobble:3,coal:2}, pattern:['iron',null,'iron','iron','iron','iron','iron','iron','iron'] },
  { difficulty:3, title:'Craft Iron Leggings', description:'A demanding seven-ingot armor pattern.', result:'Iron Leggings', resultIcon:'iron_leggings', xp:175, stock:{iron:7,diamond:2,plank:3,coal:2}, pattern:['iron','iron','iron','iron',null,'iron','iron',null,'iron'] },
  { difficulty:2, title:'Craft a Bow', description:'Curve sticks against a line of string.', result:'Bow', resultIcon:'bow', xp:125, stock:{stick:3,string:3,plank:2,coal:2}, pattern:[null,'stick','string','stick',null,'string',null,'stick','string'] },
  { difficulty:2, title:'Craft a Fishing Rod', description:'Set string along the end of a diagonal handle.', result:'Fishing Rod', resultIcon:'fishing_rod', xp:125, stock:{stick:3,string:2,plank:2,coal:2}, pattern:[null,null,'stick',null,'stick','string','stick',null,'string'] },
  { difficulty:3, title:'Craft a Shield', description:'Brace an iron ingot inside a plank shield.', result:'Shield', resultIcon:'shield', xp:175, stock:{plank:6,iron:1,cobble:2,coal:2}, pattern:['plank','iron','plank','plank','plank','plank',null,'plank',null] },
  { difficulty:3, title:'Craft a Clock', description:'Surround redstone dust with four gold ingots.', result:'Clock', resultIcon:'clock', xp:175, stock:{gold:4,redstone:1,iron:2,coal:2}, pattern:[null,'gold',null,'gold','redstone','gold',null,'gold',null] },
  { difficulty:3, title:'Craft a Compass', description:'Surround redstone dust with four iron ingots.', result:'Compass', resultIcon:'compass', xp:175, stock:{iron:4,redstone:1,gold:2,coal:2}, pattern:[null,'iron',null,'iron','redstone','iron',null,'iron',null] },
  { difficulty:4, shapeless:true, title:'Craft a Book', description:'Combine paper and leather in any arrangement.', result:'Book', resultIcon:'book', xp:200, stock:{paper:3,leather:1,plank:3,coal:2}, pattern:['paper','paper','paper','leather',null,null,null,null,null] },
  { difficulty:4, title:'Craft a Redstone Repeater', description:'Align two torches around redstone on a stone base.', result:'Redstone Repeater', resultIcon:'repeater', xp:225, stock:{redstoneTorch:2,redstone:1,stone:3,iron:2,plank:2}, pattern:[null,null,null,'redstoneTorch','redstone','redstoneTorch','stone','stone','stone'] },
  { difficulty:4, title:'Craft a Piston', description:'Fit wood, stone, iron, and redstone together precisely.', result:'Piston', resultIcon:'piston', xp:250, stock:{plank:3,cobble:4,iron:1,redstone:1,coal:2}, pattern:['plank','plank','plank','cobble','iron','cobble','cobble','redstone','cobble'] },
  { difficulty:4, title:'Craft a Respawn Anchor', description:'Bind glowstone inside a shell of crying obsidian.', result:'Respawn Anchor', resultIcon:'respawn_anchor', xp:275, stock:{cryingObsidian:6,glowstone:3,obsidian:2,diamond:2}, pattern:['cryingObsidian','cryingObsidian','cryingObsidian','glowstone','glowstone','glowstone','cryingObsidian','cryingObsidian','cryingObsidian'] },
  { difficulty:4, title:'Craft an Enchanting Table', description:'Balance a book and diamonds over an obsidian base.', result:'Enchanting Table', resultIcon:'enchanting_table', xp:300, stock:{book:1,diamond:2,obsidian:4,iron:2,redstone:2}, pattern:[null,'book',null,'diamond','obsidian','diamond','obsidian','obsidian','obsidian'] },
  { difficulty:4, title:'Craft a Redstone Lamp', description:'Surround glowstone with four redstone dust.', result:'Redstone Lamp', resultIcon:'redstone_lamp', xp:225, stock:{redstone:4,glowstone:1,coal:2,stone:2}, pattern:[null,'redstone',null,'redstone','glowstone','redstone',null,'redstone',null] },
  { difficulty:4, title:'Craft a Bookshelf', description:'Sandwich three books between rows of planks.', result:'Bookshelf', resultIcon:'bookshelf', xp:250, stock:{plank:6,book:3,paper:2,leather:2}, pattern:['plank','plank','plank','book','book','book','plank','plank','plank'] },
  { difficulty:4, title:'Craft an Observer', description:'Combine stone, redstone, and quartz in a precise circuit.', result:'Observer', resultIcon:'observer', xp:300, stock:{cobble:6,redstone:2,quartz:1,iron:2}, pattern:['cobble','cobble','cobble','redstone','redstone','quartz','cobble','cobble','cobble'] },
  { difficulty:4, title:'Craft a Dispenser', description:'Encase a bow and redstone mechanism in cobblestone.', result:'Dispenser', resultIcon:'dispenser', xp:325, stock:{cobble:7,bow:1,redstone:1,iron:2}, pattern:['cobble','cobble','cobble','cobble','bow','cobble','cobble','redstone','cobble'] }
];

// The large vanilla catalog is generated separately to keep this gameplay file
// readable. Existing hand-tuned challenges win when a result appears in both.
if(typeof VANILLA_RECIPE_CATALOG !== 'undefined') {
  Object.assign(ITEMS,VANILLA_RECIPE_CATALOG.items);
  const curatedResults=new Set(RECIPES.map(recipe=>recipe.result));
  RECIPES.push(...VANILLA_RECIPE_CATALOG.recipes.filter(recipe=>!curatedResults.has(recipe.result)));
}

let level = 0, score = 0, recipes = [], recipeBags = {}, lastOpeningResult = null;
let grid = Array(9).fill(null), gridCounts = Array(9).fill(0), stock = {}, cursorStack = null, soundOn = true;
let spreadDrag = { active:false, mode:null, start:null, slots:new Set() };
let hoveredGridSlot = null, hotbarOrder = [];
let recipeReady = false, completingCraft = false;
let language = localStorage.getItem('crafting-language') || 'en';
let health = 20, armorPoints = 0, equippedArmor = new Set(), dead = false;
let hunger = 20, saturation = 5, exhaustion = 0, regenTimer = null;
const $ = s => document.querySelector(s);
const gridEl = $('#craftingGrid'), hotbarEl = $('#hotbar');

function itemName(item) { return language==='zh' ? (ITEM_ZH[item] || ITEMS[item]?.name || item) : (ITEMS[item]?.name || item); }
function resultName(recipe) { return language==='zh' ? (RESULT_ZH[recipe.result] || recipe.result) : recipe.result; }
function applyLanguage() {
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  document.querySelectorAll('[data-i18n]').forEach(el=>el.innerHTML=el.dataset[language]);
  $('#languageButton').textContent=language==='en'?'中文':'EN';
  localStorage.setItem('crafting-language',language);
  if(recipes[level]) {
    const r=recipes[level];
    const difficultyName=language==='zh'?['','简单','熟练','专家','大师']:['','EASY','SKILLED','EXPERT','MASTER'];
    $('#recipeTitle').textContent=language==='zh'?`制作${resultName(r)}`:r.title;
    $('#recipeDescription').textContent=language==='zh'?'按照正确配方摆放材料，完成这次合成挑战。':r.description;
    $('#progressText').textContent=language==='zh'?`第 ${level+1} 轮 • ${difficultyName[r.difficulty]}`:`ROUND ${level+1} • ${difficultyName[r.difficulty]}`;
    render();
  }
}

function shuffled(items) {
  const result=[...items];
  for(let i=result.length-1;i>0;i--) {
    const swapIndex=Math.floor(Math.random()*(i+1));
    [result[i],result[swapIndex]]=[result[swapIndex],result[i]];
  }
  return result;
}

function resetRecipeBags() {
  recipeBags={};
  for(let difficulty=1;difficulty<=4;difficulty++) {
    recipeBags[difficulty]=shuffled(RECIPES.filter(recipe=>recipe.difficulty===difficulty));
  }
  const easyBag=recipeBags[1];
  if(lastOpeningResult && easyBag.length>1 && easyBag[0].result===lastOpeningResult) {
    [easyBag[0],easyBag[1]]=[easyBag[1],easyBag[0]];
  }
}

function addNextRecipe() {
  const nextRound=recipes.length;
  const difficulty = nextRound < 2 ? 1 : nextRound < 5 ? 2 : nextRound < 9 ? 3 : 4;
  const previous=recipes.at(-1);
  if(!recipeBags[difficulty]?.length) {
    recipeBags[difficulty]=shuffled(RECIPES.filter(recipe=>recipe.difficulty===difficulty));
    if(previous && recipeBags[difficulty].length>1 && recipeBags[difficulty][0].result===previous.result) {
      [recipeBags[difficulty][0],recipeBags[difficulty][1]]=[recipeBags[difficulty][1],recipeBags[difficulty][0]];
    }
  }
  recipes.push(recipeBags[difficulty].shift());
}

const preloadedTextures=new Set();
function textureUrl(item) {
  const asset=ITEMS[item]?.icon || item;
  return `https://mc-api.bisai.dev/v1/assets/items/${asset}/texture.png`;
}
function preloadRecipeTextures(recipe) {
  if(!recipe) return;
  [...Object.keys(recipe.stock),recipe.resultIcon].forEach(item=>{
    const url=textureUrl(item);
    if(preloadedTextures.has(url)) return;
    preloadedTextures.add(url);
    const image=new Image();
    image.decoding='async';
    image.src=url;
  });
}
function preloadUpcomingRecipes() {
  while(recipes.length<=level+2) addNextRecipe();
  recipes.slice(level+1,level+3).forEach(preloadRecipeTextures);
}

function icon(item, count) {
  const asset=ITEMS[item]?.icon || item;
  // minecraft-assets only publishes a flat sprite for some inventory items.
  // This endpoint returns that sprite for items and a rendered model for blocks,
  // so newly generated catalog entries never disappear behind a 404 response.
  const texture=textureUrl(item);
  return `<div class="item-icon ${asset}" style="background-image:url('${texture}')" aria-hidden="true"></div>${count ? `<span class="count">${count}</span>` : ''}`;
}
function initLevel() {
  if(!recipes[level]) addNextRecipe();
  const r = recipes[level]; grid.fill(null); gridCounts.fill(0); cursorStack = null; stock = {...r.stock};
  preloadRecipeTextures(r);
  $('#recipeTitle').textContent = language==='zh'?`制作${resultName(r)}`:r.title;
  $('#recipeDescription').textContent = language==='zh'?'按照正确配方摆放材料，完成这次合成挑战。':r.description;
  const difficultyName=language==='zh'?['','简单','熟练','专家','大师']:['','EASY','SKILLED','EXPERT','MASTER'];
  $('#rewardXp').textContent = r.xp; $('#progressText').textContent = language==='zh'?`第 ${level+1} 轮 • ${difficultyName[r.difficulty]}`:`ROUND ${level+1} • ${difficultyName[r.difficulty]}`;
  $('#scoreText').textContent = String(score).padStart(3,'0');
  $('#progressFill').style.width = `${Math.min(100,(level+1)/10*100)}%`;
  render();
  if(window.requestIdleCallback) window.requestIdleCallback(preloadUpcomingRecipes,{timeout:1200});
  else setTimeout(preloadUpcomingRecipes,200);
}
function render() {
  hotbarOrder=Object.keys(stock);
  gridEl.innerHTML = grid.map((item,i) => `<div class="slot" data-slot="${i}" role="button" tabindex="0" aria-label="${language==='zh'?'合成格':'Crafting slot'} ${i+1}${item ? `, ${gridCounts[i]} ${itemName(item)}`:''}">${item ? icon(item,gridCounts[i]>1?gridCounts[i]:0) : ''}</div>`).join('');
  const hotbarEntries=Object.entries(stock);
  hotbarEl.innerHTML = Array.from({length:9},(_,index)=>{
    const entry=hotbarEntries[index];
    if(!entry) return `<div class="hotbar-slot empty" data-hotkey="${index+1}" aria-label="${language==='zh'?'空快捷栏':'Empty hotbar slot'} ${index+1}"><span class="hotkey">${index+1}</span></div>`;
    const [item,count]=entry;
    return `<div class="hotbar-slot ${cursorStack?.item===item?'selected':''} ${count===0?'used-up':''}" data-item="${item}" role="button" tabindex="0" title="${itemName(item)}" aria-label="${language==='zh'?'快捷键':'Hotkey'} ${index+1}, ${itemName(item)}, ${count}"><span class="hotkey">${index+1}</span>${icon(item,count)}</div>`;
  }).join('');
  renderCursor();
  renderStatus();
  bindInteractions(); checkRecipe();
}
function renderStatus() {
  const visibleHealth=Math.ceil(Math.max(0,health));
  $('#healthBar').innerHTML=Array.from({length:10},(_,index)=>{
    const remaining=visibleHealth-index*2;
    return `<span class="hud-icon heart-icon ${remaining>=2?'full':remaining===1?'half':'empty'}"></span>`;
  }).join('');
  $('#armorBar').innerHTML=Array.from({length:10},(_,index)=>{
    const remaining=armorPoints-index*2;
    return `<span class="hud-icon armor-icon ${remaining>=2?'full':remaining===1?'half':'empty'}"></span>`;
  }).join('');
  const visibleHunger=Math.ceil(Math.max(0,hunger));
  $('#hungerBar').innerHTML=Array.from({length:10},(_,index)=>{
    const remaining=visibleHunger-index*2;
    return `<span class="hud-icon food-icon ${remaining>=2?'full':remaining===1?'half':'empty'}"></span>`;
  }).join('');
  $('#healthBar').setAttribute('aria-label',`${Math.max(0,health).toFixed(1)} / 20 health`);
  $('#armorBar').setAttribute('aria-label',`${armorPoints} / 20 armor`);
  $('#hungerBar').setAttribute('aria-label',`${hunger} / 20 hunger, ${saturation.toFixed(1)} saturation`);
}
function bindInteractions() {
  document.querySelectorAll('.hotbar-slot').forEach(el => {
    el.addEventListener('click', () => { if(el.dataset.item) grabInventoryStack(el.dataset.item); });
    el.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); el.click(); }});
    el.addEventListener('dragover', e => { if(e.dataTransfer.types.includes('application/x-crafted-result')) { e.preventDefault();el.classList.add('result-drop'); } });
    el.addEventListener('dragleave', () => el.classList.remove('result-drop'));
    el.addEventListener('drop', e => {
      if(!e.dataTransfer.types.includes('application/x-crafted-result')) return;
      e.preventDefault(); completeCraft();
    });
  });
  document.querySelectorAll('.slot').forEach(el => {
    el.addEventListener('mousedown', e => beginSlotAction(e,+el.dataset.slot));
    el.addEventListener('mouseenter', () => { hoveredGridSlot=+el.dataset.slot; addSpreadSlot(+el.dataset.slot); });
    el.addEventListener('mouseleave', () => { if(hoveredGridSlot===+el.dataset.slot) hoveredGridSlot=null; });
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('keydown', e => {
      if(e.key==='Enter'||e.key===' '){e.preventDefault();e.shiftKey?shiftReturnStack(+el.dataset.slot):leftClickSlot(+el.dataset.slot)}
    });
  });
}
function renderCursor() {
  const el=$('#cursorStack');
  el.classList.toggle('holding',Boolean(cursorStack));
  el.innerHTML=cursorStack ? icon(cursorStack.item,cursorStack.count) : '';
}
function returnCursorToInventory() {
  if(cursorStack) stock[cursorStack.item]=(stock[cursorStack.item]||0)+cursorStack.count;
  cursorStack=null;
}
function grabInventoryStack(item) {
  if(cursorStack?.item===item) {
    stock[item]=(stock[item]||0)+cursorStack.count; cursorStack=null; playTone(220); render(); return;
  }
  if(!stock[item]) return;
  returnCursorToInventory(); cursorStack={item,count:stock[item]}; stock[item]=0; playTone(300); render();
}
function hotkeyPlace(item,index) {
  returnCursorToInventory();
  const count=stock[item]||0;
  if(!count) return render();
  const sameItem=grid[index]===item;
  if(grid[index] && grid[index]!==item) stock[grid[index]]=(stock[grid[index]]||0)+gridCounts[index];
  grid[index]=item; gridCounts[index]=sameItem?gridCounts[index]+count:count;
  stock[item]=0; playTone(360); render();
  hoveredGridSlot=index;
  document.querySelector(`[data-slot="${index}"]`)?.classList.add('hotkey-flash');
}
function leftClickSlot(index) {
  if(cursorStack) {
    if(!grid[index] || grid[index]===cursorStack.item) {
      grid[index]=cursorStack.item; gridCounts[index]+=cursorStack.count; cursorStack=null;
    } else {
      const held=cursorStack; cursorStack={item:grid[index],count:gridCounts[index]};
      grid[index]=held.item; gridCounts[index]=held.count;
    }
  } else if(grid[index]) {
    cursorStack={item:grid[index],count:gridCounts[index]}; grid[index]=null; gridCounts[index]=0;
  }
  playTone(300); render();
}
function shiftReturnStack(index) {
  const item=grid[index];
  if(!item) return;
  const returned=(stock[item]||0)+gridCounts[index];
  delete stock[item];
  stock[item]=returned;
  grid[index]=null; gridCounts[index]=0;
  playTone(220); render();
}
function placeOne(index) {
  if(!cursorStack || (grid[index] && grid[index]!==cursorStack.item)) return;
  grid[index]=cursorStack.item; gridCounts[index]++; cursorStack.count--;
  if(cursorStack.count===0) cursorStack=null;
  playTone(360); render();
}
function beginSlotAction(event,index) {
  if(event.button!==0 && event.button!==2) return;
  event.preventDefault();
  if(event.button===0 && event.shiftKey && grid[index]) {
    shiftReturnStack(index); return;
  }
  if(cursorStack) {
    const compatible=!grid[index]||grid[index]===cursorStack.item;
    spreadDrag={active:true,mode:event.button===2?'single':'even',start:index,slots:new Set(compatible?[index]:[])};
    if(compatible) document.querySelector(`[data-slot="${index}"]`)?.classList.add('spread-target');
  } else if(event.button===0) leftClickSlot(index);
}
function addSpreadSlot(index) {
  if(!spreadDrag.active || !cursorStack) return;
  if(!grid[index] || grid[index]===cursorStack.item) {
    spreadDrag.slots.add(index);
    document.querySelector(`[data-slot="${index}"]`)?.classList.add('spread-target');
  }
}
function finishSpread() {
  if(!spreadDrag.active) return;
  const mode=spreadDrag.mode;
  const start=spreadDrag.start;
  const slots=[...spreadDrag.slots].filter(index=>!grid[index]||grid[index]===cursorStack?.item);
  spreadDrag={active:false,mode:null,start:null,slots:new Set()};
  if(!cursorStack) return render();
  if(mode==='single') {
    slots.forEach(index=>{
      if(!cursorStack) return;
      grid[index]=cursorStack.item; gridCounts[index]++; cursorStack.count--;
      if(cursorStack.count===0) cursorStack=null;
    });
    if(slots.length) playTone(360);
    return render();
  }
  if(!slots.length) return leftClickSlot(start);
  if(slots.length===1) return leftClickSlot(slots[0]);
  const amount=Math.floor(cursorStack.count/slots.length), remainder=cursorStack.count%slots.length;
  slots.forEach((index,position)=>{
    const addition=amount+(position<remainder?1:0);
    if(!addition) return;
    grid[index]=cursorStack.item; gridCounts[index]+=addition;
  });
  cursorStack=null; playTone(360); render();
}
document.addEventListener('mouseup',finishSpread);
document.addEventListener('mousemove',event=>{
  const el=$('#cursorStack');el.style.left=`${event.clientX}px`;el.style.top=`${event.clientY}px`;
  const slot=event.target.closest?.('.slot');
  hoveredGridSlot=slot ? +slot.dataset.slot : null;
});
document.addEventListener('keydown',event=>{
  if(hoveredGridSlot===null || !/^[1-9]$/.test(event.key)) return;
  const item=hotbarOrder[Number(event.key)-1];
  if(!item) return;
  event.preventDefault(); hotkeyPlace(item,hoveredGridSlot);
});

// Minecraft shaped recipes may be placed anywhere in the crafting grid. Reduce
// both layouts to their occupied bounding boxes so only relative positions matter.
function trimmedPattern(pattern) {
  const occupied = pattern.map((item,index) => item ? [Math.floor(index/3),index%3] : null).filter(Boolean);
  if(!occupied.length) return [];
  const rows = occupied.map(([row])=>row), cols = occupied.map(([,col])=>col);
  const top=Math.min(...rows), bottom=Math.max(...rows), left=Math.min(...cols), right=Math.max(...cols);
  const shape=[];
  for(let row=top;row<=bottom;row++) {
    const line=[];
    for(let col=left;col<=right;col++) line.push(pattern[row*3+col] || null);
    shape.push(line);
  }
  return shape;
}

function sameShape(first,second) {
  if(first.length!==second.length || first.some((row,index)=>row.length!==second[index]?.length)) return false;
  return first.every((row,rowIndex)=>row.every((item,colIndex)=>item===second[rowIndex][colIndex]));
}

function mirroredPattern(pattern) {
  const mirrored=[];
  for(let row=0;row<3;row++) mirrored.push(...pattern.slice(row*3,row*3+3).reverse());
  return mirrored;
}

function sameIngredients(first,second) {
  const items = pattern => pattern.filter(Boolean).sort().join('|');
  return items(first)===items(second);
}

function checkRecipe() {
  const recipe = recipes[level];
  const basePatterns = recipe.patterns || [recipe.pattern];
  const validPatterns = recipe.shapeless ? basePatterns : basePatterns.flatMap(pattern=>[pattern,mirroredPattern(pattern)]);
  const placedShape = trimmedPattern(grid);
  const good = recipe.shapeless
    ? validPatterns.some(pattern => sameIngredients(pattern,grid))
    : validPatterns.some(pattern => sameShape(trimmedPattern(pattern),placedShape));
  const result=$('#resultSlot');
  recipeReady=good;
  if(good) { result.className='result-slot ready'; result.innerHTML=icon(recipes[level].resultIcon); result.draggable=true; $('#resultHint').innerHTML=language==='zh'?`可以制作 <b>${resultName(recipes[level])}</b>！`:`Ready to craft a <b>${recipes[level].result}</b>!`; }
  else { result.className='result-slot empty'; result.innerHTML='<span class="lock">?</span>'; $('#resultHint').innerHTML=language==='zh'?'正确摆放材料<br>即可显示成品。':'Arrange the ingredients<br>to reveal the result.'; }
  result.draggable=good;
  result.onmousedown=event=>{
    if(event.shiftKey && event.button===0) { event.preventDefault();recipeReady?completeCraft():takeDamage(); }
  };
  result.ondragstart=event=>{
    if(!recipeReady) { event.preventDefault(); return; }
    event.dataTransfer.setData('application/x-crafted-result',recipes[level].result);
    event.dataTransfer.effectAllowed='move';
  };
  return good;
}
function playTone(freq) {
  if(!soundOn) return; try { const ctx=new (window.AudioContext||window.webkitAudioContext)(), osc=ctx.createOscillator(), gain=ctx.createGain(); osc.type='square';osc.frequency.value=freq;gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.09);osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.1); } catch(_) {}
}
function playHurtSound() {
  if(!soundOn) return;
  let soundIndex=Math.floor(Math.random()*HURT_AUDIO.length);
  if(soundIndex===lastHurtSound) soundIndex=(soundIndex+1+Math.floor(Math.random()*2))%HURT_AUDIO.length;
  lastHurtSound=soundIndex;
  const audio=HURT_AUDIO[soundIndex];
  audio.pause();
  audio.currentTime=0;
  audio.playbackRate=.9+Math.random()*.2;
  audio.play().catch(()=>playTone(105));
}
function addExhaustion(amount) {
  exhaustion+=amount;
  while(exhaustion>=4) {
    exhaustion-=4;
    if(saturation>0) saturation=Math.max(0,saturation-1);
    else hunger=Math.max(0,hunger-1);
  }
}
function startNaturalRegeneration() {
  clearInterval(regenTimer);
  if(dead || health>=20 || hunger<18) return;
  regenTimer=setInterval(()=>{
    if(dead || health>=20 || hunger<18) { clearInterval(regenTimer);regenTimer=null;return; }
    health=Math.min(20,health+1);
    addExhaustion(6);
    renderStatus();
  },500);
}
function applyFood(food) {
  hunger=Math.min(20,hunger+food.hunger);
  saturation=Math.min(hunger,saturation+food.saturation);
  renderStatus(); startNaturalRegeneration();
}
function takeDamage() {
  if(dead || completingCraft) return;
  const baseDamage=2;
  const effectiveArmor=Math.min(20,Math.max(armorPoints/5,armorPoints-(4*baseDamage/8)));
  const damage=baseDamage*(1-effectiveArmor/25);
  health=Math.max(0,health-damage);
  addExhaustion(.1);
  playHurtSound(); renderStatus();
  const hud=$('#survivalHud'); hud.classList.remove('damaged'); void hud.offsetWidth; hud.classList.add('damaged');
  document.body.classList.remove('damage-flash'); void document.body.offsetWidth; document.body.classList.add('damage-flash');
  toast(language==='zh'?`配方错误！失去 ${(damage/2).toFixed(1)} 颗心`:`Wrong recipe! Lost ${(damage/2).toFixed(1)} hearts`);
  if(health<=0) { dead=true;clearInterval(regenTimer);setTimeout(showDeathScreen,450); }
  else setTimeout(startNaturalRegeneration,650);
}
function showDeathScreen() {
  dead=true; $('#deathScore').textContent=score;
  const particles=$('#deathParticles');
  particles.innerHTML='';
  // Java Edition emits 20 POOF particles across the entity as it dies.
  for(let index=0;index<20;index++) {
    const particle=document.createElement('i');
    particle.className='death-particle';
    particle.style.setProperty('--x',`${(Math.random()-.5)*230}px`);
    particle.style.setProperty('--y',`${(Math.random()-.5)*170}px`);
    particle.style.setProperty('--dx',`${(Math.random()-.5)*55}px`);
    particle.style.setProperty('--dy',`${-25-Math.random()*70}px`);
    particle.style.setProperty('--size',`${24+Math.floor(Math.random()*17)}px`);
    particle.style.setProperty('--scale',`${1.15+Math.random()*.55}`);
    particle.style.setProperty('--delay',`${Math.random()*.16}s`);
    particle.style.setProperty('--duration',`${.42+Math.random()*.18}s`);
    particles.appendChild(particle);
  }
  $('#deathModal').hidden=false;
}
function toast(message) { const t=$('#toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800); }
$('#clearButton').addEventListener('click',()=>{
  grid.forEach((item,index)=>{if(item)stock[item]=(stock[item]||0)+gridCounts[index]});
  grid.fill(null);gridCounts.fill(0);returnCursorToInventory();render();
});
$('#soundButton').addEventListener('click',()=>{soundOn=!soundOn;$('#soundButton').textContent=soundOn?'♪':'×';});
function completeCraft() {
  if(!recipeReady || completingCraft) return;
  completingCraft=true;
  const armorValue=ARMOR_VALUES[recipes[level].result];
  if(armorValue && !equippedArmor.has(recipes[level].result)) {
    equippedArmor.add(recipes[level].result);
    armorPoints=Math.min(20,armorPoints+armorValue);
    renderStatus();
  }
  const foodValue=FOOD_VALUES[recipes[level].result];
  if(foodValue) applyFood(foodValue);
  score += recipes[level].xp; $('#scoreText').textContent=String(score).padStart(3,'0');
  playTone(620); toast(language==='zh'?`+${recipes[level].xp} 分 • 已制作 ${resultName(recipes[level])}！`:`+${recipes[level].xp} points • ${recipes[level].result} crafted!`); level++;
  setTimeout(()=>{completingCraft=false;initLevel()},650);
}
function restartGame() {
  lastOpeningResult=recipes[0]?.result || null;
  clearInterval(regenTimer);regenTimer=null;
  level=0;score=0;recipes=[];health=20;armorPoints=0;equippedArmor=new Set();dead=false;
  hunger=20;saturation=5;exhaustion=0;resetRecipeBags();
  $('#winModal').hidden=true;$('#gameOverModal').hidden=true;initLevel();
}
$('#playAgainButton').addEventListener('click',restartGame);
$('#retryButton').addEventListener('click',restartGame);
$('#respawnButton').addEventListener('click',()=>{$('#deathModal').hidden=true;restartGame()});
$('#languageButton').addEventListener('click',()=>{language=language==='en'?'zh':'en';applyLanguage()});
resetRecipeBags();
applyLanguage();
initLevel();
