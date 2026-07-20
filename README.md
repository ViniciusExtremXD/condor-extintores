# Extintores Condor — Site Institucional

Redesign premium do site da **Condor Comércio de Extintores Ltda** (Campinas/SP, desde 1992).
Stack: HTML5 + CSS puro + JavaScript vanilla, sem build e sem dependências — hospedado no GitHub Pages.

## Estrutura

```
index.html        Página única com todas as seções
css/style.css     Design system (variáveis em :root) + responsivo + motion
js/main.js        Slider, scroll reveal, FAQ, glow, form → WhatsApp
assets/img/       Imagens originais do cliente (logo, banners, clientes)
sitemap.xml       Sitemap para o Google Search Console
robots.txt        Liberação de crawlers + link do sitemap
CNAME             Domínio final (fora do deploy até o go-live — ver abaixo)
```

## Go-live no domínio final

O arquivo `CNAME` está **propositalmente no `.gitignore`**: enquanto o DNS de
`www.extintorescondor.com.br` apontar para a hospedagem antiga, publicar o CNAME
faria o GitHub Pages redirecionar o preview para o site antigo.

Quando o cliente aprovar:

1. No DNS do domínio, criar `CNAME www → viniciusextremxd.github.io.`
2. Remover a linha `CNAME` do `.gitignore` e fazer `git add CNAME && git commit && git push`
3. Em *Settings → Pages*, confirmar o domínio e marcar **Enforce HTTPS**

## Dados do cliente usados no site

- Vendas: (19) 3268-8029 · WhatsApp: (19) 97404-2095
- E-mail: contato@extintorescondor.com.br
- Rua Ernesto Alves Filho, 908 — Jd. Campos Elíseos, Campinas/SP — CEP 13060-057
- CNPJ 67.870.006/0001-90 · Certificação Inmetro 003790/2013
- Horário: Seg–Qui 07h–17h · Sex 07h–16h
