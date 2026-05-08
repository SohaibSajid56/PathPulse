import { useEffect, useMemo, useState } from 'react'

const API = 'http://127.0.0.1:8000'
const ROLES = ['Frontend', 'Backend', 'ML Engineer', 'Full Stack', 'DevOps']

const DEMAND = [
  { skill: 'LLM Fine-tuning', score: 95, trend: '+31%', hot: true },
  { skill: 'Next.js', score: 92, trend: '+12%', hot: true },
  { skill: 'TypeScript', score: 89, trend: '+7%', hot: false },
  { skill: 'FastAPI', score: 87, trend: '+9%', hot: false },
  { skill: 'Kubernetes', score: 78, trend: '+5%', hot: false },
  { skill: 'Rust', score: 71, trend: '+18%', hot: false },
]

const SEGMENTS = [
  { p: '40%', l: 'Entry-level Engineers' },
  { p: '35%', l: 'Mid-career Professionals' },
  { p: '25%', l: 'Career Pivoters' },
]

const REGIONS = [
  { r: 'North America', p: 45 },
  { r: 'Asia-Pacific', p: 35 },
  { r: 'Europe', p: 20 },
]

function parseError(detail = '') {
  const d = String(detail).toLowerCase()

  if (d.includes('failed to fetch') || d.includes('network') || d.includes('econnrefused')) {
    return {
      emoji: '🔌',
      title: 'Backend Not Running',
      msg: 'The frontend cannot reach your FastAPI server.',
      steps: [
        'Open a terminal in your project folder',
        'Run: python main.py',
        'Confirm the server is listening on http://127.0.0.1:8000',
      ],
    }
  }

  if (d.includes('model_decommissioned') || d.includes('decommissioned') || d.includes('invalid_request_error')) {
    return {
      emoji: '🤖',
      title: 'AI Model Unavailable',
      msg: 'The backend is reachable, but the configured AI model is not active.',
      steps: [
        'Open main.py',
        'Switch MODEL to an active model supported by your provider',
        'Restart the backend server',
      ],
    }
  }

  if (d.includes('quota') || d.includes('resource_exhausted') || d.includes('429')) {
    return {
      emoji: '⚡',
      title: 'Rate Limit Reached',
      msg: 'The AI service is temporarily rate-limited.',
      steps: [
        'Wait a short while and try again',
        'Reduce repeated clicks on Generate / Submit',
        'Check your provider dashboard for usage limits',
      ],
    }
  }

  if (d.includes('api') || d.includes('key') || d.includes('unauthorized') || d.includes('401')) {
    return {
      emoji: '🔑',
      title: 'API Configuration Error',
      msg: 'There is an issue with the AI API configuration.',
      steps: [
        'Check your .env file',
        'Verify the API key name and value',
        'Restart the backend after changes',
      ],
    }
  }

  return {
    emoji: '⚠️',
    title: 'Server Error',
    msg: detail || 'Something went wrong on the server.',
    steps: ['Check your backend terminal for the exact error message.'],
  }
}

const CSS = `
  :root{
    --bg0:#f6f2ea;
    --bg1:#fcfaf6;
    --bg2:#f1ede6;
    --bg3:#e6dfd5;
    --ink:#0c0c0c;
    --ink2:#1f1f1f;
    --muted:#6d6a63;
    --dim:#a8a39a;
    --line:#ded7cc;
    --line2:#cfc6b8;
    --green:#0cbf74;
    --green2:#0a9a5f;
    --red:#e13d3d;
    --amber:#cc8200;
    --blue:#1e6fe8;
    --shadow:0 18px 50px rgba(22,16,8,.08);
    --shadow2:0 12px 30px rgba(22,16,8,.06);
  }

  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    margin:0;
    min-height:100vh;
    background:
      radial-gradient(circle at top left, rgba(12,191,116,.10), transparent 28%),
      radial-gradient(circle at top right, rgba(30,111,232,.08), transparent 26%),
      linear-gradient(180deg, var(--bg1), var(--bg0));
    color:var(--ink);
  }
  button,select,textarea,input{font-family:inherit}
  a{color:inherit}

  .app-shell{
    min-height:100vh;
    display:flex;
    flex-direction:column;
  }

  .topbar{
    position:sticky;
    top:0;
    z-index:50;
    backdrop-filter:blur(18px);
    background:rgba(252,250,246,.78);
    border-bottom:1px solid rgba(222,215,204,.85);
  }
  .topbar-inner{
    max-width:1280px;
    margin:0 auto;
    padding:16px 36px;
    display:flex;
    align-items:center;
    gap:18px;
  }
  .brand{
    display:flex;
    align-items:center;
    gap:12px;
    text-decoration:none;
    color:var(--ink);
    flex-shrink:0;
  }
  .brand-mark{
    width:38px;
    height:38px;
    border-radius:12px;
    background:linear-gradient(145deg,#111,#2b2b2b);
    display:grid;
    place-items:center;
    box-shadow:var(--shadow2);
  }
  .brand-mark svg{width:20px;height:20px}
  .brand-name{
    font-family:var(--font-d);
    font-size:22px;
    font-weight:900;
    letter-spacing:.04em;
    text-transform:uppercase;
    line-height:1;
  }

  .nav{
    display:flex;
    align-items:center;
    gap:6px;
    margin-left:24px;
    flex:1;
    overflow:auto;
    scrollbar-width:none;
  }
  .nav::-webkit-scrollbar{display:none}
  .nav-btn{
    position:relative;
    border:none;
    background:transparent;
    padding:12px 16px;
    font-family:var(--font-b);
    font-size:12px;
    font-weight:700;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:var(--muted);
    cursor:pointer;
    white-space:nowrap;
    transition:color .18s ease, transform .18s ease;
  }
  .nav-btn:hover{color:var(--ink);transform:translateY(-1px)}
  .nav-btn.active{color:var(--ink)}
  .nav-btn.active::after{
    content:'';
    position:absolute;
    left:16px;
    right:16px;
    bottom:-16px;
    height:3px;
    border-radius:999px;
    background:var(--ink);
  }

  .nav-cta{
    border:none;
    background:linear-gradient(145deg,#111,#202020);
    color:#fff;
    padding:11px 18px;
    border-radius:12px;
    font-family:var(--font-b);
    font-size:12px;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
    cursor:pointer;
    box-shadow:var(--shadow2);
    transition:transform .18s ease, box-shadow .18s ease, opacity .18s ease;
  }
  .nav-cta:hover{transform:translateY(-1px);opacity:.96;box-shadow:var(--shadow)}
  .nav-cta:disabled{opacity:.5;cursor:not-allowed}

  .hero{
    max-width:1280px;
    margin:0 auto;
    padding:28px 36px 8px;
    display:grid;
    grid-template-columns:1.1fr .9fr;
    gap:22px;
    align-items:stretch;
  }
  .hero-card{
    border:1px solid rgba(222,215,204,.9);
    background:linear-gradient(180deg, rgba(255,255,255,.80), rgba(255,255,255,.58));
    border-radius:28px;
    box-shadow:var(--shadow);
    overflow:hidden;
  }
  .hero-main{
    padding:34px;
    min-height:290px;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
  }
  .eyebrow{
    display:inline-flex;
    align-items:center;
    gap:8px;
    font-family:var(--font-m);
    font-size:10px;
    letter-spacing:.16em;
    text-transform:uppercase;
    color:var(--green2);
    margin-bottom:16px;
  }
  .eyebrow::before{
    content:'';
    width:18px;
    height:2px;
    border-radius:999px;
    background:var(--green);
  }
  .hero-title{
    margin:0;
    font-family:var(--font-d);
    font-size:clamp(54px,6vw,88px);
    line-height:.88;
    letter-spacing:-.03em;
    text-transform:uppercase;
    color:var(--ink);
    max-width:11ch;
  }
  .hero-title em{
    font-style:italic;
    color:var(--green2);
  }
  .hero-sub{
    margin:16px 0 0;
    max-width:540px;
    color:var(--muted);
    font-size:15px;
    line-height:1.8;
  }
  .hero-actions{
    display:flex;
    flex-wrap:wrap;
    gap:12px;
    margin-top:28px;
  }

  .btn{
    border:none;
    border-radius:14px;
    padding:13px 20px;
    font-family:var(--font-b);
    font-size:12px;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
    cursor:pointer;
    transition:transform .18s ease, box-shadow .18s ease, background .18s ease, color .18s ease, border-color .18s ease, opacity .18s ease;
    display:inline-flex;
    align-items:center;
    gap:10px;
  }
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .btn-primary{
    background:linear-gradient(145deg,#111,#242424);
    color:#fff;
    box-shadow:var(--shadow2);
  }
  .btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:var(--shadow)}
  .btn-secondary{
    background:rgba(255,255,255,.72);
    color:var(--ink);
    border:1px solid var(--line2);
  }
  .btn-secondary:hover:not(:disabled){transform:translateY(-1px);background:#fff}

  .hero-side{
    padding:20px;
    display:grid;
    gap:14px;
    grid-template-columns:1fr 1fr;
    align-content:stretch;
  }
  .mini-stat{
    border:1px solid rgba(222,215,204,.9);
    border-radius:22px;
    background:rgba(255,255,255,.78);
    padding:22px 18px;
    box-shadow:var(--shadow2);
    min-height:122px;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
  }
  .mini-value{
    font-family:var(--font-d);
    font-size:44px;
    line-height:1;
    font-weight:900;
    letter-spacing:-.03em;
    color:var(--ink);
  }
  .mini-value span{color:var(--green2)}
  .mini-label{
    font-size:11px;
    font-family:var(--font-m);
    letter-spacing:.12em;
    text-transform:uppercase;
    color:var(--muted);
  }
  .mini-note{
    margin-top:8px;
    color:var(--muted);
    font-size:13px;
    line-height:1.5;
  }

  .content{
    max-width:1280px;
    margin:0 auto;
    padding:18px 36px 0;
    flex:1;
  }

  .section-head{
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
    gap:16px;
    padding:18px 0 22px;
    border-bottom:1px solid rgba(222,215,204,.9);
    margin-bottom:0;
  }
  .section-title{
    margin:0;
    font-family:var(--font-d);
    font-size:34px;
    line-height:1;
    letter-spacing:.03em;
    text-transform:uppercase;
  }
  .section-sub{
    margin-top:8px;
    color:var(--muted);
    font-size:13px;
    line-height:1.6;
  }

  .controls{
    display:flex;
    flex-wrap:wrap;
    border-bottom:1px solid rgba(222,215,204,.9);
    background:rgba(255,255,255,.32);
  }
  .control-group{
    display:flex;
    align-items:center;
    gap:12px;
    padding:14px 20px;
    border-right:1px solid rgba(222,215,204,.9);
    flex-wrap:wrap;
  }
  .control-label{
    font-family:var(--font-m);
    font-size:10px;
    font-weight:700;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--dim);
  }
  .control-select{
    border:none;
    background:transparent;
    color:var(--ink);
    font-size:14px;
    font-weight:700;
    outline:none;
    appearance:none;
    padding-right:18px;
    cursor:pointer;
    background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236d6a63' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat;
    background-position:right 2px center;
  }
  .control-btn{
    border:1px solid var(--line2);
    background:rgba(255,255,255,.72);
    color:var(--ink);
    border-radius:12px;
    padding:10px 16px;
    font-size:11px;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    gap:8px;
    transition:transform .18s ease, background .18s ease, color .18s ease, border-color .18s ease, opacity .18s ease;
  }
  .control-btn:hover:not(:disabled){
    transform:translateY(-1px);
    background:#fff;
    border-color:var(--ink);
  }
  .control-btn.primary{
    background:linear-gradient(145deg,#111,#242424);
    color:#fff;
    border-color:#111;
  }
  .control-btn.primary:hover:not(:disabled){
    background:linear-gradient(145deg,#111,#111);
    border-color:#111;
  }
  .control-btn:disabled{opacity:.45;cursor:not-allowed}

  .workspace{
    display:grid;
    grid-template-columns:minmax(0,1fr) 340px;
    gap:22px;
    align-items:start;
    padding-top:24px;
    padding-bottom:32px;
  }

  .main-panel,.side-panel{
    min-width:0;
  }

  .paper-card{
    background:rgba(255,255,255,.84);
    border:1px solid rgba(222,215,204,.95);
    border-radius:24px;
    box-shadow:var(--shadow2);
    overflow:hidden;
  }

  .empty-state{
    padding:64px 28px;
    text-align:center;
    background:
      radial-gradient(circle at top, rgba(12,191,116,.10), transparent 44%),
      rgba(255,255,255,.75);
  }
  .empty-number{
    font-family:var(--font-d);
    font-size:76px;
    line-height:1;
    font-weight:900;
    color:rgba(168,163,154,.30);
    letter-spacing:-.04em;
    margin-bottom:10px;
  }
  .empty-text{
    margin:0;
    color:var(--muted);
    font-size:14px;
    line-height:1.7;
  }

  .error-card{
    border:1px solid rgba(225,61,61,.24);
    background:linear-gradient(180deg, rgba(255,243,243,.95), rgba(255,255,255,.92));
    border-radius:22px;
    overflow:hidden;
    box-shadow:var(--shadow2);
    margin-bottom:20px;
  }
  .error-head{
    display:flex;
    align-items:center;
    gap:14px;
    padding:18px 20px;
    border-bottom:1px solid rgba(225,61,61,.16);
  }
  .error-badge{
    width:38px;
    height:38px;
    border-radius:999px;
    display:grid;
    place-items:center;
    background:#f03e3e;
    color:#fff;
    flex-shrink:0;
    font-size:17px;
  }
  .error-title{
    flex:1;
    font-family:var(--font-d);
    font-size:18px;
    font-weight:900;
    letter-spacing:.04em;
    text-transform:uppercase;
    color:#871d1d;
  }
  .error-close{
    border:none;
    background:transparent;
    cursor:pointer;
    color:#a35a5a;
    font-size:22px;
    line-height:1;
    padding:0;
  }
  .error-body{padding:18px 20px 20px}
  .error-msg{
    margin:0 0 14px;
    color:#5f1b1b;
    font-size:14px;
    font-weight:600;
    line-height:1.6;
  }
  .error-steps-title{
    margin:0 0 10px;
    font-family:var(--font-m);
    font-size:10px;
    font-weight:800;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--dim);
  }
  .error-steps{
    margin:0 0 12px;
    padding:0;
    list-style:none;
    display:grid;
    gap:8px;
  }
  .error-steps li{
    display:flex;
    gap:10px;
    color:var(--ink2);
    font-size:13px;
    line-height:1.55;
  }
  .error-num{
    width:20px;
    height:20px;
    border-radius:999px;
    background:var(--ink);
    color:#fff;
    display:grid;
    place-items:center;
    flex-shrink:0;
    font-size:10px;
    font-weight:800;
    margin-top:1px;
  }

  .question-card{
    padding:26px;
    position:relative;
    border-radius:24px;
    background:
      linear-gradient(180deg, rgba(255,255,255,.94), rgba(255,255,255,.82));
    overflow:hidden;
  }
  .question-card::before{
    content:'';
    position:absolute;
    top:0;left:0;bottom:0;
    width:4px;
    background:linear-gradient(180deg,var(--green),#2be08f);
  }
  .q-meta{
    display:flex;
    align-items:center;
    gap:10px;
    margin-bottom:16px;
    flex-wrap:wrap;
  }
  .tag{
    display:inline-flex;
    align-items:center;
    gap:6px;
    border:1px solid var(--line);
    background:rgba(255,255,255,.8);
    color:var(--muted);
    border-radius:999px;
    padding:5px 10px;
    font-family:var(--font-m);
    font-size:10px;
    font-weight:800;
    letter-spacing:.12em;
    text-transform:uppercase;
  }
  .tag.soft{
    color:var(--green2);
    border-color:rgba(12,191,116,.22);
    background:rgba(12,191,116,.08);
  }
  .q-id{
    margin-left:auto;
    font-family:var(--font-m);
    font-size:10px;
    color:var(--dim);
    letter-spacing:.12em;
  }
  .q-text{
    margin:0;
    font-size:18px;
    line-height:1.85;
    color:var(--ink2);
    max-width:64ch;
  }

  .input-label{
    display:block;
    margin:18px 0 10px;
    font-family:var(--font-m);
    font-size:10px;
    font-weight:800;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--dim);
  }
  .answer-wrap{
    position:relative;
  }
  .answer{
    width:100%;
    min-height:220px;
    resize:vertical;
    border:1px solid var(--line2);
    border-radius:22px;
    padding:18px 18px 56px;
    background:rgba(255,255,255,.92);
    color:var(--ink2);
    font-size:15px;
    line-height:1.8;
    outline:none;
    transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease;
  }
  .answer::placeholder{color:#b5afa4}
  .answer:focus{
    border-color:rgba(12,191,116,.55);
    box-shadow:0 0 0 4px rgba(12,191,116,.08);
  }
  .answer-foot{
    position:absolute;
    left:0;right:0;bottom:0;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    padding:10px 14px;
    border-top:1px solid rgba(222,215,204,.9);
    background:linear-gradient(180deg, rgba(248,244,236,.92), rgba(241,237,230,.98));
    border-radius:0 0 22px 22px;
  }
  .wordcount{
    font-family:var(--font-m);
    font-size:10px;
    color:var(--dim);
    letter-spacing:.12em;
    text-transform:uppercase;
  }
  .mic{
    border:1px solid var(--line2);
    background:#fff;
    color:var(--muted);
    border-radius:12px;
    padding:8px 12px;
    font-size:10px;
    font-weight:800;
    letter-spacing:.12em;
    text-transform:uppercase;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    gap:8px;
    transition:transform .18s ease, border-color .18s ease, color .18s ease;
  }
  .mic:hover{transform:translateY(-1px);border-color:var(--ink);color:var(--ink)}
  .mic.live{
    border-color:rgba(225,61,61,.35);
    color:var(--red);
    animation:micPulse 1.15s ease-in-out infinite;
  }
  @keyframes micPulse{
    0%,100%{opacity:1}
    50%{opacity:.55}
  }

  .actions{
    display:flex;
    flex-wrap:wrap;
    gap:12px;
    margin-top:16px;
  }

  .loading{
    display:flex;
    align-items:center;
    gap:14px;
    margin-top:18px;
    padding:16px 18px;
    border-radius:18px;
    border:1px solid var(--line);
    background:rgba(255,255,255,.72);
  }
  .spinner{
    width:18px;height:18px;
    border:2px solid var(--line2);
    border-top-color:var(--ink);
    border-radius:50%;
    animation:spin .75s linear infinite;
    flex-shrink:0;
  }
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-title{
    font-size:13px;
    font-weight:700;
    color:var(--ink2);
    margin-bottom:2px;
  }
  .loading-sub{
    font-size:12px;
    color:var(--muted);
  }

  .score-banner{
    margin-top:22px;
    border-radius:24px 24px 0 0;
    background:linear-gradient(135deg,#111,#202020 65%, #131313);
    color:#fff;
    padding:22px 24px;
    display:flex;
    align-items:center;
    gap:18px;
    box-shadow:var(--shadow2);
  }
  .score-big{
    font-family:var(--font-d);
    font-size:58px;
    line-height:1;
    font-weight:900;
    letter-spacing:-.04em;
  }
  .score-info{flex:1}
  .score-grade{
    font-family:var(--font-d);
    font-size:20px;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:.05em;
    margin-bottom:8px;
  }
  .score-track{
    width:min(240px,100%);
    height:5px;
    border-radius:999px;
    background:rgba(255,255,255,.14);
    overflow:hidden;
  }
  .score-fill{
    height:100%;
    border-radius:999px;
    transition:width .9s cubic-bezier(.22,1,.36,1);
  }
  .score-note{
    margin-top:8px;
    font-family:var(--font-m);
    font-size:10px;
    letter-spacing:.12em;
    text-transform:uppercase;
    color:rgba(255,255,255,.42);
  }

  .feedback{
    background:rgba(255,255,255,.9);
    border:1px solid var(--line);
    border-top:none;
    border-radius:0 0 24px 24px;
    padding:22px 24px;
    box-shadow:var(--shadow2);
  }
  .feedback-grid{
    display:grid;
    gap:18px;
  }
  .feedback-section{
    border:1px solid rgba(222,215,204,.9);
    border-radius:18px;
    padding:16px 16px 12px;
    background:linear-gradient(180deg,#fff,rgba(255,255,255,.72));
  }
  .feedback-head{
    margin:0 0 10px;
    font-family:var(--font-m);
    font-size:10px;
    font-weight:800;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--dim);
    border-bottom:1px solid var(--line);
    padding-bottom:8px;
  }
  .feedback-item{
    display:flex;
    gap:10px;
    margin-bottom:8px;
    font-size:13px;
    line-height:1.6;
    color:var(--ink2);
  }
  .feedback-ic{
    font-family:var(--font-m);
    font-size:11px;
    font-weight:900;
    flex-shrink:0;
    margin-top:1px;
  }
  .feedback-ic.good{color:var(--green2)}
  .feedback-ic.bad{color:var(--red)}
  .feedback-ic.tip{color:var(--blue)}
  .raw-feedback{
    margin:0;
    white-space:pre-wrap;
    font-size:13.5px;
    line-height:1.75;
    color:var(--ink2);
  }

  .side-stack{
    display:grid;
    gap:18px;
  }
  .side-title{
    margin:0 0 10px;
    font-family:var(--font-m);
    font-size:10px;
    font-weight:800;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--dim);
  }
  .step-list{
    display:grid;
    gap:10px;
  }
  .step-card{
    border:1px solid rgba(222,215,204,.9);
    border-radius:18px;
    background:rgba(255,255,255,.82);
    padding:14px 14px 14px 14px;
    box-shadow:var(--shadow2);
    position:relative;
    overflow:hidden;
  }
  .step-card::before{
    content:'';
    position:absolute;
    left:0;top:0;bottom:0;
    width:3px;
    background:linear-gradient(180deg,var(--green),#2be08f);
  }
  .step-kicker{
    font-family:var(--font-m);
    font-size:9px;
    letter-spacing:.16em;
    text-transform:uppercase;
    color:var(--dim);
    margin-bottom:6px;
  }
  .step-text{
    font-size:13px;
    line-height:1.55;
    color:var(--ink2);
  }
  .step-text strong{color:var(--ink)}

  .skill-grid{
    display:grid;
    grid-template-columns:repeat(2, minmax(0,1fr));
    gap:14px;
  }
  .insight-card{
    border:1px solid rgba(222,215,204,.9);
    border-radius:18px;
    background:rgba(255,255,255,.82);
    padding:18px;
    box-shadow:var(--shadow2);
  }
  .insight-title{
    font-family:var(--font-d);
    font-size:18px;
    line-height:1;
    font-weight:900;
    text-transform:uppercase;
    letter-spacing:.04em;
    margin:0 0 8px;
  }
  .insight-sub{
    font-size:12px;
    color:var(--muted);
    line-height:1.6;
    margin-bottom:10px;
  }
  .demand-row{
    margin-bottom:14px;
  }
  .demand-top{
    display:flex;
    justify-content:space-between;
    gap:10px;
    align-items:center;
    margin-bottom:6px;
  }
  .demand-name{
    display:flex;
    align-items:center;
    gap:8px;
    min-width:0;
    font-size:13px;
    font-weight:700;
    color:var(--ink);
  }
  .hot{
    font-family:var(--font-m);
    font-size:9px;
    font-weight:800;
    letter-spacing:.12em;
    text-transform:uppercase;
    background:rgba(225,61,61,.08);
    color:var(--red);
    border:1px solid rgba(225,61,61,.18);
    border-radius:999px;
    padding:2px 7px;
    flex-shrink:0;
  }
  .demand-stats{
    display:flex;
    gap:10px;
    font-family:var(--font-m);
    font-size:11px;
    white-space:nowrap;
  }
  .trend{color:var(--green2)}
  .score{color:var(--muted)}
  .bar{
    height:6px;
    border-radius:999px;
    background:rgba(230,223,213,.9);
    overflow:hidden;
  }
  .bar-fill{
    height:100%;
    border-radius:999px;
    background:linear-gradient(90deg,#111,#333);
    transition:width 1.05s cubic-bezier(.22,1,.36,1);
  }

  .segment-grid{
    display:grid;
    grid-template-columns:repeat(3, minmax(0,1fr));
    gap:10px;
  }
  .segment{
    border:1px solid rgba(222,215,204,.9);
    border-radius:16px;
    padding:16px 14px;
    background:linear-gradient(180deg, rgba(255,255,255,.9), rgba(245,240,232,.8));
    text-align:left;
  }
  .segment-value{
    font-family:var(--font-d);
    font-size:30px;
    line-height:1;
    font-weight:900;
    letter-spacing:-.04em;
    margin-bottom:8px;
  }
  .segment-label{
    font-size:11px;
    color:var(--muted);
    line-height:1.5;
  }

  .session-list{
    display:grid;
    gap:10px;
  }
  .session{
    display:grid;
    grid-template-columns:68px minmax(0,1fr);
    gap:14px;
    align-items:center;
    padding:16px;
    border-radius:18px;
    border:1px solid rgba(222,215,204,.9);
    background:rgba(255,255,255,.84);
    box-shadow:var(--shadow2);
  }
  .session-score{
    font-family:var(--font-d);
    font-size:34px;
    line-height:1;
    font-weight:900;
    text-align:center;
  }
  .session-meta{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin-bottom:6px;
  }
  .session-question{
    font-size:13px;
    line-height:1.55;
    color:var(--ink2);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    margin-bottom:4px;
  }
  .session-answer{
    font-size:12px;
    line-height:1.55;
    color:var(--muted);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .history-empty{
    padding:72px 24px;
    text-align:center;
    border-radius:24px;
    border:1px dashed rgba(207,198,184,.95);
    background:rgba(255,255,255,.72);
    box-shadow:var(--shadow2);
  }
  .history-empty-number{
    font-family:var(--font-d);
    font-size:64px;
    line-height:1;
    font-weight:900;
    color:rgba(168,163,154,.28);
    margin-bottom:8px;
  }
  .history-empty-text{
    color:var(--muted);
    font-size:14px;
    line-height:1.7;
    margin:0;
  }

  .history-grid{
    display:grid;
    gap:12px;
    margin-top:18px;
  }
  .history-item{
    display:grid;
    grid-template-columns:76px minmax(0,1fr);
    gap:16px;
    align-items:center;
    padding:18px;
    border-radius:22px;
    background:rgba(255,255,255,.86);
    border:1px solid rgba(222,215,204,.95);
    box-shadow:var(--shadow2);
  }
  .history-score{
    font-family:var(--font-d);
    font-size:36px;
    line-height:1;
    font-weight:900;
    text-align:center;
  }
  .history-question{
    font-size:13px;
    font-weight:700;
    color:var(--ink);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    margin-bottom:4px;
  }
  .history-answer{
    font-size:12px;
    color:var(--muted);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .history-meta{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin-bottom:8px;
  }

  .footer{
    border-top:1px solid rgba(222,215,204,.9);
    background:rgba(252,250,246,.8);
    margin-top:16px;
  }
  .footer-inner{
    max-width:1280px;
    margin:0 auto;
    padding:24px 36px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:18px;
    flex-wrap:wrap;
  }
  .footer-left{
    display:flex;
    align-items:center;
    gap:14px;
    flex-wrap:wrap;
  }
  .footer-brand{
    font-family:var(--font-d);
    font-size:18px;
    font-weight:900;
    text-transform:uppercase;
    letter-spacing:.04em;
  }
  .footer-id{
    font-family:var(--font-m);
    font-size:11px;
    color:var(--dim);
  }
  .footer-links{
    display:flex;
    gap:20px;
    flex-wrap:wrap;
  }
  .footer-link{
    border:none;
    background:none;
    padding:0;
    cursor:pointer;
    font-family:var(--font-m);
    font-size:11px;
    letter-spacing:.12em;
    text-transform:uppercase;
    color:var(--muted);
    transition:color .18s ease, transform .18s ease;
  }
  .footer-link:hover{color:var(--ink);transform:translateY(-1px)}

  .cur{
    display:inline-block;
    width:2px;
    height:.9em;
    vertical-align:text-bottom;
    background:var(--green2);
    animation:blink 1s infinite;
    margin-left:2px;
    border-radius:999px;
  }
  @keyframes blink{
    0%,100%{opacity:1}
    50%{opacity:0}
  }

  @media (max-width: 1100px){
    .hero{grid-template-columns:1fr}
    .hero-side{grid-template-columns:repeat(4,minmax(0,1fr))}
    .workspace{grid-template-columns:1fr}
    .side-panel{order:2}
  }
  @media (max-width: 900px){
    .topbar-inner,.hero,.content,.footer-inner{padding-left:18px;padding-right:18px}
    .hero-main{padding:24px}
    .hero-side{grid-template-columns:repeat(2,minmax(0,1fr))}
    .section-title{font-size:28px}
    .controls{display:grid}
    .control-group{border-right:none;border-bottom:1px solid rgba(222,215,204,.9)}
    .skill-grid,.segment-grid{grid-template-columns:1fr}
    .session,.history-item{grid-template-columns:1fr}
    .session-score,.history-score{text-align:left}
    .nav{display:none}
  }
`

function TypingText({ text }) {
  const [out, setOut] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setOut('')
    setDone(false)
    if (!text) return

    let i = 0
    const iv = setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(iv)
        setDone(true)
      }
    }, 14)

    return () => clearInterval(iv)
  }, [text])

  return (
    <span>
      {out}
      {!done && <span className="cur" />}
    </span>
  )
}

function ErrorCard({ detail, onDismiss }) {
  const e = parseError(detail)

  return (
    <div className="error-card">
      <div className="error-head">
        <div className="error-badge">{e.emoji}</div>
        <div className="error-title">{e.title}</div>
        <button className="error-close" onClick={onDismiss} aria-label="Dismiss error">
          ×
        </button>
      </div>
      <div className="error-body">
        <p className="error-msg">{e.msg}</p>
        <div className="error-steps-title">How to fix it</div>
        <ol className="error-steps">
          {e.steps.map((s, i) => (
            <li key={i}>
              <span className="error-num">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function ScoreBanner({ score }) {
  const color = score >= 80 ? '#0cbf74' : score >= 60 ? '#cc8200' : '#e13d3d'
  const grade = score >= 90 ? 'Excellent' : score >= 75 ? 'Strong' : score >= 60 ? 'Fair' : 'Needs Work'

  return (
    <div className="score-banner">
      <div className="score-big" style={{ color }}>
        {score}
      </div>
      <div className="score-info">
        <div className="score-grade">{grade}</div>
        <div className="score-track">
          <div className="score-fill" style={{ width: `${score}%`, background: color }} />
        </div>
        <div className="score-note">AI evaluation · score / 100</div>
      </div>
    </div>
  )
}

function FeedbackCard({ raw }) {
  const sections = useMemo(() => {
    const strengths = []
    const gaps = []
    const tips = []

    raw.split('\n').forEach((line) => {
      const clean = line.trim()
      if (clean.startsWith('✓')) strengths.push(clean.slice(1).trim())
      else if (clean.startsWith('✗')) gaps.push(clean.slice(1).trim())
      else if (clean.startsWith('→')) tips.push(clean.slice(1).trim())
    })

    return { strengths, gaps, tips }
  }, [raw])

  const parsed = sections.strengths.length || sections.gaps.length || sections.tips.length

  if (!parsed) {
    return (
      <div className="feedback">
        <p className="raw-feedback">{raw}</p>
      </div>
    )
  }

  return (
    <div className="feedback">
      <div className="feedback-grid">
        {sections.strengths.length > 0 && (
          <section className="feedback-section">
            <div className="feedback-head">Strengths</div>
            {sections.strengths.map((item, i) => (
              <div key={i} className="feedback-item">
                <span className="feedback-ic good">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </section>
        )}

        {sections.gaps.length > 0 && (
          <section className="feedback-section">
            <div className="feedback-head">Gaps</div>
            {sections.gaps.map((item, i) => (
              <div key={i} className="feedback-item">
                <span className="feedback-ic bad">✗</span>
                <span>{item}</span>
              </div>
            ))}
          </section>
        )}

        {sections.tips.length > 0 && (
          <section className="feedback-section">
            <div className="feedback-head">How to Improve</div>
            {sections.tips.map((item, i) => (
              <div key={i} className="feedback-item">
                <span className="feedback-ic tip">→</span>
                <span>{item}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

function DemandBar({ skill, score, trend, hot, animate }) {
  return (
    <div className="demand-row">
      <div className="demand-top">
        <div className="demand-name">
          <span>{skill}</span>
          {hot && <span className="hot">Hot</span>}
        </div>
        <div className="demand-stats">
          <span className="trend">{trend}</span>
          <span className="score">{score}</span>
        </div>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: animate ? `${score}%` : '0%' }} />
      </div>
    </div>
  )
}

function MetricCard({ value, label, note }) {
  return (
    <div className="mini-stat">
      <div className="mini-value">
        {value}
      </div>
      <div>
        <div className="mini-label">{label}</div>
        <div className="mini-note">{note}</div>
      </div>
    </div>
  )
}

function apiErrorMessage(res, data) {
  if (!res.ok) return data?.detail || `HTTP ${res.status}`
  return null
}

export default function Frontend() {
  const [tab, setTab] = useState('interview')
  const [role, setRole] = useState('Frontend')
  const [question, setQuestion] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [listening, setListening] = useState(false)
  const [barsOn, setBarsOn] = useState(false)
  const [annOn, setAnnOn] = useState(true)

  useEffect(() => {
    if (tab === 'market') {
      const t = setTimeout(() => setBarsOn(true), 120)
      return () => clearTimeout(t)
    }
    setBarsOn(false)
  }, [tab])

  const avgScore = useMemo(() => {
    if (!history.length) return null
    return Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length)
  }, [history])

  const callApi = async (path, body) => {
    try {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const text = await res.text()
      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = { detail: text }
      }

      const err = apiErrorMessage(res, data)
      if (err) return { ok: false, errorDetail: err }

      return { ok: true, data }
    } catch {
      return { ok: false, errorDetail: 'Failed to fetch — backend not running.' }
    }
  }

  const startInterview = async () => {
    setLoading(true)
    setError(null)
    setQuestion(null)
    setFeedback(null)
    setScore(null)
    setAnswer('')
    setIsTyping(false)

    const { ok, data, errorDetail } = await callApi('/get-question', { role })
    if (!ok) {
      setError(errorDetail)
      setLoading(false)
      return
    }

    setQuestion(data.question)
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), Math.max(800, data.question.length * 13))
    setLoading(false)
  }

  const submitAnswer = async () => {
    if (!answer.trim() || !question) return

    setLoading(true)
    setError(null)
    setFeedback(null)
    setScore(null)

    const { ok, data, errorDetail } = await callApi('/evaluate', { question, answer, role })
    if (!ok) {
      setError(errorDetail)
      setLoading(false)
      return
    }

    setFeedback(data.feedback)
    const sc = Number.isFinite(data.score) ? data.score : 65
    setScore(sc)

    setHistory((prev) => [
      {
        q: question,
        role,
        score: sc,
        answer: answer.slice(0, 120) + (answer.length > 120 ? '...' : ''),
      },
      ...prev.slice(0, 9),
    ])

    setLoading(false)
  }

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Voice input is not supported in this browser.')
      return
    }

    if (listening) {
      setListening(false)
      return
    }

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => setAnswer(Array.from(e.results).map((r) => r[0].transcript).join(''))
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
  }

  const wc = answer.trim() ? answer.trim().split(/\s+/).length : 0

  return (
    <div className="app-shell">
      <style>{CSS}</style>

      {annOn && (
        <div className="topbar">
          <div className="topbar-inner">
            <a className="brand" href="#top" onClick={(e) => e.preventDefault()}>
              <div className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2.8L20.2 7.6V16.4L12 21.2L3.8 16.4V7.6L12 2.8Z"
                    stroke="#fff"
                    strokeWidth="1.6"
                    opacity=".95"
                  />
                  <path d="M12 7.1L16.3 9.6V14.4L12 16.9L7.7 14.4V9.6L12 7.1Z" fill="#fff" />
                </svg>
              </div>
              <div className="brand-name">PathPulse</div>
            </a>

            <nav className="nav" aria-label="Primary">
              <button className={`nav-btn ${tab === 'interview' ? 'active' : ''}`} onClick={() => setTab('interview')}>
                Interview Lab
              </button>
              <button className={`nav-btn ${tab === 'market' ? 'active' : ''}`} onClick={() => setTab('market')}>
                Market Pulse
              </button>
              <button className={`nav-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
                History
              </button>
            </nav>

            <button className="nav-cta">Get Pro</button>
          </div>
        </div>
      )}

      <section className="hero">
        <div className="hero-card hero-main">
          <div>
            <div className="eyebrow">AI-Powered Career Navigation</div>
            <h1 className="hero-title">
              Train <em>smarter</em>. Land faster.
            </h1>
            <p className="hero-sub">
              Turn interview practice into a measurable system. Generate scenario-based questions,
              answer with text or voice, and get structured feedback you can act on immediately.
            </p>
          </div>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={startInterview} disabled={loading}>
              {loading && !question ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
                  Connecting...
                </>
              ) : (
                'Start Interview'
              )}
            </button>
            <button className="btn btn-secondary" onClick={() => setTab('market')}>
              View Market Data
            </button>
          </div>
        </div>

        <div className="hero-card hero-side">
          <MetricCard value="27M+" label="Engineers" note="Global target audience" />
          <MetricCard value="$8B" label="TAM" note="AI learning and coaching" />
          <MetricCard value="45%" label="Pivot Growth" note="Career switching demand" />
          <MetricCard value={avgScore ?? '—'} label="Avg Score" note={avgScore ? 'Your recent performance' : 'No sessions yet'} />
        </div>
      </section>

      <main className="content">
        {tab === 'interview' && (
          <>
            <div className="section-head">
              <div>
                <h2 className="section-title">Interview Lab</h2>
                <div className="section-sub">Generate questions, answer in depth, and review a structured score breakdown.</div>
              </div>
            </div>

            <div className="controls">
              <div className="control-group">
                <span className="control-label">Role</span>
                <select className="control-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <button className="control-btn primary" onClick={startInterview} disabled={loading}>
                  {loading && !question ? (
                    <>
                      <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#fff' }} />
                      Generating...
                    </>
                  ) : (
                    'Generate Question'
                  )}
                </button>

                {question && (
                  <button
                    className="control-btn"
                    onClick={() => {
                      setQuestion(null)
                      setAnswer('')
                      setFeedback(null)
                      setScore(null)
                      setError(null)
                      setIsTyping(false)
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="workspace">
              <div className="main-panel">
                {error && <ErrorCard detail={error} onDismiss={() => setError(null)} />}

                {!question && !loading && !error && (
                  <div className="paper-card empty-state">
                    <div className="empty-number">01</div>
                    <p className="empty-text">
                      Select a role and generate a question to begin. The AI will create a fresh,
                      role-specific interview prompt each time.
                    </p>
                  </div>
                )}

                {question && (
                  <>
                    <div className="paper-card question-card">
                      <div className="q-meta">
                        <span className="tag">{role}</span>
                        <span className="tag soft">AI Engine</span>
                        <span className="q-id">Q-001</span>
                      </div>
                      <p className="q-text">{isTyping ? <TypingText text={question} /> : question}</p>
                    </div>

                    <label className="input-label">Your Answer</label>
                    <div className="answer-wrap">
                      <textarea
                        className="answer"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Write a structured answer. Use technical specifics, real examples, trade-offs, and clear reasoning."
                        rows={9}
                      />
                      <div className="answer-foot">
                        <span className="wordcount">
                          {wc} {wc === 1 ? 'word' : 'words'}
                        </span>
                        <button className={`mic ${listening ? 'live' : ''}`} onClick={toggleVoice}>
                          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
                            <rect x="2.2" y="0.8" width="5.6" height="6.8" rx="2.8" stroke="currentColor" strokeWidth="1.2" />
                            <path d="M1 6.6c0 2.4 1.8 4.1 4 4.1s4-1.7 4-4.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            <line x1="5" y1="10.7" x2="5" y2="11.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          </svg>
                          {listening ? 'Stop' : 'Voice Input'}
                        </button>
                      </div>
                    </div>

                    <div className="actions">
                      <button
                        className="btn btn-primary"
                        onClick={submitAnswer}
                        disabled={loading || !answer.trim()}
                      >
                        {loading ? (
                          <>
                            <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
                            Evaluating...
                          </>
                        ) : (
                          'Submit Answer'
                        )}
                      </button>

                      {score !== null && !loading && (
                        <button className="btn btn-secondary" onClick={startInterview}>
                          Next Question
                        </button>
                      )}
                    </div>

                    {loading && !feedback && (
                      <div className="loading">
                        <div className="spinner" />
                        <div>
                          <div className="loading-title">AI is evaluating your response</div>
                          <div className="loading-sub">Checking depth, clarity, structure, and accuracy</div>
                        </div>
                      </div>
                    )}

                    {score !== null && !loading && feedback && (
                      <>
                        <ScoreBanner score={score} />
                        <FeedbackCard raw={feedback} />
                      </>
                    )}
                  </>
                )}
              </div>

              <aside className="side-panel">
                <div className="side-stack">
                  <div>
                    <div className="side-title">How It Works</div>
                    <div className="step-list">
                      {[
                        {
                          s: '01',
                          t: 'Select Your Role',
                          d: 'Choose the interview track that matches your target job.',
                        },
                        {
                          s: '02',
                          t: 'Generate a Question',
                          d: 'The backend creates a fresh scenario-based prompt for your selected role.',
                        },
                        {
                          s: '03',
                          t: 'Answer in Depth',
                          d: 'Type or speak your answer. Strong structure and real examples improve the score.',
                        },
                        {
                          s: '04',
                          t: 'Get AI Feedback',
                          d: 'Receive a score plus strengths, gaps, and actionable improvements.',
                        },
                        {
                          s: '05',
                          t: 'Track Progress',
                          d: 'Every session is stored locally in the UI so you can see your improvement.',
                        },
                      ].map((item) => (
                        <div key={item.s} className="step-card">
                          <div className="step-kicker">Step {item.s}</div>
                          <div className="step-text">
                            <strong>{item.t}</strong> — {item.d}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {history.length > 0 && (
                    <div>
                      <div className="side-title">Recent Sessions</div>
                      <div className="session-list">
                        {history.slice(0, 3).map((h, i) => {
                          const c = h.score >= 80 ? 'var(--green2)' : h.score >= 60 ? 'var(--amber)' : 'var(--red)'
                          return (
                            <div key={i} className="session">
                              <div className="session-score" style={{ color: c }}>
                                {h.score}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div className="session-meta">
                                  <span className="tag">{h.role}</span>
                                </div>
                                <div className="session-question">{h.q}</div>
                                <div className="session-answer">{h.answer}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}

        {tab === 'market' && (
          <>
            <div className="section-head">
              <div>
                <h2 className="section-title">Market Pulse</h2>
                <div className="section-sub">
                  A clean, premium view of demand signals, audience segments, and growth indicators.
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 24 }} className="paper-card">
              <div className="hero-card" style={{ boxShadow: 'none', border: 'none', background: 'transparent' }}>
                <div className="hero-side" style={{ padding: 20 }}>
                  <MetricCard value="27M+" label="Engineers" note="Core audience size" />
                  <MetricCard value="$8B" label="Market Size" note="Education and coaching SaaS" />
                  <MetricCard value={avgScore ?? '—'} label="Avg Score" note={avgScore ? `${history.length} sessions completed` : 'Start a session first'} />
                  <MetricCard value="Live" label="Update Mode" note="Prepared for real data integration" />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 22, marginTop: 22 }}>
              <div className="insight-card">
                <div className="insight-title">Skill Demand Index</div>
                <div className="insight-sub">A curated demand snapshot for the most relevant technical skills.</div>
                {DEMAND.map((d) => (
                  <DemandBar key={d.skill} {...d} animate={barsOn} />
                ))}
              </div>

              <div className="insight-card">
                <div className="insight-title">Audience Split</div>
                <div className="insight-sub">The primary user groups the product is designed to serve.</div>
                <div className="segment-grid">
                  {SEGMENTS.map((s) => (
                    <div className="segment" key={s.l}>
                      <div className="segment-value">{s.p}</div>
                      <div className="segment-label">{s.l}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <div className="insight-sub" style={{ marginBottom: 12 }}>
                    Geographic revenue focus
                  </div>
                  {REGIONS.map((g) => (
                    <div key={g.r} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{g.r}</span>
                        <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--muted)' }}>{g.p}%</span>
                      </div>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: barsOn ? `${g.p}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'history' && (
          <>
            <div className="section-head">
              <div>
                <h2 className="section-title">Session History</h2>
                <div className="section-sub">
                  {history.length > 0
                    ? `${history.length} session${history.length > 1 ? 's' : ''} completed${avgScore ? ` · Average: ${avgScore}/100` : ''}`
                    : 'Complete a session to start tracking progress.'}
                </div>
              </div>

              {history.length > 0 && (
                <button className="control-btn primary" onClick={() => setTab('interview')}>
                  New Session →
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="history-empty" style={{ marginTop: 24 }}>
                <div className="history-empty-number">0</div>
                <p className="history-empty-text">
                  No sessions yet. Go to Interview Lab and generate your first question.
                </p>
              </div>
            ) : (
              <div className="history-grid">
                {history.map((h, i) => {
                  const c = h.score >= 80 ? 'var(--green2)' : h.score >= 60 ? 'var(--amber)' : 'var(--red)'
                  return (
                    <div key={i} className="history-item">
                      <div className="history-score" style={{ color: c }}>
                        {h.score}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="history-meta">
                          <span className="tag">{h.role}</span>
                        </div>
                        <div className="history-question">{h.q}</div>
                        <div className="history-answer">{h.answer}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="footer-brand">PathPulse</div>
            <div className="footer-id">BSAI24043 · Muhammad Sohaib Sajid</div>
            <div className="footer-id">Built for career navigation and interview practice</div>
          </div>

          <div className="footer-links">
            {['Pricing', 'About', 'Docs', 'Support'].map((item) => (
              <button key={item} className="footer-link">
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}