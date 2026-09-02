import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LIMIT = 50;
const PRICE = 810;
const INITIAL_RECIPE = {
  nome: 'Bolo de pote de Ninho', rendimento_base: 4, unidade_rendimento: 'pote', tempo: '45 min',
  ingredientes: [
    {nome:'Leite condensado', quantidade:1, unidade:'lata'}, {nome:'Creme de leite', quantidade:1, unidade:'caixa'},
    {nome:'Leite em pó', quantidade:6, unidade:'colheres (sopa)'}, {nome:'Farinha de trigo', quantidade:2, unidade:'xícaras'}
  ],
  modo_preparo: ['Prepare o creme misturando os ingredientes em fogo baixo até engrossar.', 'Asse o bolo, espere esfriar e corte em camadas.', 'Monte os potes alternando bolo e creme. Finalize e leve à geladeira.']
};

const exampleImages = (name) => [
  `https://source.unsplash.com/800x600/?${encodeURIComponent(name)},dessert`,
  `https://source.unsplash.com/800x600/?cake,recipe`,
  `https://source.unsplash.com/800x600/?homemade,dessert`
];

function App() {
  const [query, setQuery] = useState('');
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servings, setServings] = useState(1);
  const [showAuth, setShowAuth] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [logged, setLogged] = useState(false);

  const monthKey = new Date().toISOString().slice(0,7);
  const usageKey = `doce-renda-usage-${monthKey}`;
  const cacheKey = 'doce-renda-recipe-cache';
  const [usage, setUsage] = useState(() => Number(localStorage.getItem(usageKey) || 0));
  const [cache, setCache] = useState(() => { try { return JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch { return {}; } });

  const remaining = Math.max(0, LIMIT - usage);
  const scale = recipe ? servings / (recipe.rendimento_base || 1) : 1;
  const images = useMemo(() => recipe ? exampleImages(recipe.nome) : [], [recipe]);

  function formatNum(n) { const r = Math.round(n*100)/100; return r % 1 === 0 ? String(r) : r.toFixed(2).replace(/0+$/,'').replace(/\.$/,''); }

  async function buscarReceita(e) {
    e?.preventDefault();
    const term = query.trim().toLowerCase();
    setError('');
    if (!term) return setError('Digite o nome de uma receita para buscar.');
    if (usage >= LIMIT) return setError('Seu limite mensal de 50 buscas foi atingido. Recarregue mais 50 buscas por R$ 810 para continuar.');
    if (cache[term]) { setRecipe(cache[term]); setServings(cache[term].rendimento_base || 1); return; }
    setLoading(true);
    try {
      // Substitua esta demonstração pela sua função segura/serverless que chama a API.
      await new Promise(r => setTimeout(r, 700));
      const result = {...INITIAL_RECIPE, nome: query.trim()};
      const nextCache = {...cache, [term]: result};
      const nextUsage = usage + 1;
      setCache(nextCache); localStorage.setItem(cacheKey, JSON.stringify(nextCache));
      setUsage(nextUsage); localStorage.setItem(usageKey, String(nextUsage));
      setRecipe(result); setServings(result.rendimento_base || 1);
    } catch { setError('Não consegui encontrar essa receita agora. Tente novamente.'); }
    finally { setLoading(false); }
  }

  function login(e) { e.preventDefault(); setLogged(true); setShowAuth(false); }
  function recover(e) { e.preventDefault(); setShowRecovery(false); setError(`Se existir uma conta para ${email}, enviaremos instruções de recuperação.`); }

  return <div className="app">
    <header><div><div className="brand">Doce Renda</div><div className="tag">Receitas inteligentes para vender mais</div></div><button className="account" onClick={()=>setShowAuth(true)}>{logged ? 'Minha conta' : 'Entrar'}</button></header>
    <main>
      <section className="hero"><span className="pill">INFOAPP • RECEITAS IA</span><h1>Encontre a receita.<br/><em>Faça render.</em></h1><p>Pesquise receitas, ajuste o rendimento e tenha tudo organizado em segundos.</p></section>
      <div className="usage"><div><strong>{remaining}</strong> buscas restantes</div><div className="bar"><span style={{width:`${Math.min(100, usage/LIMIT*100)}%`}}/></div><small>{usage}/{LIMIT} usadas neste mês</small></div>
      <form onSubmit={buscarReceita} className="search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ex.: bolo de pote de ninho"/><button disabled={loading}>{loading ? 'Buscando...' : 'Buscar receita'}</button></form>
      {error && <div className="error">⚠ {error}</div>}
      {usage >= LIMIT && <button className="buy" onClick={()=>alert('Checkout de recompra: conecte aqui seu gateway de pagamento.')}>Recomprar 50 buscas — R$ {PRICE}</button>}
      {recipe && <article className="recipe">
        <div className="recipeHead"><div><span className="pill">RECEITA ENCONTRADA</span><h2>{recipe.nome}</h2><p>{recipe.tempo} • rende {recipe.rendimento_base} {recipe.unidade_rendimento}(s)</p></div></div>
        <div className="gallery">{images.map((src,i)=><img key={i} src={src} alt={`Exemplo de ${recipe.nome}`} onError={e=>e.currentTarget.style.display='none'}/>)}</div>
        <div className="portion"><b>Quantidade</b><div><button type="button" onClick={()=>setServings(s=>Math.max(1,s-1))}>−</button><input type="number" min="1" value={servings} onChange={e=>setServings(Math.max(1,Number(e.target.value)||1))}/><button type="button" onClick={()=>setServings(s=>s+1)}>+</button></div></div>
        <h3>Ingredientes</h3><ul>{recipe.ingredientes.map((x,i)=><li key={i}><b>{formatNum(x.quantidade*scale)} {x.unidade}</b> de {x.nome}</li>)}</ul>
        <h3>Modo de preparo</h3><ol>{recipe.modo_preparo.map((x,i)=><li key={i}><span>{i+1}</span>{x}</li>)}</ol>
      </article>}
      {!recipe && !loading && <div className="empty">🍰<h3>Comece sua busca</h3><p>Digite uma receita acima para ver ingredientes, preparo e imagens de referência.</p></div>}
    </main>
    {showAuth && <div className="modal"><form onSubmit={login} className="card"><button type="button" className="close" onClick={()=>setShowAuth(false)}>×</button><h2>Entrar na conta</h2><input required type="email" placeholder="Seu e-mail"/><input required type="password" placeholder="Sua senha"/><button className="primary">Entrar</button><button type="button" className="link" onClick={()=>{setShowAuth(false);setShowRecovery(true)}}>Esqueci minha senha</button></form></div>}
    {showRecovery && <div className="modal"><form onSubmit={recover} className="card"><button type="button" className="close" onClick={()=>setShowRecovery(false)}>×</button><h2>Recuperar senha</h2><p>Informe seu e-mail e enviaremos as instruções.</p><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Seu e-mail"/><button className="primary">Enviar recuperação</button></form></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
